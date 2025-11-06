/**
 * Popup 스크립트
 * 사용자 인터페이스와 상호작용하고 Content Script와 통신하는 로직
 */

import type { LinkData, ExtractLinksMessage, LinksExtractedMessage, ErrorMessage, Message } from '../types';
import { loadSettings, saveSettings, addRecentDomain, updateDomainFilter } from '../storage/settings';
import { getFormat } from '../formats';

// DOM 요소 참조
const domainFilterInput = document.getElementById('domainFilter') as HTMLInputElement;
// const useRegexCheckbox = document.getElementById('useRegex') as HTMLInputElement; // 향후 정규식 필터링 기능에서 사용 예정
const showPreviewCheckbox = document.getElementById('showPreview') as HTMLInputElement;
const extractButton = document.getElementById('extractButton') as HTMLButtonElement;
const downloadButton = document.getElementById('downloadButton') as HTMLButtonElement;
const previewSection = document.getElementById('previewSection') as HTMLElement;
const previewTitle = document.getElementById('previewTitle') as HTMLElement;
const linksList = document.getElementById('linksList') as HTMLElement;

// 현재 추출된 링크 상태
let currentFilteredLinks: LinkData[] = [];

/**
 * Popup 초기화
 */
async function init(): Promise<void> {
  console.log('링크 추출기 Popup 로드됨');

  // 저장된 설정 로드
  const settings = await loadSettings();
  
  // UI에 설정 적용
  domainFilterInput.value = settings.domainFilter || '';
  showPreviewCheckbox.checked = settings.mode === 'preview';

  // 이벤트 리스너 등록
  extractButton.addEventListener('click', handleExtractClick);
  downloadButton.addEventListener('click', handleDownloadClick);
  showPreviewCheckbox.addEventListener('change', handlePreviewToggle);
  domainFilterInput.addEventListener('input', handleDomainFilterChange);

  // Content Script로부터 메시지 수신
  chrome.runtime.onMessage.addListener(handleMessage);
}

/**
 * Content Script를 동적으로 주입
 *
 * @param tabId - 주입할 탭 ID
 */
async function injectContentScript(tabId: number): Promise<void> {
  try {
    // manifest.json에 정의된 content script 파일 경로 가져오기
    // 빌드된 파일 경로를 사용해야 함
    const manifest = chrome.runtime.getManifest();
    const contentScripts = manifest.content_scripts?.[0];
    
    if (!contentScripts || !contentScripts.js || contentScripts.js.length === 0) {
      throw new Error('Content Script 파일을 찾을 수 없습니다.');
    }

    // 첫 번째 content script 파일 주입
    const scriptFile = contentScripts.js[0];
    
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [scriptFile],
    });
    
    // Content Script가 준비될 때까지 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (error) {
    console.error('Content Script 주입 실패:', error);
    throw new Error('Content Script 주입에 실패했습니다. 페이지를 새로고침한 후 다시 시도해주세요.');
  }
}

/**
 * Content Script에 링크 추출 메시지 전송
 *
 * @param tabId - 메시지를 보낼 탭 ID
 * @param domainFilter - 도메인 필터
 */
function sendExtractMessage(tabId: number, domainFilter: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const message: ExtractLinksMessage = {
      action: 'extractLinks',
      domain: domainFilter,
    };

    chrome.tabs.sendMessage(tabId, message, (response: LinksExtractedMessage | ErrorMessage | undefined) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!response) {
        reject(new Error('링크 추출 응답을 받지 못했습니다.'));
        return;
      }

      handleMessage(response);
      resolve();
    });
  });
}

/**
 * 추출 버튼 클릭 핸들러
 */
async function handleExtractClick(): Promise<void> {
  const domainFilter = domainFilterInput.value.trim();
  // const useRegex = useRegexCheckbox.checked; // 향후 정규식 필터링 기능에서 사용 예정
  // const showPreview = showPreviewCheckbox.checked; // 이미 showPreviewCheckbox.checked로 직접 사용

  // 버튼 비활성화 및 로딩 상태 표시
  extractButton.disabled = true;
  extractButton.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> 추출 중...';

  try {
    // 현재 활성 탭 정보 가져오기
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab.id) {
      throw new Error('활성 탭을 찾을 수 없습니다.');
    }

    // 특수 페이지 체크 (chrome://, chrome-extension:// 등)
    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('edge://'))) {
      throw new Error('특수 페이지에서는 링크를 추출할 수 없습니다. 일반 웹 페이지에서 사용해주세요.');
    }

    // Content Script가 로드되었는지 확인하고 필요시 주입
    try {
      // 먼저 메시지 전송 시도 (이미 로드된 경우)
      await sendExtractMessage(tab.id, domainFilter);
    } catch (error) {
      // Content Script가 없으면 동적으로 주입
      if (chrome.runtime.lastError?.message?.includes('Receiving end does not exist')) {
        console.log('Content Script가 로드되지 않음. 동적으로 주입 시도...');
        await injectContentScript(tab.id);
        // 주입 후 다시 메시지 전송
        await sendExtractMessage(tab.id, domainFilter);
      } else {
        throw error;
      }
    }

    // 설정 저장
    await updateDomainFilter(domainFilter);
    if (domainFilter) {
      await addRecentDomain(domainFilter);
    }
  } catch (error) {
    console.error('추출 버튼 클릭 오류:', error);
    showError(error instanceof Error ? error.message : '링크 추출 중 알 수 없는 오류가 발생했습니다.');
    resetExtractButton();
  }
}

/**
 * Content Script로부터 받은 메시지 처리
 */
