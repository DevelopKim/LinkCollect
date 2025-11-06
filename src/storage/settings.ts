/**
 * Storage 설정 관리 유틸리티
 * Chrome Storage API를 사용하여 사용자 설정을 저장하고 로드하는 함수들
 */

import { Settings, DEFAULT_SETTINGS } from '../types';

/**
 * Chrome Storage 키
 */
const STORAGE_KEY = 'linkCollectorSettings';

/**
 * 저장된 설정을 로드합니다.
 * 저장된 설정이 없으면 기본 설정을 반환합니다.
 *
 * @returns Settings 객체
 */
export async function loadSettings(): Promise<Settings> {
  try {
    const result = await chrome.storage.sync.get(STORAGE_KEY);

    if (result[STORAGE_KEY]) {
      // 저장된 설정이 있으면 병합 (기본값과 병합하여 누락된 필드 보완)
      return {
        ...DEFAULT_SETTINGS,
        ...result[STORAGE_KEY],
      };
    }

    // 저장된 설정이 없으면 기본 설정 반환
    return { ...DEFAULT_SETTINGS };
  } catch (error) {
    console.error('설정 로드 오류:', error);
    // 오류 발생 시 기본 설정 반환
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * 설정을 Chrome Storage에 저장합니다.
 *
 * @param settings - 저장할 Settings 객체
 */
export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await chrome.storage.sync.set({
      [STORAGE_KEY]: settings,
    });
  } catch (error) {
    console.error('설정 저장 오류:', error);
    throw error;
  }
}

/**
 * 특정 도메인을 최근 사용한 도메인 목록에 추가합니다.
 * 이미 목록에 있으면 맨 앞으로 이동하고, 없으면 맨 앞에 추가합니다.
 * 최대 10개까지만 유지합니다.
 *
 * @param domain - 추가할 도메인 문자열
 */
export async function addRecentDomain(domain: string): Promise<void> {
  if (!domain || domain.trim() === '') {
    return;
  }

  const settings = await loadSettings();
  const trimmedDomain = domain.trim();
  const recentDomains = settings.recentDomains || [];

  // 이미 존재하는 도메인 제거
  const filteredDomains = recentDomains.filter(d => d.toLowerCase() !== trimmedDomain.toLowerCase());

  // 맨 앞에 추가
  const updatedDomains = [trimmedDomain, ...filteredDomains];

  // 최대 10개까지만 유지
  const limitedDomains = updatedDomains.slice(0, 10);

  // 설정 업데이트
  await saveSettings({
    ...settings,
    recentDomains: limitedDomains,
  });
}

/**
 * 최근 사용한 도메인 목록을 가져옵니다.
 *
 * @returns 최근 사용한 도메인 문자열 배열
 */
export async function getRecentDomains(): Promise<string[]> {
  const settings = await loadSettings();
  return settings.recentDomains || [];
}

/**
 * 최근 사용한 도메인 목록을 초기화합니다.
 */
export async function clearRecentDomains(): Promise<void> {
  const settings = await loadSettings();
  await saveSettings({
    ...settings,
    recentDomains: [],
  });
}

/**
 * 도메인 필터만 업데이트합니다.
 *
 * @param domainFilter - 업데이트할 도메인 필터 문자열
 */
export async function updateDomainFilter(domainFilter: string): Promise<void> {
  const settings = await loadSettings();
  await saveSettings({
    ...settings,
    domainFilter: domainFilter.trim(),
  });
}

/**
 * 작업 모드만 업데이트합니다.
 *
 * @param mode - 업데이트할 작업 모드 ('preview' | 'download')
 */
export async function updateMode(mode: 'preview' | 'download'): Promise<void> {
  const settings = await loadSettings();
  await saveSettings({
    ...settings,
    mode,
  });
}

