/**
 * 포맷 팩토리
 * 포맷 등록 및 관리
 */

import type { IFormat } from './base-format';
import { CsvFormat } from './csv-format';

/**
 * 등록된 포맷 목록
 */
export const formats: Record<string, IFormat> = {
  csv: new CsvFormat(),
  // 향후 추가: json, txt, excel 등
};

/**
 * 포맷 이름으로 포맷 인스턴스 가져오기
 * 
 * @param formatName - 포맷 이름 (예: 'csv', 'json')
 * @returns 포맷 인스턴스 (없으면 기본값: CSV)
 * 
 * @example
 * const format = getFormat('csv');
 * format.download(links, 'my-links');
 */
export function getFormat(formatName: string): IFormat {
  const format = formats[formatName.toLowerCase()];
  return format || formats.csv; // 기본값: CSV
}

/**
 * 사용 가능한 모든 포맷 목록 가져오기
 * 
 * @returns 포맷 이름 배열
 */
export function getAvailableFormats(): string[] {
  return Object.keys(formats);
}

/**
 * 포맷 이름으로 포맷 존재 여부 확인
 * 
 * @param formatName - 확인할 포맷 이름
 * @returns 포맷 존재 여부
 */
export function hasFormat(formatName: string): boolean {
  return formatName.toLowerCase() in formats;
}

