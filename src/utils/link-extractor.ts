/**
 * 링크 추출 유틸리티
 * 웹 페이지에서 링크를 추출하는 함수들
 */

import type { LinkData } from '../types';
import { convertToAbsoluteUrl, extractDomain } from './url-utils';

/**
 * 페이지의 모든 링크를 추출
 * 
 * @returns 추출된 링크 데이터 배열
 * 
 * @example
 * const links = await extractLinks();
 * // => [
 * //   { url: 'https://example.com/page', text: '제목', domain: 'example.com' },
 * //   ...
 * // ]
 */
export async function extractLinks(): Promise<LinkData[]> {
  // Content Script 환경에서만 실행 가능
  if (typeof document === 'undefined') {
    console.warn('extractLinks: document가 사용 불가능한 환경입니다.');
    return [];
  }

  try {
    const baseUrl = window.location.href;
    const allLinks: LinkData[] = [];
    const seenUrls = new Set<string>(); // 중복 제거용

    // 모든 <a> 태그 찾기
    const anchorElements = document.querySelectorAll<HTMLAnchorElement>('a[href]');
    const anchors = Array.from(anchorElements);

    for (const anchor of anchors) {
      try {
        const href = anchor.getAttribute('href');
        
        // href가 없거나 빈 문자열인 경우 스킵
        if (!href || typeof href !== 'string' || href.trim() === '') {
          continue;
        }

        // 절대 URL로 변환
        const absoluteUrl = convertToAbsoluteUrl(href, baseUrl);
        
        // 변환된 URL이 유효한 문자열인지 확인
        if (!absoluteUrl || typeof absoluteUrl !== 'string') {
          continue;
        }
        
        // 중복 URL 제거
        if (seenUrls.has(absoluteUrl)) {
          continue;
        }
        seenUrls.add(absoluteUrl);

        // 도메인 추출
        const domain = extractDomain(absoluteUrl);
        
        // 도메인이 추출되지 않은 경우 스킵 (javascript:, mailto:, tel: 등)
        if (!domain) {
          continue;
        }

        // 링크 텍스트 추출
        const text = extractLinkText(anchor);

        allLinks.push({
          url: absoluteUrl,
          text: text,
          domain: domain,
        });
      } catch (error) {
        // 개별 링크 처리 중 오류 발생 시 로그만 남기고 계속 진행
        const errorMessage = error instanceof Error ? error.message : String(error);
        const href = anchor?.getAttribute('href') || 'unknown';
        console.warn('링크 추출 중 오류:', { href, error: errorMessage });
      }
    }

    return allLinks;
  } catch (error) {
    console.error('링크 추출 실패:', error);
    return [];
  }
}

/**
 * 링크 요소에서 텍스트를 추출
 * 
 * @param anchor - <a> 태그 요소
 * @returns 추출된 텍스트 (공백 정리됨)
 * 
 * @example
 * // <a href="/page">제목</a> => "제목"
 * // <a href="/page"><span>제목</span></a> => "제목"
 * // <a href="/page"></a> => ""
 */
export function extractLinkText(anchor: HTMLAnchorElement): string {
  if (!anchor) {
    return '';
  }

  try {
    // textContent 사용 (모든 하위 요소의 텍스트 포함)
    let text = anchor.textContent || anchor.innerText || '';
    
    // 공백 정리 (여러 공백을 하나로, 앞뒤 공백 제거)
    text = text.trim().replace(/\s+/g, ' ');
    
    // alt 속성이 있는 이미지만 있는 경우 alt 텍스트 사용
    if (!text && anchor.querySelector('img')) {
      const img = anchor.querySelector('img');
      if (img && img.alt) {
        text = img.alt.trim();
      }
    }

    // title 속성이 있고 텍스트가 없는 경우 title 사용
    if (!text && anchor.title) {
      text = anchor.title.trim();
    }

    return text;
  } catch (error) {
    console.warn('링크 텍스트 추출 실패:', { anchor, error });
    return '';
  }
}

/**
 * 특정 선택자로 링크를 추출 (확장용)
 * 
 * @param selector - CSS 선택자 (기본값: 'a[href]')
 * @returns 추출된 링크 데이터 배열
 */
export async function extractLinksBySelector(selector: string = 'a[href]'): Promise<LinkData[]> {
  if (typeof document === 'undefined') {
    return [];
  }

  try {
    const baseUrl = window.location.href;
    const allLinks: LinkData[] = [];
    const seenUrls = new Set<string>();

    const elements = document.querySelectorAll<HTMLAnchorElement>(selector);
    const elementArray = Array.from(elements);

    for (const element of elementArray) {
      try {
        const href = element.getAttribute('href');
        if (!href || href.trim() === '') {
          continue;
        }

        const absoluteUrl = convertToAbsoluteUrl(href, baseUrl);
        
        if (seenUrls.has(absoluteUrl)) {
          continue;
        }
        seenUrls.add(absoluteUrl);

        const domain = extractDomain(absoluteUrl);
        if (!domain) {
          continue;
        }

        const text = extractLinkText(element);

        allLinks.push({
          url: absoluteUrl,
          text: text,
          domain: domain,
        });
      } catch (error) {
        console.warn('링크 추출 중 오류:', { element, error });
      }
    }

    return allLinks;
  } catch (error) {
    console.error('링크 추출 실패:', error);
    return [];
  }
}

