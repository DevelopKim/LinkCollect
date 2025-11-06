/**
 * CSV 포맷 구현
 * 링크 데이터를 CSV 형식으로 변환하고 다운로드하는 기능
 */

import type { LinkData } from '../types';
import type { IFormat } from './base-format';

/**
 * CSV 포맷 클래스
 * 링크 데이터를 CSV 형식으로 변환 및 다운로드
 */
export class CsvFormat implements IFormat {
  name = 'CSV';
  extension = 'csv';

  /**
   * 링크 데이터를 CSV 문자열로 변환
   * 
   * @param links - 변환할 링크 배열
   * @returns CSV 형식의 문자열
   */
  convert(links: LinkData[]): string {
    if (links.length === 0) {
      return '';
    }

    // CSV 헤더
    const headers = ['URL', '링크 텍스트', '도메인'];
    const headerRow = headers.join(',');

    // CSV 데이터 행 생성
    const rows = links.map((link) => {
      // CSV 필드 이스케이프 (쉼표, 따옴표, 개행 문자 처리)
      const url = this.escapeCsvField(link.url);
      const text = this.escapeCsvField(link.text);
      const domain = this.escapeCsvField(link.domain);

      return `${url},${text},${domain}`;
    });

    // 헤더와 데이터 행 결합
    return [headerRow, ...rows].join('\n');
  }

  /**
   * CSV 필드 이스케이프 처리
   * 쉼표, 따옴표, 개행 문자가 포함된 필드를 올바르게 이스케이프
   * 
   * @param field - 이스케이프할 필드 값
   * @returns 이스케이프된 필드 값
   */
  private escapeCsvField(field: string): string {
    if (field === null || field === undefined) {
      return '';
    }

    const fieldStr = String(field);

    // 쉼표, 따옴표, 개행 문자가 포함된 경우 따옴표로 감싸고 내부 따옴표는 이중화
    if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
      return `"${fieldStr.replace(/"/g, '""')}"`;
    }

    return fieldStr;
  }

  /**
   * 링크 데이터를 CSV 파일로 다운로드
   * 
   * @param links - 다운로드할 링크 배열
   * @param filename - 파일명 (확장자 없이, 기본값: 'links')
   */
  download(links: LinkData[], filename: string = 'links'): void {
    try {
      // CSV 변환
      const csv = this.convert(links);

      // BOM 추가 (UTF-8 BOM, Excel에서 한글 깨짐 방지)
      const bom = '\uFEFF';
      const csvWithBom = bom + csv;

      // Blob 생성
      const blob = new Blob([csvWithBom], {
        type: 'text/csv;charset=utf-8;',
      });

      // 다운로드 URL 생성
      const url = URL.createObjectURL(blob);

      // 다운로드 실행
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.${this.extension}`;
      document.body.appendChild(a);
      a.click();

      // 정리
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('CSV 다운로드 실패:', error);
      throw new Error('CSV 파일 다운로드에 실패했습니다.');
    }
  }
}

