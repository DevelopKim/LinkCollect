# 테스트 전략

## 테스트 접근 방법

크롬 확장 기능은 웹 애플리케이션과 달리 브라우저 환경에 의존하므로, 다양한 테스트 방법을 조합하여 사용합니다.

## 1. 단위 테스트 (Unit Tests)

### 대상
- 유틸리티 함수: `src/utils/*.ts`
- 포맷 변환 로직: `src/formats/*.ts`
- 필터링 로직: `src/utils/filter.ts`

### 테스트 도구
- **Vitest** (권장): Vite와 호환성이 좋고 설정이 간단
- 또는 Jest (Node.js 환경에서 테스트 가능)

### 테스트 가능한 항목
- ✅ URL 변환 함수 (`convertToAbsoluteUrl`)
- ✅ 도메인 추출 함수 (`extractDomain`)
- ✅ 필터링 함수 (`filterByDomain`, `matchesDomain`)
- ✅ CSV 포맷 변환 (`CsvFormat.convert`)
- ✅ 설정 저장/로드 로직 (Chrome Storage API 모킹)

### 예시
```typescript
// src/utils/url-utils.test.ts
import { describe, it, expect } from 'vitest';
import { convertToAbsoluteUrl } from './url-utils';

describe('convertToAbsoluteUrl', () => {
  it('상대 경로를 절대 URL로 변환해야 함', () => {
    expect(convertToAbsoluteUrl('/page', 'https://example.com/current'))
      .toBe('https://example.com/page');
  });
  
  it('이미 절대 URL이면 그대로 반환해야 함', () => {
    expect(convertToAbsoluteUrl('https://example.com/page', 'https://other.com'))
      .toBe('https://example.com/page');
  });
});
```

## 2. 수동 테스트 (Manual Testing)

### 대상
- 실제 웹페이지에서의 링크 추출
- UI/UX 검증
- 크롬 확장 기능 통합 동작

### 테스트 체크리스트

#### 기능 테스트
- [ ] 다양한 웹 페이지에서 링크 추출
  - 간단한 페이지 (적은 링크)
  - 복잡한 페이지 (많은 링크)
  - SPA (Single Page Application)
  - 동적으로 로드되는 링크
- [ ] 도메인 필터링 정확도
  - 정확한 도메인 매칭
  - 서브도메인 포함 여부
  - 쿼리스트링/경로의 도메인 제외 확인
- [ ] 상대 경로/절대 경로 혼합 페이지
  - `/page`, `../parent`, `https://example.com/page` 모두 포함된 페이지
- [ ] 대량 링크 페이지 성능
  - 1000개 이상의 링크가 있는 페이지
  - 추출 시간 측정
  - UI 반응성 확인
- [ ] CSV 다운로드 기능
  - 파일명 정확성
  - CSV 형식 정확성
  - Excel에서 한글 깨짐 없이 열리는지 확인
- [ ] 미리보기 기능
  - 토글 동작
  - 링크 목록 표시/숨김
  - 스크롤 동작
- [ ] 설정 저장/로드
  - 도메인 필터 저장
  - 미리보기 토글 상태 저장
  - 확장 기능 재시작 후 설정 유지 확인

#### 에러 처리 테스트
- [ ] DOM 접근 불가 상황
  - `chrome://` 페이지에서 동작 확인
  - `chrome-extension://` 페이지에서 동작 확인
- [ ] 잘못된 도메인 입력 처리
  - 빈 문자열
  - 특수문자 포함
  - 공백만 있는 문자열
- [ ] 다운로드 실패 상황
  - 브라우저 다운로드 권한 거부
- [ ] 네트워크 오류 상황
  - 오프라인 상태에서 동작 확인

#### UI/UX 검증
- [ ] 사이드 패널 UI 사용성
  - 레이아웃 정상 표시
  - 버튼 클릭 동작
  - 입력 필드 동작
- [ ] 로딩 상태 표시
  - 추출 중 로딩 표시 확인
  - 버튼 비활성화 확인
- [ ] 에러 메시지 가독성
  - 에러 발생 시 사용자가 이해할 수 있는 메시지 표시
- [ ] 링크 목록 스크롤 동작
  - 많은 링크일 때 스크롤 가능 여부
  - 스크롤 성능

## 3. 테스트용 웹페이지

### 추천 테스트 사이트

#### 간단한 테스트
- **Wikipedia**: 많은 링크, 다양한 도메인
- **GitHub**: 복잡한 DOM 구조
- **Reddit**: 동적 콘텐츠

#### 도메인 필터링 테스트
- **네이버**: `naver.com` 필터 테스트
- **구글**: `google.com` 필터 테스트
- **자체 사이트**: 테스트용 HTML 파일 생성

#### 성능 테스트
- **뉴스 사이트**: 많은 링크 포함
- **쇼핑몰**: 카테고리별 링크 많음

#### 상대/절대 경로 테스트
- 자체 테스트 HTML 파일 생성 권장

## 4. 테스트 환경 설정

### Vitest 설정

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
});
```

### Chrome Storage API 모킹

```typescript
// src/__mocks__/chrome-storage.ts
export const chrome = {
  storage: {
    sync: {
      get: vi.fn(),
      set: vi.fn(),
    },
  },
};
```

## 5. 테스트 실행 방법

### 단위 테스트
```bash
yarn test              # 테스트 실행
yarn test:watch        # 감시 모드
yarn test:coverage     # 커버리지 포함
```

### 수동 테스트
1. `yarn build` 또는 `yarn dev`로 빌드
2. Chrome 확장 프로그램 페이지에서 로드
3. 테스트 체크리스트에 따라 하나씩 확인
4. 결과를 기록

## 6. 테스트 결과 기록

각 테스트 항목에 대해:
- ✅ 통과
- ❌ 실패 (이유 기록)
- ⚠️ 부분 통과 (이유 기록)
- ⏭️ 스킵 (이유 기록)

테스트 결과는 별도 문서나 이슈 트래커에 기록하는 것을 권장합니다.

