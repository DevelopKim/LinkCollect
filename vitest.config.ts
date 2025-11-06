import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'happy-dom', // DOM 환경 시뮬레이션
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**',
      ],
      // 커버리지 임계값 설정 (시스템적으로 강제 적용)
      // 이 값보다 낮으면 테스트가 실패합니다
      // 현재는 초기 단계이므로 낮은 값으로 설정, 점진적으로 올릴 계획
      thresholds: {
        lines: 50,        // 라인 커버리지 50% 이상 (현재 51%이므로 통과)
        functions: 70,    // 함수 커버리지 70% 이상 (현재 72%이므로 통과)
        branches: 50,     // 분기 커버리지 50% 이상 (현재 54%이므로 통과)
        statements: 50,   // 문장 커버리지 50% 이상 (현재 51%이므로 통과)
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

