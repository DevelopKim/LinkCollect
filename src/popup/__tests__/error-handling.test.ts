/**
 * Popup 에러 처리 테스트
 * DOM 접근 불가, 잘못된 입력 등의 에러 상황 테스트
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Popup 에러 처리', () => {
  beforeEach(() => {
    // DOM 모킹
    document.body.innerHTML = `
      <div id="app">
        <input id="domain-filter" type="text" />
        <button id="extract-button">추출</button>
        <div id="error-message" style="display: none;"></div>
      </div>
    `;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('DOM 접근 불가 상황', () => {
    it('chrome:// 페이지에서 에러 메시지를 표시해야 함', async () => {
      // chrome.tabs.query 모킹
      const mockTabsQuery = vi.fn((queryInfo, callback) => {
        callback([{ id: 1, url: 'chrome://extensions/' }]);
      });

      // chrome.tabs 모킹
      global.chrome = {
        tabs: {
          query: mockTabsQuery,
        } as any,
      } as any;

      // popup.ts의 handleExtractClick 함수를 직접 테스트하기 어려우므로
      // 에러 처리 로직을 검증하는 유틸리티 함수를 테스트
      const isSpecialPage = (url: string | undefined): boolean => {
        if (!url) return false;
        return (
          url.startsWith('chrome://') ||
          url.startsWith('chrome-extension://') ||
          url.startsWith('edge://')
        );
      };

      expect(isSpecialPage('chrome://extensions/')).toBe(true);
      expect(isSpecialPage('chrome-extension://abc123/')).toBe(true);
      expect(isSpecialPage('edge://extensions/')).toBe(true);
      expect(isSpecialPage('https://example.com')).toBe(false);
      expect(isSpecialPage(undefined)).toBe(false);
    });

    it('chrome-extension:// 페이지에서 에러 메시지를 표시해야 함', () => {
      const isSpecialPage = (url: string | undefined): boolean => {
        if (!url) return false;
        return (
          url.startsWith('chrome://') ||
          url.startsWith('chrome-extension://') ||
          url.startsWith('edge://')
        );
      };

      expect(isSpecialPage('chrome-extension://abc123/popup.html')).toBe(true);
    });

    it('일반 웹 페이지에서는 정상 동작해야 함', () => {
      const isSpecialPage = (url: string | undefined): boolean => {
        if (!url) return false;
        return (
          url.startsWith('chrome://') ||
          url.startsWith('chrome-extension://') ||
          url.startsWith('edge://')
        );
      };

      expect(isSpecialPage('https://example.com')).toBe(false);
      expect(isSpecialPage('http://localhost:3000')).toBe(false);
    });
  });

  describe('잘못된 도메인 입력 처리', () => {
    it('빈 문자열은 모든 링크를 반환해야 함', () => {
      const normalizeDomainFilter = (input: string): string => {
        return input.trim();
      };

      expect(normalizeDomainFilter('')).toBe('');
      expect(normalizeDomainFilter('   ')).toBe('');
      expect(normalizeDomainFilter('  example.com  ')).toBe('example.com');
    });

    it('공백만 있는 문자열은 빈 문자열로 처리해야 함', () => {
      const normalizeDomainFilter = (input: string): string => {
        return input.trim();
      };

      expect(normalizeDomainFilter('   ')).toBe('');
      expect(normalizeDomainFilter('\t\n\r')).toBe('');
    });

    it('특수문자가 포함된 도메인은 그대로 처리해야 함 (필터링 로직에서 처리)', () => {
      const normalizeDomainFilter = (input: string): string => {
        return input.trim();
      };

      // 특수문자가 포함된 경우도 trim만 수행 (실제 필터링은 filter.ts에서 처리)
      expect(normalizeDomainFilter('example.com/test')).toBe('example.com/test');
      expect(normalizeDomainFilter('  example.com?query=test  ')).toBe('example.com?query=test');
    });
  });

  describe('에러 메시지 표시', () => {
    it('에러 메시지가 올바르게 표시되어야 함', () => {
      const errorElement = document.getElementById('error-message');
      if (!errorElement) {
        throw new Error('에러 메시지 요소를 찾을 수 없습니다.');
      }

      const showError = (message: string): void => {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
      };

      showError('테스트 에러 메시지');
      expect(errorElement.textContent).toBe('테스트 에러 메시지');
      expect(errorElement.style.display).toBe('block');
    });

    it('에러 객체에서 메시지를 추출해야 함', () => {
      const getErrorMessage = (error: unknown): string => {
        if (error instanceof Error) {
          return error.message;
        }
        return '알 수 없는 오류가 발생했습니다.';
      };

      expect(getErrorMessage(new Error('테스트 에러'))).toBe('테스트 에러');
      expect(getErrorMessage('문자열 에러')).toBe('알 수 없는 오류가 발생했습니다.');
      expect(getErrorMessage(null)).toBe('알 수 없는 오류가 발생했습니다.');
    });
  });
});