function handleMessage(
  message: Message | LinksExtractedMessage | ErrorMessage,
  _sender?: chrome.runtime.MessageSender,
  _sendResponse?: (response?: any) => void
): boolean {
  if (message.action === 'linksExtracted') {
    const linksMessage = message as LinksExtractedMessage;
    currentFilteredLinks = linksMessage.filteredLinks;
    displayLinks(linksMessage.filteredLinks);
    
    // 즉시 다운로드 모드인 경우 자동 다운로드
    if (!showPreviewCheckbox.checked && currentFilteredLinks.length > 0) {
      downloadLinks(currentFilteredLinks);
    }
    
    resetExtractButton();
    return true;
  } else if (message.action === 'error') {
    const errorMessage = message as ErrorMessage;
    showError(errorMessage.message);
    resetExtractButton();
    return true;
  }
  return false;
}

/**
 * 링크 목록 표시
 */
function displayLinks(links: LinkData[]): void {
  const showPreview = showPreviewCheckbox.checked;

  // 미리보기 섹션 표시/숨김
  if (showPreview) {
    previewSection.style.display = 'block';
    previewTitle.textContent = `${links.length}개의 링크 미리보기`;
  } else {
    previewSection.style.display = 'none';
    return;
  }

  // 다운로드 버튼 표시/숨김
  if (links.length > 0) {
    downloadButton.style.display = 'flex';
  } else {
    downloadButton.style.display = 'none';
  }

  // 링크 목록 초기화
  linksList.innerHTML = '';

  if (links.length === 0) {
    // 빈 상태 표시
    const emptyState = document.createElement('div');
    emptyState.className = 'empty-state';
    emptyState.innerHTML = `
      <span class="material-symbols-outlined empty-icon">link_off</span>
      <p>필터링 조건에 맞는 링크가 없습니다.</p>
    `;
    linksList.appendChild(emptyState);
    return;
  }

  // 링크 아이템 생성
  links.forEach((link) => {
    const linkItem = createLinkItem(link);
    linksList.appendChild(linkItem);
  });
}

/**
 * 링크 아이템 DOM 요소 생성
 */
function createLinkItem(link: LinkData): HTMLElement {
  const linkItem = document.createElement('a');
  linkItem.className = 'link-item';
  linkItem.href = link.url;
  linkItem.target = '_blank';
  linkItem.rel = 'noopener noreferrer';

  linkItem.innerHTML = `
    <div class="link-item-content">
      <div class="link-icon-wrapper">
        <span class="material-symbols-outlined">link</span>
      </div>
      <p class="link-url" title="${link.url}">${escapeHtml(link.url)}</p>
    </div>
    <div class="shrink-0">
      <span class="link-open-icon material-symbols-outlined">open_in_new</span>
    </div>
  `;

  return linkItem;
}

/**
 * 미리보기 토글 핸들러
 */
async function handlePreviewToggle(): Promise<void> {
  const showPreview = showPreviewCheckbox.checked;
  
  if (showPreview) {
    previewSection.style.display = 'block';
    // 이미 추출된 링크가 있으면 다시 표시
    if (currentFilteredLinks.length > 0) {
      displayLinks(currentFilteredLinks);
    }
  } else {
    previewSection.style.display = 'none';
  }

  // 설정 저장
  const mode = showPreview ? 'preview' : 'download';
  await saveSettings({
    domainFilter: domainFilterInput.value.trim(),
    mode,
    recentDomains: [], // recentDomains는 별도로 관리
  });
}

/**
 * 도메인 필터 변경 핸들러
 */
async function handleDomainFilterChange(): Promise<void> {
  const domainFilter = domainFilterInput.value.trim();
  await updateDomainFilter(domainFilter);
}

/**
 * 다운로드 버튼 클릭 핸들러
 */
async function handleDownloadClick(): Promise<void> {
  if (currentFilteredLinks.length === 0) {
    showError('다운로드할 링크가 없습니다.');
    return;
  }

  try {
    downloadLinks(currentFilteredLinks);
  } catch (error) {
    console.error('다운로드 오류:', error);
    showError(error instanceof Error ? error.message : '다운로드 중 오류가 발생했습니다.');
  }
}

/**
 * 링크를 CSV 파일로 다운로드
 *
 * @param links - 다운로드할 링크 배열
 */
function downloadLinks(links: LinkData[]): void {
  if (links.length === 0) {
    showError('다운로드할 링크가 없습니다.');
    return;
  }

  try {
    const format = getFormat('csv');
    const filename = generateFilename();
    format.download(links, filename);
  } catch (error) {
    console.error('다운로드 오류:', error);
    showError(error instanceof Error ? error.message : '다운로드 중 오류가 발생했습니다.');
  }
}

/**
 * 다운로드할 파일명 생성
 * 현재 날짜와 시간을 포함한 파일명 반환
 *
 * @returns 파일명 (확장자 제외)
 */
function generateFilename(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  // 도메인 필터가 있으면 파일명에 포함
  const domainFilter = domainFilterInput.value.trim();
  if (domainFilter) {
    // 파일명에 사용할 수 없는 문자 제거
    const sanitizedDomain = domainFilter.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `links_${sanitizedDomain}_${year}${month}${day}_${hours}${minutes}${seconds}`;
  }

  return `links_${year}${month}${day}_${hours}${minutes}${seconds}`;
}

/**
 * 에러 메시지 표시
 */
function showError(message: string): void {
  // 간단한 알림으로 표시 (향후 개선 가능)
  console.error('에러:', message);
  alert(message);
}

/**
 * 추출 버튼 상태 초기화
 */
function resetExtractButton(): void {
  extractButton.disabled = false;
  extractButton.innerHTML = '<span class="material-symbols-outlined">file_download</span> 추출하기';
}

/**
 * HTML 이스케이프 (XSS 방지)
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Popup 로드 시 초기화
init().catch(console.error);
