/**
 * 링크 추출 성능 테스트
 */

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { extractLinks } from '../link-extractor';

function setupDOM(htmlContent: string, baseUrl: string = 'https://example.com'): void {
  document.open();
  document.write(htmlContent);
  document.close();
  
  Object.defineProperty(window, 'location', {
    value: new URL(baseUrl),
    writable: true,
  });
}

describe('링크 추출 성능 테스트', () => {
  it('대량 링크 페이지에서도 정상적으로 동작해야 함', async () => {
    const html = readFileSync(
      join(__dirname, '../../../tests/fixtures/many-links.html'),
      'utf-8'
    );
    setupDOM(html, 'https://example.com');
    
    const startTime = performance.now();
    const links = await extractLinks();
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    
    // 100개의 링크가 모두 추출되어야 함
    expect(links.length).toBe(100);
    
    // 성능 검증: 1000ms 이내에 완료되어야 함 (실제로는 더 빠를 것)
    expect(duration).toBeLessThan(1000);
    
    console.log(`대량 링크 추출 시간: ${duration.toFixed(2)}ms`);
  });
});

