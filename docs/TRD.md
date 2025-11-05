# TRD: 웹 페이지 링크 추출 크롬 확장 기능

## 1. 기술 개요

### 1.1 기술 스택
- **언어**: TypeScript (타입 안정성 확보)
- **빌드 도구**: Vite + CRXJS (번들링 및 개발 환경)
- **Manifest**: V3 (크롬 확장 기능 최신 표준)
- **UI 프레임워크**: Vanilla JS 또는 경량 프레임워크 (React 등 선택 가능)
- **스타일링**: CSS 또는 CSS-in-JS

### 1.2 크롬 확장 기능 아키텍처
- **Manifest V3** 기반 구조
- **Content Script**: 웹 페이지 DOM 접근 및 링크 추출
- **Popup/Sidebar**: 사용자 인터페이스
- **Background Service Worker**: 필요 시 백그라운드 작업 처리
- **Storage API**: 사용자 설정 저장

## 2. 프로젝트 구조

```
collect-links-app/
├── manifest.json              # 확장 기능 설정
├── package.json
├── tsconfig.json
├── vite.config.ts             # Vite + CRXJS 설정
├── src/
│   ├── background/
│   │   └── service-worker.ts  # Background Service Worker
│   ├── content/
│   │   └── content-script.ts  # Content Script (링크 추출 로직)
│   ├── popup/
│   │   ├── popup.html         # Popup UI HTML
│   │   ├── popup.ts           # Popup 로직
│   │   └── popup.css          # Popup 스타일
│   ├── utils/
│   │   ├── link-extractor.ts  # 링크 추출 유틸리티
│   │   ├── filter.ts          # 도메인 필터링 로직
│   │   └── url-utils.ts       # URL 처리 유틸리티
│   ├── formats/               # 포맷 출력 모듈 (확장 가능 구조)
│   │   ├── base-format.ts     # 포맷 인터페이스
│   │   ├── csv-format.ts      # CSV 포맷 구현
│   │   └── index.ts           # 포맷 팩토리
│   ├── storage/
│   │   └── settings.ts        # 설정 저장/로드 유틸리티
│   └── types/
│       └── index.ts           # TypeScript 타입 정의
├── icons/                     # 확장 기능 아이콘
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── dist/                      # 빌드 출력 디렉토리
```

## 3. 주요 컴포넌트 설계

### 3.1 Manifest.json
```json
{
  "manifest_version": 3,
  "name": "링크 수집기",
  "version": "1.0.0",
  "description": "웹 페이지에서 특정 도메인의 링크를 추출하여 다운로드합니다.",
  "permissions": [
    "activeTab",
    "storage"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content-script.js"],
      "run_at": "document_idle"
    }
  ],
  "background": {
    "service_worker": "service-worker.js"
  }
}
```

### 3.2 Content Script (content-script.ts)
**역할**: 웹 페이지의 DOM에서 링크를 추출

**주요 기능**:
- 페이지의 모든 `<a>` 태그 탐색
- `href` 속성 추출
- 상대 경로를 절대 URL로 변환
- 링크 텍스트 추출

**API**:
```typescript
interface LinkData {
  url: string;
  text: string;
  domain: string;
}

function extractAllLinks(): LinkData[]
function convertToAbsoluteUrl(url: string, baseUrl: string): string
```

### 3.3 Link Extractor (utils/link-extractor.ts)
**역할**: 링크 추출 로직 캡슐화

**주요 함수**:
```typescript
export function extractLinks(): Promise<LinkData[]>
export function filterByDomain(links: LinkData[], domain: string): LinkData[]
```

### 3.4 Filter (utils/filter.ts)
**역할**: 도메인 필터링 로직

**필터링 규칙**:
- 사용자가 입력한 도메인 문자열이 URL에 포함되는지 확인
- 대소문자 무시 비교
- 부분 문자열 매칭 (예: `wowssa.co.kr`이 `https://www.wowssa.co.kr/page`에 포함)

**향후 확장**:
- 정규식 패턴 지원
- 여러 도메인 동시 필터링
- 제외 도메인 설정

