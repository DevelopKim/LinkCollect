/**
 * 링크 추출 유틸리티 테스트
 * 실제 HTML을 사용한 통합 테스트
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { extractLinks, extractLinkText } from '../link-extractor';
import { filterByDomain } from '../filter';

/**
 * HTML 파일을 로드하고 DOM에 설정
 */
function setupDOM(htmlContent: string, baseUrl: string = 'https://example.com'): void {
  document.open();
  document.write(htmlContent);
  document.close();
  
  // window.location.href를 모킹하기 위해 URL을 설정
  // happy-dom에서는 Object.defineProperty를 사용하여 location 모킹
  Object.defineProperty(window, 'location', {
    value: new URL(baseUrl),
    writable: true,
  });
}

describe('링크 추출 유틸리티', () => {
  describe('extractLinks - 간단한 페이지', () => {
    beforeEach(() => {
      const html = readFileSync(
        join(__dirname, '../../../tests/fixtures/simple-page.html'),
        'utf-8'
      );
      setupDOM(html, 'https://example.com');
    });

    it('모든 링크를 추출해야 함', async () => {
      const links = await extractLinks();
      
      // mailto:, tel:는 제외되므로 5개 (홈, 소개, 외부, 더보기, 이메일/전화는 제외)
      expect(links.length).toBeGreaterThan(0);
      
      // 홈 링크 확인
      const homeLink = links.find(link => link.url.includes('/home'));
      expect(homeLink).toBeDefined();
      expect(homeLink?.url).toBe('https://example.com/home');
    });

    it('상대 경로를 절대 URL로 변환해야 함', async () => {
      const links = await extractLinks();
      
      const aboutLink = links.find(link => link.url.includes('/about'));
      expect(aboutLink?.url).toBe('https://example.com/about');
    });

    it('절대 URL은 그대로 유지해야 함', async () => {
      const links = await extractLinks();
      
      const externalLink = links.find(link => link.url.includes('example.com/external'));
      expect(externalLink?.url).toBe('https://example.com/external');
    });

    it('mailto:와 tel: 링크는 제외해야 함', async () => {
      const links = await extractLinks();
      
      const mailtoLink = links.find(link => link.url.startsWith('mailto:'));
      const telLink = links.find(link => link.url.startsWith('tel:'));
      
      expect(mailtoLink).toBeUndefined();
      expect(telLink).toBeUndefined();
    });
  });

  describe('extractLinks - 상대/절대 경로 혼합', () => {
    beforeEach(() => {
      const html = readFileSync(
        join(__dirname, '../../../tests/fixtures/mixed-paths.html'),
        'utf-8'
      );
      setupDOM(html, 'https://example.com/current/page');
    });

    it('상대 경로를 올바르게 변환해야 함', async () => {
      const links = await extractLinks();
      
      const relative1 = links.find(link => link.url.includes('/relative1'));
      expect(relative1?.url).toBe('https://example.com/relative1');
      
      const relative3 = links.find(link => link.url.includes('/current/relative3'));
      expect(relative3?.url).toBe('https://example.com/current/relative3');
    });

    it('중복 링크를 제거해야 함', async () => {
      const links = await extractLinks();
      
      const duplicateLinks = links.filter(link => link.url.includes('/duplicate'));
      expect(duplicateLinks.length).toBe(1); // 중복 제거되어야 함
    });

    it('다양한 경로 타입을 처리해야 함', async () => {
      const links = await extractLinks();
      
      // 절대 URL
      const absoluteLink = links.find(link => link.url === 'https://example.com/absolute1');
      expect(absoluteLink).toBeDefined();
      
      // 상대 경로
      const relativeLink = links.find(link => link.url.includes('/relative1'));
      expect(relativeLink).toBeDefined();
      
      // 다른 도메인
      const otherDomainLink = links.find(link => link.url.includes('other.com'));
      expect(otherDomainLink).toBeDefined();
    });
  });

  describe('extractLinks - 도메인 필터링', () => {
    beforeEach(() => {
      const html = readFileSync(
        join(__dirname, '../../../tests/fixtures/domain-filter.html'),
        'utf-8'
      );
      setupDOM(html, 'https://example.com');
    });

    it('특정 도메인의 링크만 필터링해야 함', async () => {
      const links = await extractLinks();
      const filtered = filterByDomain(links, 'example.com');
      
      // example.com 도메인의 링크만 포함
      filtered.forEach(link => {
        expect(link.domain).toContain('example.com');
      });
      
      // 다른 도메인은 제외
      const otherDomainLinks = filtered.filter(link => link.domain.includes('other.com'));
      expect(otherDomainLinks.length).toBe(0);
    });

    it('쿼리스트링의 도메인은 필터링에서 제외해야 함', async () => {
      const links = await extractLinks();
      const filtered = filterByDomain(links, 'example.com');
      
      // 쿼리스트링에 example.com이 포함된 링크는 제외되어야 함
      const queryLink = filtered.find(link => 
        link.url.includes('search.com') && link.url.includes('query=example.com')
      );
      expect(queryLink).toBeUndefined();
    });

    it('서브도메인을 포함해야 함', async () => {
      const links = await extractLinks();
      const filtered = filterByDomain(links, 'example.com');
      
      // www.example.com, shop.example.com 등은 포함되어야 함
      const wwwLink = filtered.find(link => link.domain === 'www.example.com');
      const shopLink = filtered.find(link => link.domain === 'shop.example.com');
      
      expect(wwwLink).toBeDefined();
      expect(shopLink).toBeDefined();
    });
  });

  describe('extractLinkText', () => {
    beforeEach(() => {
      setupDOM('<html><body></body></html>', 'https://example.com');
    });

    it('텍스트가 있는 링크에서 텍스트를 추출해야 함', () => {
      const anchor = document.createElement('a');
      anchor.href = '/page';
      anchor.textContent = '링크 텍스트';
      document.body.appendChild(anchor);
      
      const text = extractLinkText(anchor);
      expect(text).toBe('링크 텍스트');
    });

    it('이미지 alt 텍스트를 사용해야 함', () => {
      const anchor = document.createElement('a');
      anchor.href = '/page';
      const img = document.createElement('img');
      img.alt = '이미지 alt 텍스트';
      anchor.appendChild(img);
      document.body.appendChild(anchor);
      
      const text = extractLinkText(anchor);
      expect(text).toBe('이미지 alt 텍스트');
    });

    it('title 속성을 사용해야 함', () => {
      const anchor = document.createElement('a');
      anchor.href = '/page';
      anchor.title = '제목 속성';
      document.body.appendChild(anchor);
      
      const text = extractLinkText(anchor);
      expect(text).toBe('제목 속성');
    });

    it('공백을 정리해야 함', () => {
      const anchor = document.createElement('a');
      anchor.href = '/page';
      anchor.textContent = '   여러   공백이   있는   텍스트   ';
      document.body.appendChild(anchor);
      
      const text = extractLinkText(anchor);
      expect(text).toBe('여러 공백이 있는 텍스트');
    });
  });
});

