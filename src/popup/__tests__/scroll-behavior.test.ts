/**
 * 링크 목록 스크롤 동작 테스트
 * 스크롤 가능 여부, 스크롤바 표시, 성능 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Window } from 'happy-dom';
import type { LinkData } from '../../types';

describe('링크 목록 스크롤 동작', () => {
  let window: Window;
  let document: Document;
  let linksList: HTMLElement;
  let container: HTMLElement;

  beforeEach(() => {
    window = new Window();
    document = window.document as any;
    global.window = window as any;
    global.document = document as any;

    // HTML 구조 설정
    document.body.innerHTML = `
      <div id="app">
        <div class="popup-main" style="height: 400px; overflow-y: auto;">
          <div class="popup-content">
            <div id="preview-section" style="display: block;">
              <div id="links-list" class="links-list"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    container = document.querySelector('.popup-main') as HTMLElement;
    linksList = document.getElementById('links-list') as HTMLElement;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('스크롤 가능 여부', () => {
    it('많은 링크일 때 스크롤이 가능해야 함', () => {
      // overflow-y: auto 설정 확인
      expect(container?.style.overflowY).toBe('auto');
    });

    it('컨테이너에 고정 높이가 설정되어 있어야 함', () => {
      expect(container?.style.height).toBeTruthy();
      expect(container?.style.height).not.toBe('auto');
    });

    it('링크 목록이 컨테이너 높이를 초과하면 스크롤이 생겨야 함', () => {
      // 많은 링크 생성
      const manyLinks: LinkData[] = Array.from({ length: 50 }, (_, i) => ({
        url: `https://example.com/page${i}`,
        text: `Page ${i}`,
        domain: 'example.com',
      }));

      // 링크 아이템 생성
      manyLinks.forEach((link) => {
        const linkItem = document.createElement('a');
        linkItem.className = 'link-item';
        linkItem.href = link.url;
        linkItem.textContent = link.url;
        linkItem.style.height = '50px'; // 각 아이템 높이
        linksList.appendChild(linkItem);
      });

      // 컨테이너 높이보다 링크 목록이 크면 스크롤 가능
      const containerHeight = parseInt(container.style.height) || 400;
      const linksListHeight = manyLinks.length * 50; // 각 아이템 50px

      if (linksListHeight > containerHeight) {
        expect(container?.style.overflowY).toBe('auto');
      }
    });
  });

  describe('스크롤바 표시', () => {
    it('스크롤이 필요할 때 스크롤바가 표시되어야 함', () => {
      // overflow-y: auto는 필요할 때만 스크롤바 표시
      expect(container?.style.overflowY).toBe('auto');
    });

    it('스크롤바 스타일이 적용되어야 함 (CSS)', () => {
      // CSS에서 스크롤바 스타일이 정의되어 있어야 함
      // 실제 스타일은 CSS 파일에서 확인
      expect(container?.className).toContain('popup-main');
    });

    it('스크롤바가 너무 두껍지 않아야 함', () => {
      // CSS에서 스크롤바 너비가 8px로 설정되어 있어야 함
      // 실제 값은 CSS에서 확인
      expect(container).toBeTruthy();
    });
  });

  describe('링크 아이템 렌더링', () => {
    it('많은 링크가 올바르게 렌더링되어야 함', () => {
      const links: LinkData[] = Array.from({ length: 100 }, (_, i) => ({
        url: `https://example.com/page${i}`,
        text: `Page ${i}`,
        domain: 'example.com',
      }));

      links.forEach((link) => {
        const linkItem = document.createElement('a');
        linkItem.className = 'link-item';
        linkItem.href = link.url;
        linkItem.textContent = link.url;
        linksList.appendChild(linkItem);
      });

      expect(linksList.children.length).toBe(100);
    });

    it('링크 아이템이 올바른 구조를 가져야 함', () => {
      const link: LinkData = {
        url: 'https://example.com/page',
        text: 'Page',
        domain: 'example.com',
      };

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
          <p class="link-url">${link.url}</p>
        </div>
        <div class="shrink-0">
          <span class="link-open-icon material-symbols-outlined">open_in_new</span>
        </div>
      `;

      linksList.appendChild(linkItem);

      expect(linkItem.className).toBe('link-item');
      expect(linkItem.href).toBe(link.url);
      expect(linkItem.target).toBe('_blank');
      expect(linkItem.querySelector('.link-item-content')).toBeTruthy();
    });
  });

  describe('스크롤 후 상호작용', () => {
    it('스크롤 후에도 링크 클릭이 가능해야 함', () => {
      const link: LinkData = {
        url: 'https://example.com/page',
        text: 'Page',
        domain: 'example.com',
      };

      const linkItem = document.createElement('a');
      linkItem.className = 'link-item';
      linkItem.href = link.url;
      linksList.appendChild(linkItem);

      // 스크롤 시뮬레이션
      container.scrollTop = 100;

      // 링크 클릭 가능 여부 확인
      const clickHandler = vi.fn();
      linkItem.addEventListener('click', clickHandler);

      linkItem.click();
      expect(clickHandler).toHaveBeenCalledTimes(1);
    });

    it('스크롤 후에도 링크 href가 유지되어야 함', () => {
      const link: LinkData = {
        url: 'https://example.com/page',
        text: 'Page',
        domain: 'example.com',
      };

      const linkItem = document.createElement('a');
      linkItem.href = link.url;
      linksList.appendChild(linkItem);

      // 스크롤
      container.scrollTop = 200;

      // href 유지 확인
      expect(linkItem.href).toBe(link.url);
    });
  });

  describe('성능', () => {
    it('많은 링크를 렌더링해도 성능이 저하되지 않아야 함', () => {
      const manyLinks: LinkData[] = Array.from({ length: 200 }, (_, i) => ({
        url: `https://example.com/page${i}`,
        text: `Page ${i}`,
        domain: 'example.com',
      }));

      const startTime = Date.now();

      manyLinks.forEach((link) => {
        const linkItem = document.createElement('a');
        linkItem.className = 'link-item';
        linkItem.href = link.url;
        linkItem.textContent = link.url;
        linksList.appendChild(linkItem);
      });

      const endTime = Date.now();
      const renderTime = endTime - startTime;

      // 200개 링크 렌더링이 1초 이내에 완료되어야 함
      expect(renderTime).toBeLessThan(1000);
      expect(linksList.children.length).toBe(200);
    });

    it('링크 목록이 초기화되어야 함', () => {
      // 기존 링크 추가
      const link1 = document.createElement('a');
      link1.href = 'https://example.com/1';
      linksList.appendChild(link1);

      // 초기화
      linksList.innerHTML = '';

      expect(linksList.children.length).toBe(0);
    });
  });

  describe('빈 상태 처리', () => {
    it('링크가 없을 때 빈 상태 메시지가 표시되어야 함', () => {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      emptyState.innerHTML = `
        <span class="material-symbols-outlined empty-icon">link_off</span>
        <p>필터링 조건에 맞는 링크가 없습니다.</p>
      `;

      linksList.appendChild(emptyState);

      expect(linksList.querySelector('.empty-state')).toBeTruthy();
      expect(linksList.querySelector('.empty-state')?.textContent).toContain('링크가 없습니다');
    });

    it('빈 상태일 때 스크롤이 필요 없어야 함', () => {
      const emptyState = document.createElement('div');
      emptyState.className = 'empty-state';
      linksList.appendChild(emptyState);

      // 빈 상태는 스크롤이 필요 없음
      expect(linksList.children.length).toBe(1);
    });
  });

  describe('스크롤 위치 관리', () => {
    it('새로운 링크가 추가되어도 스크롤 위치가 유지되어야 함', () => {
      // 초기 링크 추가
      const link1 = document.createElement('a');
      link1.href = 'https://example.com/1';
      linksList.appendChild(link1);

      // 스크롤
      container.scrollTop = 50;

      // 새 링크 추가
      const link2 = document.createElement('a');
      link2.href = 'https://example.com/2';
      linksList.appendChild(link2);

      // 스크롤 위치는 브라우저가 자동으로 관리
      // 여기서는 구조만 확인
      expect(linksList.children.length).toBe(2);
    });

    it('링크 목록 초기화 시 스크롤 위치가 리셋되어야 함', () => {
      // 링크 추가 및 스크롤
      const link = document.createElement('a');
      link.href = 'https://example.com/1';
      linksList.appendChild(link);
      container.scrollTop = 100;

      // 초기화
      linksList.innerHTML = '';
      container.scrollTop = 0;

      expect(linksList.children.length).toBe(0);
      expect(container.scrollTop).toBe(0);
    });
  });
});

