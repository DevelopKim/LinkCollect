# GitHub 레포지토리 설정 가이드

## 레포지토리 이름

**권장 이름: `LinkCollect`**

- 간결하고 명확함
- 기능을 잘 표현 (링크 수집)
- GitHub에서 검색하기 쉬움
- npm 패키지 이름과 일치 (선택사항)

## 푸시 전 확인 사항

### ✅ .gitignore에 포함된 파일들 (푸시되지 않음)

다음 파일/디렉토리는 자동으로 제외됩니다:

- `node_modules/` - 의존성 패키지
- `dist/` - 빌드 산출물
- `coverage/` - 테스트 커버리지 리포트
- `.vite/` - Vite 캐시
- `.env*` - 환경 변수 파일
- `*.log` - 로그 파일
- `*.tmp`, `*.temp` - 임시 파일
- `.DS_Store` - macOS 시스템 파일
- `*.tsbuildinfo` - TypeScript 빌드 정보

### ✅ 푸시되어야 할 파일들

다음 파일들은 반드시 포함되어야 합니다:

- 소스 코드 (`src/`)
- 설정 파일 (`package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`)
- 문서 (`docs/`, `README.md`)
- 설정 파일 (`.gitignore`, `.gitattributes`, `.editorconfig`, `.nvmrc`)
- 아이콘 (`icons/`)
- 테스트 파일 (`src/**/__tests__/`, `tests/`)
- `manifest.json`
- `yarn.lock` (Yarn Berry 사용 시)

## package.json 추가 권장 사항

GitHub 레포지토리와 연결하기 위해 다음 필드를 추가하는 것을 권장합니다:

```json
{
  "name": "linkcollect",
  "repository": {
    "type": "git",
    "url": "https://github.com/YOUR_USERNAME/LinkCollect.git"
  },
  "bugs": {
    "url": "https://github.com/YOUR_USERNAME/LinkCollect/issues"
  },
  "homepage": "https://github.com/YOUR_USERNAME/LinkCollect#readme",
  "keywords": [
    "chrome-extension",
    "link-extractor",
    "link-collector",
    "web-scraping",
    "csv-export"
  ]
}
```

## GitHub 레포지토리 생성 후 작업 순서

1. GitHub에서 레포지토리 생성 (`LinkCollect`)
2. 로컬에서 원격 저장소 추가:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/LinkCollect.git
   ```
3. 브랜치 이름 확인 (보통 `main` 또는 `master`):
   ```bash
   git branch
   ```
4. 첫 푸시:
   ```bash
   git push -u origin main
   ```

## 주의사항

- **절대 푸시하지 말아야 할 것들:**
  - API 키나 비밀번호가 포함된 파일
  - 개인 정보가 포함된 파일
  - 빌드 산출물 (`dist/`)
  - 의존성 패키지 (`node_modules/`)

- **확인 방법:**
  ```bash
  # 푸시 전에 확인
  git status
  git ls-files | grep -E "(node_modules|dist|\.env)"
  ```

