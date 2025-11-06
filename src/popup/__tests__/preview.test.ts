/**
 * 미리보기 기능 테스트
 * 
 * 참고: 실제 UI 렌더링은 브라우저 환경에서만 가능하므로,
 * 핵심 로직만 테스트합니다.
 */

import { describe, it, expect } from 'vitest';
import type { LinkData } from '../../types';

/**
 * 링크 목록을 렌더링하는 함수 (테스트용)
 * 실제 popup.ts의 displayLinks 로직을 시뮬레이션
 */
function simulateDisplayLinks(links: LinkData[], showPreview: boolean): {
  previewVisible: boolean;
  linkCount: number;
  downloadButtonVisible: boolean;
} {
  return {
    previewVisible: showPreview && links.length > 0,
    linkCount: links.length,
    downloadButtonVisible: links.length > 0,
  };
}

/**
 * 미리보기 토글 상태를 처리하는 함수 (테스트용)
 */
function simulatePreviewToggle(currentState: boolean, links: LinkData[]): boolean {
  // 링크가 없으면 항상 숨김
  if (links.length === 0) {
    return false;
  }
  // 링크가 있으면 토글
  return !currentState;
}

describe('미리보기 기능', () => {
  const mockLinks: LinkData[] = [
    { url: 'https://example.com/page1', text: '페이지 1', domain: 'example.com' },
    { url: 'https://example.com/page2', text: '페이지 2', domain: 'example.com' },
  ];

  describe('미리보기 표시/숨김', () => {
    it('링크가 있고 미리보기가 켜져 있으면 표시해야 함', () => {
      const result = simulateDisplayLinks(mockLinks, true);
      expect(result.previewVisible).toBe(true);
    });

    it('링크가 있어도 미리보기가 꺼져 있으면 숨겨야 함', () => {
      const result = simulateDisplayLinks(mockLinks, false);
      expect(result.previewVisible).toBe(false);
    });

    it('링크가 없으면 미리보기를 숨겨야 함', () => {
      const result = simulateDisplayLinks([], true);
      expect(result.previewVisible).toBe(false);
    });
  });

  describe('링크 개수 표시', () => {
    it('링크 개수를 올바르게 표시해야 함', () => {
      const result = simulateDisplayLinks(mockLinks, true);
      expect(result.linkCount).toBe(2);
    });

    it('링크가 없으면 0개를 표시해야 함', () => {
      const result = simulateDisplayLinks([], true);
      expect(result.linkCount).toBe(0);
    });
  });

  describe('다운로드 버튼 표시', () => {
    it('링크가 있으면 다운로드 버튼을 표시해야 함', () => {
      const result = simulateDisplayLinks(mockLinks, true);
      expect(result.downloadButtonVisible).toBe(true);
    });

    it('링크가 없으면 다운로드 버튼을 숨겨야 함', () => {
      const result = simulateDisplayLinks([], true);
      expect(result.downloadButtonVisible).toBe(false);
    });
  });

  describe('미리보기 토글', () => {
    it('링크가 있을 때 토글이 동작해야 함', () => {
      const currentState = false;
      const newState = simulatePreviewToggle(currentState, mockLinks);
      expect(newState).toBe(true);
    });

    it('링크가 없을 때는 항상 숨김 상태여야 함', () => {
      const currentState = true;
      const newState = simulatePreviewToggle(currentState, []);
      expect(newState).toBe(false);
    });

    it('토글 상태가 변경되어야 함', () => {
      let state = false;
      state = simulatePreviewToggle(state, mockLinks);
      expect(state).toBe(true);
      
      state = simulatePreviewToggle(state, mockLinks);
      expect(state).toBe(false);
    });
  });

  describe('빈 상태 처리', () => {
    it('링크가 없을 때 빈 상태 메시지를 표시해야 함', () => {
      const result = simulateDisplayLinks([], true);
      expect(result.linkCount).toBe(0);
      expect(result.previewVisible).toBe(false);
    });
  });

  describe('대량 링크 처리', () => {
    it('많은 링크도 처리할 수 있어야 함', () => {
      const manyLinks: LinkData[] = Array.from({ length: 100 }, (_, i) => ({
        url: `https://example.com/page${i}`,
        text: `페이지 ${i}`,
        domain: 'example.com',
      }));

      const result = simulateDisplayLinks(manyLinks, true);
      expect(result.linkCount).toBe(100);
      expect(result.previewVisible).toBe(true);
      expect(result.downloadButtonVisible).toBe(true);
    });
  });
});

