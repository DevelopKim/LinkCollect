/**
 * 필터링 로직 테스트
 */

import { describe, it, expect } from 'vitest';
import { filterByDomain, matchesDomain, filterByMultipleDomains } from '../filter';
import type { LinkData } from '../../types';

describe('필터링 로직', () => {
  const mockLinks: LinkData[] = [
    { url: 'https://example.com/page1', text: 'Example 1', domain: 'example.com' },
    { url: 'https://www.example.com/page2', text: 'Example 2', domain: 'www.example.com' },
    { url: 'https://shop.example.com/page3', text: 'Shop', domain: 'shop.example.com' },
    { url: 'https://other.com/page1', text: 'Other 1', domain: 'other.com' },
    { url: 'https://test.com/page2', text: 'Test', domain: 'test.com' },
  ];

  describe('filterByDomain', () => {
    it('특정 도메인의 링크만 필터링해야 함', () => {
      const filtered = filterByDomain(mockLinks, 'example.com');
      
      expect(filtered.length).toBe(3);
      filtered.forEach(link => {
        expect(link.domain).toContain('example.com');
      });
    });

    it('빈 문자열이면 모든 링크를 반환해야 함', () => {
      const filtered = filterByDomain(mockLinks, '');
      expect(filtered.length).toBe(mockLinks.length);
    });

    it('일치하는 링크가 없으면 빈 배열을 반환해야 함', () => {
      const filtered = filterByDomain(mockLinks, 'nonexistent.com');
      expect(filtered.length).toBe(0);
    });

    it('대소문자를 무시해야 함', () => {
      const filtered = filterByDomain(mockLinks, 'EXAMPLE.COM');
      expect(filtered.length).toBe(3);
    });

    it('서브도메인을 포함해야 함', () => {
      const filtered = filterByDomain(mockLinks, 'example.com');
      
      const wwwLink = filtered.find(link => link.domain === 'www.example.com');
      const shopLink = filtered.find(link => link.domain === 'shop.example.com');
      
      expect(wwwLink).toBeDefined();
      expect(shopLink).toBeDefined();
    });
  });

  describe('matchesDomain', () => {
    it('도메인이 일치하면 true를 반환해야 함', () => {
      const link: LinkData = { url: 'https://example.com/page', text: 'Test', domain: 'example.com' };
      expect(matchesDomain(link, 'example.com')).toBe(true);
    });

    it('서브도메인이 일치하면 true를 반환해야 함', () => {
      const link: LinkData = { url: 'https://www.example.com/page', text: 'Test', domain: 'www.example.com' };
      expect(matchesDomain(link, 'example.com')).toBe(true);
    });

    it('도메인이 일치하지 않으면 false를 반환해야 함', () => {
      const link: LinkData = { url: 'https://other.com/page', text: 'Test', domain: 'other.com' };
      expect(matchesDomain(link, 'example.com')).toBe(false);
    });
  });

  describe('filterByMultipleDomains', () => {
    it('여러 도메인 중 하나라도 일치하면 포함해야 함', () => {
      const filtered = filterByMultipleDomains(mockLinks, ['example.com', 'other.com']);
      
      expect(filtered.length).toBe(4); // example.com 3개 + other.com 1개
    });

    it('빈 배열이면 모든 링크를 반환해야 함', () => {
      const filtered = filterByMultipleDomains(mockLinks, []);
      expect(filtered.length).toBe(mockLinks.length);
    });

    it('일치하는 도메인이 없으면 빈 배열을 반환해야 함', () => {
      const filtered = filterByMultipleDomains(mockLinks, ['nonexistent.com']);
      expect(filtered.length).toBe(0);
    });
  });
});

