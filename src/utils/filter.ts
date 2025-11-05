/**
 * 필터링 로직
 * 링크 데이터를 필터링하는 함수들
 */

import type { LinkData } from '../types';

/**
 * 도메인으로 링크를 필터링
 * 
 * @param links - 필터링할 링크 배열
 * @param domain - 필터링할 도메인 문자열 (빈 문자열이면 모든 링크 반환)
 * @returns 필터링된 링크 배열
 * 
 * @example
 * const filtered = filterByDomain(links, 'wowssa.co.kr');
 * // => 도메인에 'wowssa.co.kr'이 포함된 링크만 반환
 * 
 * const all = filterByDomain(links, '');
 * // => 모든 링크 반환 (필터링 없음)
 */
export function filterByDomain(links: LinkData[], domain: string): LinkData[] {
  // 빈 도메인 문자열이면 모든 링크 반환
  if (!domain || domain.trim() === '') {
    return links;
  }

  const domainLower = domain.trim().toLowerCase();

  return links.filter((link) => {
    // URL에 도메인 문자열이 포함되는지 확인
    const urlMatch = link.url.toLowerCase().includes(domainLower);
    
    // 도메인 필드에 도메인 문자열이 포함되는지 확인
    const domainMatch = link.domain.toLowerCase().includes(domainLower);

    return urlMatch || domainMatch;
  });
}

/**
 * 단일 링크가 도메인 필터와 일치하는지 확인
 * 
 * @param link - 확인할 링크
 * @param domain - 필터링할 도메인 문자열
 * @returns 일치 여부
 */
export function matchesDomain(link: LinkData, domain: string): boolean {
  if (!domain || domain.trim() === '') {
    return true; // 빈 필터는 모든 링크와 일치
  }

  const domainLower = domain.trim().toLowerCase();
  const urlLower = link.url.toLowerCase();
  const linkDomainLower = link.domain.toLowerCase();

  return urlLower.includes(domainLower) || linkDomainLower.includes(domainLower);
}

/**
 * 여러 도메인으로 필터링 (OR 조건)
 * 
 * @param links - 필터링할 링크 배열
 * @param domains - 필터링할 도메인 문자열 배열
 * @returns 필터링된 링크 배열
 * 
 * @example
 * const filtered = filterByMultipleDomains(links, ['example.com', 'test.com']);
 * // => 'example.com' 또는 'test.com'이 포함된 링크 반환
 */
export function filterByMultipleDomains(links: LinkData[], domains: string[]): LinkData[] {
  if (!domains || domains.length === 0) {
    return links;
  }

  // 빈 문자열 제거 및 정규화
  const validDomains = domains
    .map((d) => d.trim())
    .filter((d) => d.length > 0)
    .map((d) => d.toLowerCase());

  if (validDomains.length === 0) {
    return links;
  }

  return links.filter((link) => {
    const urlLower = link.url.toLowerCase();
    const domainLower = link.domain.toLowerCase();

    // 하나라도 일치하면 포함
    return validDomains.some((domain) => {
      return urlLower.includes(domain) || domainLower.includes(domain);
    });
  });
}

/**
 * 정규식 패턴으로 필터링 (향후 확장용)
 * 
 * @param links - 필터링할 링크 배열
 * @param pattern - 정규식 패턴 문자열
 * @param flags - 정규식 플래그 (기본값: 'i' - 대소문자 무시)
 * @returns 필터링된 링크 배열
 * 
 * @example
 * const filtered = filterByRegex(links, 'example\\.com');
 * // => 정규식 패턴과 일치하는 링크 반환
 */
export function filterByRegex(
  links: LinkData[],
  pattern: string,
  flags: string = 'i'
): LinkData[] {
  if (!pattern || pattern.trim() === '') {
    return links;
  }

  try {
    const regex = new RegExp(pattern.trim(), flags);

    return links.filter((link) => {
      return regex.test(link.url) || regex.test(link.domain);
    });
  } catch (error) {
    // 잘못된 정규식 패턴인 경우 모든 링크 반환
    console.warn('정규식 필터링 실패:', { pattern, error });
    return links;
  }
}

