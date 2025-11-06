/**
 * 포맷 시스템 인터페이스
 * 다양한 출력 포맷을 위한 기본 인터페이스
 */

import type { LinkData } from '../types';

/**
 * 포맷 인터페이스
 * 모든 포맷 클래스가 구현해야 하는 인터페이스
 */
export interface IFormat {
  /** 포맷 이름 (예: 'CSV', 'JSON') */
  name: string;
  
  /** 파일 확장자 (예: 'csv', 'json') */
  extension: string;
  
  /**
   * 링크 데이터를 포맷에 맞는 문자열 또는 Blob으로 변환
   * 
   * @param links - 변환할 링크 배열
   * @returns 변환된 데이터 (문자열 또는 Blob)
   */
  convert(links: LinkData[]): string | Blob;
  
  /**
   * 링크 데이터를 파일로 다운로드
   * 
   * @param links - 다운로드할 링크 배열
   * @param filename - 파일명 (확장자 없이)
   */
  download(links: LinkData[], filename: string): void;
}

