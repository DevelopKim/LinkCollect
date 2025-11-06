/**
 * CSV 포맷 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CsvFormat } from '../csv-format';
import type { LinkData } from '../../types';

describe('CsvFormat', () => {
  let csvFormat: CsvFormat;

  beforeEach(() => {
    csvFormat = new CsvFormat();
  });

  describe('convert', () => {
    it('빈 배열이면 빈 문자열을 반환해야 함', () => {
      const result = csvFormat.convert([]);
      expect(result).toBe('');
    });

    it('링크 데이터를 CSV 형식으로 변환해야 함', () => {
      const links: LinkData[] = [
        { url: 'https://example.com/page1', text: '페이지 1', domain: 'example.com' },
        { url: 'https://example.com/page2', text: '페이지 2', domain: 'example.com' },
      ];

      const result = csvFormat.convert(links);
      const lines = result.split('\n');

      expect(lines[0]).toBe('URL,링크 텍스트,도메인');
      expect(lines[1]).toBe('https://example.com/page1,페이지 1,example.com');
      expect(lines[2]).toBe('https://example.com/page2,페이지 2,example.com');
    });

    it('CSV 헤더를 포함해야 함', () => {
      const links: LinkData[] = [
        { url: 'https://example.com', text: '테스트', domain: 'example.com' },
      ];

      const result = csvFormat.convert(links);
      expect(result).toContain('URL,링크 텍스트,도메인');
    });

    it('쉼표가 포함된 필드를 이스케이프해야 함', () => {
      const links: LinkData[] = [
        { url: 'https://example.com', text: '테스트, 링크', domain: 'example.com' },
      ];

      const result = csvFormat.convert(links);
      expect(result).toContain('"테스트, 링크"');
    });

    it('따옴표가 포함된 필드를 이스케이프해야 함', () => {
      const links: LinkData[] = [
        { url: 'https://example.com', text: '테스트 "인용" 링크', domain: 'example.com' },
      ];

      const result = csvFormat.convert(links);
      // 따옴표는 이중화되어야 함
      expect(result).toContain('"테스트 ""인용"" 링크"');
    });

    it('개행 문자가 포함된 필드를 이스케이프해야 함', () => {
      const links: LinkData[] = [
        { url: 'https://example.com', text: '테스트\n링크', domain: 'example.com' },
      ];

      const result = csvFormat.convert(links);
      expect(result).toContain('"테스트\n링크"');
    });

    it('빈 텍스트 필드를 처리해야 함', () => {
      const links: LinkData[] = [
        { url: 'https://example.com', text: '', domain: 'example.com' },
      ];

      const result = csvFormat.convert(links);
      const lines = result.split('\n');
      expect(lines[1]).toBe('https://example.com,,example.com');
    });
  });

  describe('download', () => {
    beforeEach(() => {
      // DOM 환경 설정
      document.body.innerHTML = '';
    });

    it('링크 데이터를 CSV 파일로 다운로드해야 함', async () => {
      const links: LinkData[] = [
        { url: 'https://example.com/page1', text: '페이지 1', domain: 'example.com' },
      ];

      // URL.createObjectURL 모킹
      const mockUrl = 'blob:http://localhost/test';
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockUrl);
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

      // a 태그 클릭 모킹
      const mockAnchor = document.createElement('a');
      const clickSpy = vi.spyOn(mockAnchor, 'click');
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
      vi.spyOn(document.body, 'appendChild');
      vi.spyOn(document.body, 'removeChild');

      csvFormat.download(links, 'test-links');

      // Blob 생성 확인
      expect(createObjectURLSpy).toHaveBeenCalled();
      const blobCall = createObjectURLSpy.mock.calls[0][0] as Blob;
      expect(blobCall).toBeInstanceOf(Blob);
      expect(blobCall.type).toBe('text/csv;charset=utf-8;');

      // Blob 내용에 BOM 포함 확인
      const text = await blobCall.text();
      expect(text.charCodeAt(0)).toBe(0xFEFF); // UTF-8 BOM

      // 다운로드 클릭 확인
      expect(clickSpy).toHaveBeenCalled();

      // 정리 확인
      expect(revokeObjectURLSpy).toHaveBeenCalledWith(mockUrl);

      // 정리
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });

    it('BOM을 포함해야 함 (Excel에서 한글 깨짐 방지)', async () => {
      const links: LinkData[] = [
        { url: 'https://example.com', text: '테스트', domain: 'example.com' },
      ];

      const mockUrl = 'blob:http://localhost/test';
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockUrl);
      vi.spyOn(URL, 'revokeObjectURL');

      const mockAnchor = document.createElement('a');
      vi.spyOn(mockAnchor, 'click');
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
      vi.spyOn(document.body, 'appendChild');
      vi.spyOn(document.body, 'removeChild');

      csvFormat.download(links, 'test');

      // Blob 내용 확인
      const blob = createObjectURLSpy.mock.calls[0][0] as Blob;
      const text = await blob.text();
      
      // BOM (UTF-8 BOM: \uFEFF) 확인
      expect(text.charCodeAt(0)).toBe(0xFEFF);

      // 정리
      createObjectURLSpy.mockRestore();
    });

    it('파일명에 확장자가 올바르게 추가되어야 함', async () => {
      const links: LinkData[] = [
        { url: 'https://example.com', text: '테스트', domain: 'example.com' },
      ];

      const mockUrl = 'blob:http://localhost/test';
      vi.spyOn(URL, 'createObjectURL').mockReturnValue(mockUrl);
      vi.spyOn(URL, 'revokeObjectURL');

      // a 태그 생성 및 모킹
      const mockAnchor = document.createElement('a');
      const clickSpy = vi.spyOn(mockAnchor, 'click');
      vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor);
      vi.spyOn(document.body, 'appendChild');
      vi.spyOn(document.body, 'removeChild');

      csvFormat.download(links, 'test-filename');

      // download 속성 확인
      expect(mockAnchor.download).toBe('test-filename.csv');
      expect(clickSpy).toHaveBeenCalled();
    });

    it('에러 발생 시 예외를 던져야 함', () => {
      const links: LinkData[] = [
        { url: 'https://example.com', text: '테스트', domain: 'example.com' },
      ];

      // URL.createObjectURL을 실패하도록 모킹
      vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
        throw new Error('Blob URL 생성 실패');
      });

      expect(() => {
        csvFormat.download(links, 'test');
      }).toThrow('CSV 파일 다운로드에 실패했습니다.');
    });
  });
});

