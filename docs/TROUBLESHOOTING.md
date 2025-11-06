# 문제 해결 가이드

## CRXJS 플러그인 관련 이슈

### 문제: 사이드 패널이 팝업으로 표시됨

**증상:**
- `manifest.json`에 `side_panel` 설정이 있음에도 불구하고 팝업으로 표시됨
- `default_popup`이 빌드된 manifest.json에 자동으로 추가됨

**원인:**
- CRXJS 플러그인이 `popup.html`이라는 파일명을 감지하면 자동으로 `default_popup`을 manifest에 추가함
- `default_popup`이 있으면 Chrome은 `side_panel` 설정을 무시하고 팝업으로 동작함

**해결 방법:**
1. HTML 파일명을 `popup.html`에서 다른 이름으로 변경 (예: `sidepanel.html`)
2. `manifest.json`의 `side_panel.default_path`를 변경된 파일명으로 업데이트
3. 빌드 산출물(`dist/`) 삭제 후 재빌드

**참고:**
- CRXJS 플러그인은 파일명 기반으로 manifest를 자동 변환함
- `popup.html` → `default_popup` 자동 추가
- `sidepanel.html` → 자동 변환 없음

### 문제: manifest.json 버전이 업데이트되지 않음

**증상:**
- `manifest.json`의 version을 변경했지만 Chrome에서 이전 버전으로 표시됨
- 확장 기능을 삭제 후 재설치해도 동일

**원인:**
- 빌드 산출물(`dist/`)이 제대로 갱신되지 않음
- Chrome이 캐시된 manifest를 사용함

**해결 방법:**
1. 빌드 산출물 완전 삭제: `rm -rf dist .vite`
2. 재빌드: `yarn build`
3. Chrome에서 확장 기능 제거 후 재설치
4. 필요시 Chrome 재시작

**참고:**
- `dist/` 폴더는 `.gitignore`에 포함되어 있어 Git으로 추적되지 않음
- 빌드 전 항상 기존 빌드 산출물을 삭제하는 것이 안전함

## 빌드 관련 체크리스트

빌드 후 확인 사항:
1. `dist/manifest.json`에 `default_popup`이 없는지 확인
2. `dist/manifest.json`에 `side_panel` 설정이 있는지 확인
3. `dist/manifest.json`의 version이 올바른지 확인
4. 필요한 권한이 모두 포함되어 있는지 확인