### 3.5 포맷 시스템 (formats/)
**확장 가능한 아키텍처 설계**

#### 3.5.1 Base Format Interface
```typescript
interface IFormat {
  name: string;
  extension: string;
  convert(links: LinkData[]): string | Blob;
  download(links: LinkData[], filename: string): void;
}
```

#### 3.5.2 CSV Format (formats/csv-format.ts)
```typescript
class CsvFormat implements IFormat {
  name = 'CSV';
  extension = 'csv';
  
  convert(links: LinkData[]): string {
    // CSV 변환 로직
    // 헤더: URL, 텍스트, 도메인
    // BOM 추가 (Excel 호환성)
  }
  
  download(links: LinkData[], filename: string): void {
    const csv = this.convert(links);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    // 다운로드 실행
  }
}
```

#### 3.5.3 Format Factory (formats/index.ts)
```typescript
export const formats = {
  csv: new CsvFormat(),
  // 향후 추가: json, txt, excel 등
};

export function getFormat(formatName: string): IFormat {
  return formats[formatName] || formats.csv;
}
```

### 3.6 Storage (storage/settings.ts)
**역할**: 사용자 설정 저장 및 로드

**저장 항목**:
- 도메인 필터 (기본값: 빈 문자열)
- 작업 모드 (기본값: 'preview' | 'download')
- 최근 사용한 도메인 목록

**API**:
```typescript
interface Settings {
  domainFilter: string;
  mode: 'preview' | 'download';
  recentDomains: string[];
}

export async function loadSettings(): Promise<Settings>
export async function saveSettings(settings: Settings): Promise<void>
```

### 3.7 Popup UI (popup/)
**역할**: 사용자 인터페이스

**UI 구성 요소**:
1. **도메인 필터 입력 필드**
   - 텍스트 입력
   - 자동완성 (최근 사용한 도메인)
   - 유효성 검사

2. **작업 모드 선택**
   - 라디오 버튼 또는 토글
   - 옵션: "미리보기" / "즉시 다운로드"

3. **추출 버튼**
   - 클릭 시 Content Script에 메시지 전송
   - 로딩 상태 표시

4. **결과 영역** (미리보기 모드)
   - 간략 정보: "n개의 링크가 추출되었습니다"
   - 상세 정보 토글 버튼
   - 링크 목록 (스크롤 가능)
   - 다운로드 버튼

**메시지 통신**:
```typescript
// Popup → Content Script
chrome.tabs.sendMessage(tabId, {
  action: 'extractLinks',
  domain: string
});

// Content Script → Popup
chrome.runtime.sendMessage({
  action: 'linksExtracted',
  links: LinkData[],
  filteredLinks: LinkData[]
});
```

## 4. 데이터 흐름

### 4.1 링크 추출 흐름
1. 사용자가 Popup에서 도메인 입력 및 추출 버튼 클릭
2. Popup이 현재 활성 탭의 Content Script에 메시지 전송
3. Content Script가 페이지의 모든 링크 추출
4. 도메인 필터 적용
5. 결과를 Popup에 메시지로 전송
6. Popup이 결과 표시 또는 즉시 다운로드

### 4.2 파일 다운로드 흐름
1. 사용자가 다운로드 버튼 클릭
2. 선택한 포맷으로 데이터 변환
3. Blob 생성
4. `URL.createObjectURL()`로 다운로드 URL 생성
5. `<a>` 태그를 동적으로 생성하여 다운로드 트리거
6. 메모리 정리 (URL.revokeObjectURL)

## 5. 기술적 고려사항

### 5.1 성능 최적화
- **대량 링크 처리**: 
  - 페이지에 수천 개의 링크가 있어도 5초 이내 처리
  - 필터링은 추출과 동시에 진행 (스트리밍 방식 고려)
  
- **메모리 관리**:
  - 큰 결과셋의 경우 가상 스크롤링 구현
  - Blob URL 적절한 시점에 해제

### 5.2 에러 처리
- **링크 추출 실패**: 
  - 네트워크 오류, DOM 접근 권한 오류 처리
  - 사용자에게 명확한 에러 메시지 표시

