/**
 * URL 유틸리티 함수 테스트
 * 테스트 환경 설정 확인용 간단한 테스트
 */

import { describe, it, expect } from 'vitest';
import { convertToAbsoluteUrl, extractDomain } from '../url-utils';

describe('URL 유틸리티 함수', () => {
  describe('convertToAbsoluteUrl', () => {
    it('상대 경로를 절대 URL로 변환해야 함', () => {
      const result = convertToAbsoluteUrl('/page', 'https://example.com/current');
      expect(result).toBe('https://example.com/page');
    });

    it('이미 절대 URL이면 그대로 반환해야 함', () => {
      const result = convertToAbsoluteUrl('https://example.com/page', 'https://other.com');
      expect(result).toBe('https://example.com/page');
    });

    it('프로토콜 상대 URL은 그대로 반환해야 함 (현재 구현)', () => {
      // 현재 구현에서는 프로토콜 상대 URL을 그대로 반환
      const result = convertToAbsoluteUrl('//example.com/page', 'https://other.com');
      expect(result).toBe('//example.com/page');
    });
  });

  describe('extractDomain', () => {
    it('정상적인 URL에서 도메인을 추출해야 함', () => {
      const result = extractDomain('https://www.example.com/path?query=1');
      expect(result).toBe('www.example.com');
    });

    it('서브도메인이 있는 경우 서브도메인을 포함해야 함', () => {
      const result = extractDomain('https://shop.example.com');
      expect(result).toBe('shop.example.com');
    });
  });
});

