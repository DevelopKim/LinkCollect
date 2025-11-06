/**
 * Content Script
 * 웹 페이지의 DOM에서 링크를 추출하고 Popup과 통신하는 스크립트
 */

import type { ExtractLinksMessage, LinksExtractedMessage, ErrorMessage, Message } from '../types';
import { extractLinks } from '../utils/link-extractor';
import { filterByDomain } from '../utils/filter';

// Content Script 로드 확인
console.log('링크 수집기 Content Script 로드됨');

/**
 * 링크 추출 요청 처리
 * 
 * @param message - Popup에서 받은 메시지
 * @param sendResponse - 응답 전송 함수
 * @returns true (비동기 응답을 위해)
 */
async function handleExtractLinks(
  message: ExtractLinksMessage,
  sendResponse: (response: LinksExtractedMessage | ErrorMessage) => void
): Promise<boolean> {
  try {
    const { domain } = message;

    // 페이지의 모든 링크 추출
    const allLinks = await extractLinks();

    // 도메인 필터링 적용
    const filteredLinks = filterByDomain(allLinks, domain);

    // 결과를 Popup으로 전송
    const response: LinksExtractedMessage = {
      action: 'linksExtracted',
      links: allLinks,
      filteredLinks: filteredLinks,
    };

    sendResponse(response);
    return true; // 비동기 응답을 위해 true 반환
  } catch (error) {
    // 에러 발생 시 에러 메시지 전송
    const errorResponse: ErrorMessage = {
      action: 'error',
      message: error instanceof Error ? error.message : '링크 추출 중 알 수 없는 오류가 발생했습니다.',
    };

    sendResponse(errorResponse);
    return true;
  }
}

/**
 * 메시지 리스너 등록
 * Popup에서 보낸 메시지를 수신하고 처리
 */
chrome.runtime.onMessage.addListener(
  (
    message: Message,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (response: LinksExtractedMessage | ErrorMessage) => void
  ): boolean => {
    // 메시지 타입에 따라 분기 처리
    switch (message.action) {
      case 'extractLinks':
        // 비동기 처리를 위해 Promise 반환
        handleExtractLinks(message, sendResponse);
        return true; // 비동기 응답을 위해 true 반환

      default:
        // 알 수 없는 액션인 경우 에러 메시지 전송
        const errorResponse: ErrorMessage = {
          action: 'error',
          message: `알 수 없는 메시지 액션: ${(message as any).action}`,
        };
        sendResponse(errorResponse);
        return false;
    }
  }
);
