/**
 * 링크 데이터 인터페이스
 * 추출된 링크의 정보를 담는 타입
 */
export interface LinkData {
  /** 링크의 절대 URL */
  url: string;
  /** 링크의 텍스트 내용 */
  text: string;
  /** 링크의 도메인 */
  domain: string;
}

/**
 * 사용자 설정 인터페이스
 * 확장 기능의 설정을 저장하는 타입
 */
export interface Settings {
  /** 도메인 필터 문자열 (예: "wowssa.co.kr") */
  domainFilter: string;
  /** 작업 모드: 미리보기 또는 즉시 다운로드 */
  mode: 'preview' | 'download';
  /** 최근 사용한 도메인 목록 */
  recentDomains: string[];
}

/**
 * 메시지 액션 타입
 * Popup과 Content Script 간 통신에 사용되는 메시지 타입
 */
export type MessageAction = 
  | 'extractLinks'      // Popup → Content Script: 링크 추출 요청
  | 'linksExtracted';   // Content Script → Popup: 링크 추출 완료

/**
 * 링크 추출 요청 메시지
 * Popup에서 Content Script로 보내는 메시지
 */
export interface ExtractLinksMessage {
  action: 'extractLinks';
  /** 필터링할 도메인 (빈 문자열이면 모든 링크) */
  domain: string;
}

/**
 * 링크 추출 완료 메시지
 * Content Script에서 Popup으로 보내는 메시지
 */
export interface LinksExtractedMessage {
  action: 'linksExtracted';
  /** 추출된 모든 링크 */
  links: LinkData[];
  /** 필터링된 링크 */
  filteredLinks: LinkData[];
}

/**
 * 에러 메시지
 * 에러 발생 시 전송되는 메시지
 */
export interface ErrorMessage {
  action: 'error';
  /** 에러 메시지 */
  message: string;
}

/**
 * 모든 메시지 타입의 유니온 타입
 */
export type Message = 
  | ExtractLinksMessage 
  | LinksExtractedMessage 
  | ErrorMessage;

/**
 * 기본 설정값
 */
export const DEFAULT_SETTINGS: Settings = {
  domainFilter: '',
  mode: 'preview',
  recentDomains: [],
};

