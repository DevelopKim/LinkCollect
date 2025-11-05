/**
 * URL 유틸리티 함수
 * URL 처리 및 변환 관련 유틸리티 함수들
 */

/**
 * 상대 경로를 절대 URL로 변환
 * 
 * @param url - 변환할 URL (상대 경로 또는 절대 URL)
 * @param baseUrl - 기준이 되는 절대 URL (현재 페이지 URL)
 * @returns 절대 URL
 * 
 * @example
 * convertToAbsoluteUrl('/page', 'https://example.com/current')
 * // => 'https://example.com/page'
 * 
 * convertToAbsoluteUrl('../parent', 'https://example.com/current/page')
 * // => 'https://example.com/parent'
 * 
 * convertToAbsoluteUrl('https://example.com/page', 'https://other.com')
 * // => 'https://example.com/page' (이미 절대 URL이면 그대로 반환)
 */
export function convertToAbsoluteUrl(url: string, baseUrl: string): string {
  // 빈 문자열이나 잘못된 URL 처리
  if (!url || !baseUrl) {
    return url;
  }

  try {
    // 이미 절대 URL인 경우 (http://, https://, // 등으로 시작)
    if (/^(https?:|\/\/)/i.test(url)) {
      return url;
    }

    // baseUrl을 URL 객체로 변환
    const base = new URL(baseUrl);

    // 상대 경로를 절대 URL로 변환
    const absoluteUrl = new URL(url, base.href);

    return absoluteUrl.href;
  } catch (error) {
    // URL 파싱 실패 시 원본 URL 반환
    console.warn('URL 변환 실패:', { url, baseUrl, error });
    return url;
  }
}

/**
 * URL에서 도메인을 추출
 * 
 * @param url - 도메인을 추출할 URL
 * @returns 도메인 문자열 (예: 'example.com')
 * 
 * @example
 * extractDomain('https://www.example.com/page')
 * // => 'example.com'
 * 
 * extractDomain('https://subdomain.example.co.kr/path')
 * // => 'example.co.kr'
 * 
 * extractDomain('http://localhost:3000')
 * // => 'localhost'
 */
export function extractDomain(url: string): string {
  if (!url) {
    return '';
  }

  try {
    // URL이 상대 경로인 경우 처리
    let absoluteUrl = url;
    if (!/^(https?:|\/\/)/i.test(url)) {
      // 상대 경로인 경우 현재 페이지 URL을 기준으로 변환 시도
      // Content Script에서는 window.location.href를 사용할 수 있음
      if (typeof window !== 'undefined' && window.location) {
        absoluteUrl = convertToAbsoluteUrl(url, window.location.href);
      } else {
        return '';
      }
    }

    const urlObj = new URL(absoluteUrl);
    let hostname = urlObj.hostname;

    // www. 제거 (선택사항)
    // hostname = hostname.replace(/^www\./i, '');

    return hostname;
  } catch (error) {
    // URL 파싱 실패 시 빈 문자열 반환
    console.warn('도메인 추출 실패:', { url, error });
    return '';
  }
}

/**
 * URL이 유효한지 검증
 * 
 * @param url - 검증할 URL
 * @returns 유효한 URL인지 여부
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    // 절대 URL인 경우
    if (/^(https?:|\/\/)/i.test(url)) {
      new URL(url);
      return true;
    }

    // 상대 경로인 경우도 유효한 것으로 간주
    // (실제로는 base URL과 함께 사용되어야 함)
    return url.length > 0;
  } catch {
    return false;
  }
}

/**
 * URL 정규화 (프로토콜, 슬래시 등 통일)
 * 
 * @param url - 정규화할 URL
 * @returns 정규화된 URL
 */
export function normalizeUrl(url: string): string {
  if (!url) {
    return '';
  }

  try {
    // 이미 절대 URL인 경우
    if (/^(https?:|\/\/)/i.test(url)) {
      const urlObj = new URL(url);
      // 프로토콜을 소문자로, 호스트를 소문자로
      return urlObj.href;
    }

    return url;
  } catch {
    return url;
  }
}

