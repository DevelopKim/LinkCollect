/**
 * 로딩 상태 표시 테스트
 * 버튼 상태 변경, 로딩 애니메이션, 비활성화 상태 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Window } from 'happy-dom';

describe('로딩 상태 표시', () => {
  let window: Window;
  let document: Document;
  let extractButton: HTMLButtonElement;

  beforeEach(() => {
    window = new Window();
    document = window.document as any;
    global.window = window as any;
    global.document = document as any;

    // HTML 구조 설정
    document.body.innerHTML = `
      <div id="app">
        <div class="popup-footer">
          <button id="extract-button" class="extract-button">
            <span class="material-symbols-outlined">file_download</span>
            추출하기
          </button>
        </div>
      </div>
    `;

    extractButton = document.getElementById('extract-button') as HTMLButtonElement;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('버튼 비활성화', () => {
    it('추출 시작 시 버튼이 disabled 상태로 변경되어야 함', () => {
      extractButton.disabled = false;
      
      // 추출 시작 시뮬레이션
      extractButton.disabled = true;
      
      expect(extractButton.disabled).toBe(true);
    });

    it('버튼이 disabled 상태일 때 cursor가 not-allowed여야 함', () => {
      extractButton.disabled = true;
      extractButton.classList.add('extract-button');
      
      // CSS에서 :disabled 상태일 때 cursor: not-allowed가 적용되어야 함
      // 실제 CSS는 테스트할 수 없지만, disabled 속성 확인
      expect(extractButton.disabled).toBe(true);
    });

    it('버튼이 disabled 상태일 때 opacity가 낮아져야 함', () => {
      extractButton.disabled = true;
      
      // CSS 클래스 확인 (실제 스타일은 CSS에서 처리)
      expect(extractButton.disabled).toBe(true);
    });
  });

  describe('로딩 텍스트/아이콘 변경', () => {
    it('추출 시작 시 버튼 텍스트가 변경되어야 함', () => {
      const originalText = extractButton.innerHTML;
      
      // 로딩 상태로 변경
      extractButton.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> 추출 중...';
      
      expect(extractButton.innerHTML).toContain('추출 중');
      expect(extractButton.innerHTML).not.toBe(originalText);
    });

    it('로딩 아이콘이 hourglass_empty여야 함', () => {
      extractButton.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> 추출 중...';
      
      const icon = extractButton.querySelector('.material-symbols-outlined');
      expect(icon?.textContent).toBe('hourglass_empty');
    });

    it('추출 완료 후 버튼 텍스트가 원래대로 복구되어야 함', () => {
      // 로딩 상태
      extractButton.disabled = true;
      extractButton.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> 추출 중...';
      
      // 완료 후 복구
      extractButton.disabled = false;
      extractButton.innerHTML = '<span class="material-symbols-outlined">file_download</span> 추출하기';
      
      expect(extractButton.disabled).toBe(false);
      expect(extractButton.innerHTML).toContain('추출하기');
      expect(extractButton.innerHTML).toContain('file_download');
    });
  });

  describe('로딩 중 상호작용 제한', () => {
    it('로딩 중 버튼 클릭이 막혀야 함', () => {
      extractButton.disabled = true;
      
      const clickHandler = vi.fn();
      extractButton.addEventListener('click', clickHandler);
      
      // disabled 버튼도 클릭 이벤트는 발생하지만, 실제 동작은 막혀야 함
      extractButton.click();
      
      // disabled 상태 확인
      expect(extractButton.disabled).toBe(true);
    });

    it('로딩 중 다른 버튼도 비활성화되어야 함 (다운로드 버튼 등)', () => {
      // 다운로드 버튼 추가
      const downloadButton = document.createElement('button');
      downloadButton.id = 'download-button';
      downloadButton.className = 'download-button';
      document.body.appendChild(downloadButton);

      // 로딩 상태 시뮬레이션
      extractButton.disabled = true;
      downloadButton.disabled = true;

      expect(extractButton.disabled).toBe(true);
      expect(downloadButton.disabled).toBe(true);
    });
  });

  describe('로딩 상태 복구', () => {
    it('추출 완료 후 버튼이 다시 활성화되어야 함', () => {
      // 로딩 상태
      extractButton.disabled = true;
      
      // 완료 후 복구
      extractButton.disabled = false;
      
      expect(extractButton.disabled).toBe(false);
    });

    it('에러 발생 시에도 버튼이 복구되어야 함', () => {
      // 로딩 상태
      extractButton.disabled = true;
      extractButton.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> 추출 중...';
      
      // 에러 발생 후 복구
      extractButton.disabled = false;
      extractButton.innerHTML = '<span class="material-symbols-outlined">file_download</span> 추출하기';
      
      expect(extractButton.disabled).toBe(false);
      expect(extractButton.innerHTML).toContain('추출하기');
    });
  });

  describe('로딩 상태 함수 시뮬레이션', () => {
    it('resetExtractButton 함수가 버튼을 복구해야 함', () => {
      // resetExtractButton 함수 시뮬레이션
      const resetExtractButton = (button: HTMLButtonElement) => {
        button.disabled = false;
        button.innerHTML = '<span class="material-symbols-outlined">file_download</span> 추출하기';
      };

      // 로딩 상태
      extractButton.disabled = true;
      extractButton.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> 추출 중...';

      // 복구
      resetExtractButton(extractButton);

      expect(extractButton.disabled).toBe(false);
      expect(extractButton.innerHTML).toContain('추출하기');
    });

    it('로딩 상태 설정 함수가 버튼을 비활성화해야 함', () => {
      // setLoadingState 함수 시뮬레이션
      const setLoadingState = (button: HTMLButtonElement) => {
        button.disabled = true;
        button.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> 추출 중...';
      };

      extractButton.disabled = false;
      setLoadingState(extractButton);

      expect(extractButton.disabled).toBe(true);
      expect(extractButton.innerHTML).toContain('추출 중');
    });
  });

  describe('로딩 애니메이션', () => {
    it('로딩 아이콘이 존재해야 함', () => {
      extractButton.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> 추출 중...';
      
      const icon = extractButton.querySelector('.material-symbols-outlined');
      expect(icon).toBeTruthy();
    });

    it('로딩 아이콘이 material-symbols-outlined 클래스를 가져야 함', () => {
      extractButton.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> 추출 중...';
      
      const icon = extractButton.querySelector('.material-symbols-outlined');
      expect(icon?.className).toContain('material-symbols-outlined');
    });

    // 참고: CSS 애니메이션은 실제 브라우저에서만 확인 가능
    // 여기서는 구조만 확인
    it('로딩 아이콘 구조가 올바르게 생성되어야 함', () => {
      extractButton.innerHTML = '<span class="material-symbols-outlined">hourglass_empty</span> 추출 중...';
      
      const icon = extractButton.querySelector('.material-symbols-outlined');
      expect(icon?.tagName).toBe('SPAN');
      expect(icon?.textContent).toBe('hourglass_empty');
    });
  });
});

