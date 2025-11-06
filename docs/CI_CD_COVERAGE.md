# CI/CD에서 커버리지 임계값 활용

## 커버리지 임계값이 CI/CD에 미치는 영향

### 테스트 실패 시 동작

```bash
ERROR: Coverage for lines (51.35%) does not meet global threshold (60%)
```

이 에러가 발생하면:

1. **테스트가 실패 상태로 종료**
   - Exit code: 1 (실패)
   - CI/CD 파이프라인에서 실패로 인식

2. **배포 중단**
   - GitHub Actions, GitLab CI, Jenkins 등에서 배포 단계로 진행하지 않음
   - 코드 품질 기준을 충족하지 못했다고 판단

3. **개발자에게 알림**
   - PR(Pull Request) 머지 차단
   - 테스트 실패 알림

## CI/CD 설정 예시

### GitHub Actions 예시

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: yarn install
      
      - name: Run tests with coverage
        run: yarn test:coverage
        # 이 단계에서 커버리지 임계값 미달 시 실패
        # → 다음 단계(배포)로 진행하지 않음
      
      - name: Deploy
        if: success()  # 테스트가 성공했을 때만 실행
        run: echo "Deploying..."
```

### GitLab CI 예시

```yaml
test:
  stage: test
  script:
    - yarn install
    - yarn test:coverage
    # 커버리지 임계값 미달 시 실패 → 배포 단계 스킵

deploy:
  stage: deploy
  script:
    - echo "Deploying..."
  only:
    - main
  when: on_success  # 테스트 단계가 성공했을 때만 실행
```

## 실제 동작 예시

### 시나리오 1: 커버리지 임계값 통과

```bash
$ yarn test:coverage

Test Files  4 passed (4)
Tests  31 passed (31)

Coverage: 51.35% (임계값: 50%)
✅ Exit code: 0 (성공)
→ CI/CD 배포 진행
```

### 시나리오 2: 커버리지 임계값 미달

```bash
$ yarn test:coverage

Test Files  4 passed (4)
Tests  31 passed (31)

ERROR: Coverage for lines (51.35%) does not meet global threshold (60%)
❌ Exit code: 1 (실패)
→ CI/CD 배포 중단
→ PR 머지 차단
```

## 커버리지 임계값 전략

### 단계별 임계값 설정

#### 개발 단계 (현재)
```typescript
thresholds: {
  lines: 50,      // 초기 단계 허용
  functions: 70,
  branches: 50,
  statements: 50,
}
```

#### 안정화 단계
```typescript
thresholds: {
  lines: 70,      // 점진적으로 상향
  functions: 80,
  branches: 65,
  statements: 70,
}
```

#### 프로덕션 단계
```typescript
thresholds: {
  lines: 80,      // 엄격한 기준
  functions: 90,
  branches: 75,
  statements: 80,
}
```

## 장점

1. **자동 품질 관리**
   - 커버리지가 떨어지면 자동으로 차단
   - 수동 확인 불필요

2. **일관된 품질 유지**
   - 모든 PR이 동일한 기준 적용
   - 팀 전체가 같은 품질 기준 준수

3. **조기 발견**
   - 배포 전에 문제 발견
   - 프로덕션 이슈 방지

## 주의사항

### 임계값 설정 시 고려사항

1. **현실적인 목표 설정**
   - 너무 높으면 개발 속도 저하
   - 너무 낮으면 의미 없음

2. **점진적 상향**
   - 한 번에 50% → 80%로 올리지 말 것
   - 10%씩 단계적으로 상향

3. **예외 처리**
   - 특정 파일은 제외 (예: 타입 정의 파일)
   - 새로 추가된 코드만 임계값 적용

### 파일별 임계값 설정

```typescript
thresholds: {
  // 전체 임계값
  lines: 70,
  
  // 파일별 임계값 (선택적)
  'src/utils/**': {
    lines: 80,  // 유틸리티 함수는 더 높은 기준
  },
  'src/popup/**': {
    lines: 60,  // UI 로직은 조금 낮은 기준
  },
}
```

## 결론

커버리지 임계값은 **강제적인 품질 기준**이며, CI/CD에서 자동으로 배포를 중단시킬 수 있습니다. 이를 통해:

- ✅ 코드 품질 자동 관리
- ✅ 배포 전 문제 발견
- ✅ 일관된 품질 기준 유지

현재 프로젝트는 초기 단계이므로 50%로 설정했지만, 점진적으로 상향 조정하는 것이 좋습니다.

