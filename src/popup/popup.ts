/**
 * Popup 스크립트
 * 사용자 인터페이스와 상호작용하고 Content Script와 통신하는 로직
 */

import type { LinkData, ExtractLinksMessage, LinksExtractedMessage, ErrorMessage, Message } from '../types';
import { loadSettings, saveSettings, addRecentDomain, updateDomainFilter } from '../storage/settings';
// import { getFormat } from '../formats'; // 향후 다운로드 기능에서 사용 예정

// DOM 요소 참조
const domainFilterInput = document.getElementById('domainFilter') as HTMLInputElement;
// const useRegexCheckbox = document.getElementById('useRegex') as HTMLInputElement; // 향후 정규식 필터링 기능에서 사용 예정
const showPreviewCheckbox = document.getElementById('showPreview') as HTMLInputElement;
const extractButton = document.getElementById('extractButton') as HTMLButtonElement;
const previewSection = document.getElementById('previewSection') as HTMLElement;
const previewTitle = document.getElementById('previewTitle') as HTMLElement;
const linksList = document.getElementById('linksList') as HTMLElement;

// 현재 추출된 링크 상태
let currentLinks: LinkData[] = []; // 향후 다운로드 기능에서 사용 예정
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
  showPreviewCheckbox.addEventListener('change', handlePreviewToggle);
  domainFilterInput.addEventListener('input', handleDomainFilterChange);

  // Content Script로부터 메시지 수신
  chrome.runtime.onMessage.addListener(handleMessage);
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

    // Content Script에 링크 추출 요청 메시지 전송
    const message: ExtractLinksMessage = {
      action: 'extractLinks',
      domain: domainFilter,
    };

    chrome.tabs.sendMessage(tab.id, message, (response: LinksExtractedMessage | ErrorMessage | undefined) => {
      if (chrome.runtime.lastError) {
        console.error('메시지 전송 오류:', chrome.runtime.lastError.message);
        showError('링크 추출 중 오류가 발생했습니다: ' + chrome.runtime.lastError.message);
        resetExtractButton();
        return;
      }

      if (!response) {
        showError('링크 추출 응답을 받지 못했습니다.');
        resetExtractButton();
        return;
      }

      handleMessage(response);
    });

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
    currentLinks = linksMessage.links;
    currentFilteredLinks = linksMessage.filteredLinks;
    displayLinks(linksMessage.filteredLinks);
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