- **필터링 실패**:
  - 잘못된 도메인 입력 시 기본 동작 (모든 링크 추출 또는 경고)

- **다운로드 실패**:
  - 브라우저 다운로드 권한 문제 처리
  - 대안 제공 (복사 기능 등)

### 5.3 보안 고려사항
- **CSP (Content Security Policy)** 준수
- 사용자 입력 검증 (XSS 방지)
- 외부 리소스 로드 제한

### 5.4 호환성
- 크롬 브라우저 최신 버전 지원
- Manifest V3 표준 준수
- TypeScript 컴파일 타겟: ES2020

## 6. 개발 환경 설정

### 6.1 필수 도구
- Node.js 18+ 
- npm 또는 yarn
- TypeScript
- 크롬 브라우저 (확장 기능 로드용)

### 6.2 개발 스크립트
```json
{
  "scripts": {
    "dev": "vite build --watch",
    "build": "vite build",
    "type-check": "tsc --noEmit"
  }
}
```

**참고**: Vite + CRXJS 플러그인을 사용하므로 `@crxjs/vite-plugin` 설치 및 설정 필요

### 6.3 빌드 설정
- 각 모듈(background, content, popup)을 별도 진입점으로 번들링
- TypeScript 컴파일
- 소스맵 생성 (디버깅용)
- 프로덕션 빌드 시 코드 최적화

## 7. 테스트 전략

### 7.1 단위 테스트
- 링크 추출 로직
- 필터링 로직
- URL 변환 유틸리티
- 포맷 변환 로직

### 7.2 통합 테스트
- Content Script와 Popup 간 메시지 통신
- 설정 저장/로드
- 파일 다운로드 플로우

### 7.3 수동 테스트 시나리오
- 다양한 웹 페이지에서 링크 추출 테스트
- 대량 링크가 있는 페이지 테스트
- 상대 경로/절대 경로 혼합 페이지 테스트
- 필터링 정확도 검증

## 8. 배포 준비사항

### 8.1 패키징
- `dist/` 디렉토리 압축
- Chrome Web Store 제출용 zip 파일 생성

### 8.2 필수 파일
- manifest.json
- 아이콘 파일들 (16x16, 48x48, 128x128)
- 빌드된 JavaScript 파일들
- Popup HTML/CSS

### 8.3 문서화
- README.md (설치 및 사용법)
- CHANGELOG.md
- 라이선스 파일

## 9. 향후 확장을 위한 아키텍처 설계

### 9.1 포맷 추가 시
1. `formats/` 디렉토리에 새 포맷 클래스 생성
2. `IFormat` 인터페이스 구현
3. `formats/index.ts`에 등록
4. UI에 포맷 선택 옵션 추가

### 9.2 필터링 기능 확장 시
- 필터 인터페이스 정의
- 여러 필터를 체인으로 연결 가능한 구조
- 필터 설정 UI 확장

### 9.3 UI 개선 시
- 컴포넌트 기반 구조로 리팩토링 가능
- 필요 시 React/Vue 등 프레임워크 도입 고려

## 10. 제약사항 및 주의사항

### 10.1 Manifest V3 제약
- Background Script는 Service Worker로 변경 (영구 실행 불가)
- 메시지 통신 방식 변경
- 일부 API 제한

### 10.2 크로스 오리진 제약
- Content Script는 페이지의 DOM만 접근 가능
- 일부 JavaScript 변수 접근 제한

### 10.3 파일 시스템 접근
- 직접 파일 쓰기는 불가 (보안상 제약)
- Blob URL을 통한 다운로드만 가능
- 사용자가 다운로드 위치 선택

## 11. 구현 우선순위

### Phase 1: MVP (최소 기능 제품)
1. 기본 링크 추출 기능
2. 도메인 필터링
3. CSV 다운로드
4. 간단한 Popup UI

### Phase 2: 개선
1. 미리보기 기능
2. 설정 저장/로드
3. 에러 처리 강화
4. UI/UX 개선

### Phase 3: 확장
1. 추가 포맷 지원
2. 필터링 고급 기능
3. 성능 최적화
4. 배치 처리 기능
