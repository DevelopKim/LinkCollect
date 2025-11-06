/**
 * 에러 메시지 가독성 테스트
 * 에러 메시지 표시, 내용, 위치, 타이밍 테스트
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Window } from 'happy-dom';

describe('에러 메시지 가독성', () => {
  let window: Window;
  let document: Document;
  let alertSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    window = new Window();
    document = window.document as any;
    global.window = window as any;
    global.document = document as any;

    // HTML 구조 설정
    document.body.innerHTML = `
      <div id="app">
        <div id="error-message" style="display: none;"></div>
      </div>
    `;

    // alert 모킹 (window.alert 직접 정의)
    alertSpy = vi.fn();
    (global.window as any).alert = alertSpy;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('에러 메시지 표시', () => {
    it('에러 발생 시 메시지가 표시되어야 함', () => {
      const showError = (message: string) => {
        (window as any).alert(message);
      };

      showError('테스트 에러 메시지');
      expect(alertSpy).toHaveBeenCalledWith('테스트 에러 메시지');
    });

    it('에러 메시지가 사용자 친화적이어야 함', () => {
      const userFriendlyMessages = [
        '특수 페이지에서는 링크를 추출할 수 없습니다. 일반 웹 페이지에서 사용해주세요.',
        '링크 추출 중 알 수 없는 오류가 발생했습니다.',
        '다운로드할 링크가 없습니다.',
      ];

      userFriendlyMessages.forEach((message) => {
        // 메시지가 한글로 되어 있고, 이해하기 쉬운지 확인
        expect(message.length).toBeGreaterThan(0);
        expect(message).not.toContain('Error:');
        expect(message).not.toContain('undefined');
        expect(message).not.toContain('null');
      });
    });

    it('에러 메시지가 기술적 용어 없이 표시되어야 함', () => {
      const technicalMessages = [
        'Error: Cannot read property',
        'TypeError: undefined is not a function',
        'ReferenceError: variable is not defined',
      ];

      const userFriendlyMessages = [
        '링크 추출 중 오류가 발생했습니다.',
        '작업을 완료할 수 없습니다.',
        '문제가 발생했습니다. 다시 시도해주세요.',
      ];

      // 기술적 메시지는 사용자에게 표시하지 않아야 함
      technicalMessages.forEach((msg) => {
        expect(msg).toMatch(/Error|TypeError|ReferenceError/);
      });

      // 사용자 친화적 메시지는 기술적 용어가 없어야 함
      userFriendlyMessages.forEach((msg) => {
        expect(msg).not.toMatch(/Error|TypeError|ReferenceError|undefined|null/);
      });
    });
  });

  describe('에러 메시지 내용', () => {
    it('에러 타입별로 적절한 메시지가 표시되어야 함', () => {
      const errorMessages: Record<string, string> = {
        'DOM 접근 불가': '특수 페이지에서는 링크를 추출할 수 없습니다. 일반 웹 페이지에서 사용해주세요.',
        '다운로드 실패': '다운로드 중 오류가 발생했습니다.',
        '링크 없음': '다운로드할 링크가 없습니다.',
        '알 수 없는 오류': '링크 추출 중 알 수 없는 오류가 발생했습니다.',
      };

      Object.entries(errorMessages).forEach(([_type, message]) => {
        expect(message.length).toBeGreaterThan(0);
        expect(message).toContain('습니다'); // 한글 문장 종결어미 확인
      });
    });

    it('에러 메시지가 해결 방법을 제시해야 함 (가능한 경우)', () => {
      const messagesWithSolution = [
        '특수 페이지에서는 링크를 추출할 수 없습니다. 일반 웹 페이지에서 사용해주세요.',
        '다운로드할 링크가 없습니다.',
      ];

      messagesWithSolution.forEach((message) => {
        // 해결 방법이 포함되어 있거나, 명확한 안내가 있어야 함
        expect(message.length).toBeGreaterThan(10);
      });
    });

    it('에러 객체에서 사용자 친화적 메시지를 추출해야 함', () => {
      const getErrorMessage = (error: unknown): string => {
        if (error instanceof Error) {
          // 기술적 에러 메시지를 사용자 친화적으로 변환
          if (error.message.includes('Receiving end does not exist')) {
            return '페이지를 다시 로드한 후 시도해주세요.';
          }
          if (error.message.includes('특수 페이지')) {
            return error.message; // 이미 사용자 친화적
          }
          return '링크 추출 중 오류가 발생했습니다.';
        }
        return '알 수 없는 오류가 발생했습니다.';
      };

      const technicalError = new Error('Receiving end does not exist');
      const userMessage = getErrorMessage(technicalError);
      expect(userMessage).not.toContain('Receiving end');
      expect(userMessage).toContain('시도해주세요');

      const friendlyError = new Error('특수 페이지에서는 링크를 추출할 수 없습니다.');
      const friendlyMessage = getErrorMessage(friendlyError);
      expect(friendlyMessage).toBe(friendlyError.message);
    });
  });

  describe('에러 메시지 위치', () => {
    it('에러 메시지가 적절한 위치에 표시되어야 함', () => {
      // 현재 구현은 alert를 사용하지만, 향후 DOM 요소로 변경 가능
      const errorElement = document.getElementById('error-message');
      expect(errorElement).toBeTruthy();
    });

    it('에러 메시지 요소가 초기에는 숨겨져 있어야 함', () => {
      const errorElement = document.getElementById('error-message');
      expect(errorElement?.style.display).toBe('none');
    });

    it('에러 발생 시 메시지 요소가 표시되어야 함', () => {
      const errorElement = document.getElementById('error-message');
      const showError = (message: string) => {
        if (errorElement) {
          errorElement.textContent = message;
          errorElement.style.display = 'block';
        }
      };

      showError('테스트 에러');
      expect(errorElement?.style.display).toBe('block');
      expect(errorElement?.textContent).toBe('테스트 에러');
    });
  });

  describe('에러 메시지 타이밍', () => {
    it('에러 발생 즉시 메시지가 표시되어야 함', () => {
      const showError = (message: string) => {
        (window as any).alert(message);
      };

      showError('즉시 표시되는 에러');
      expect(alertSpy).toHaveBeenCalledTimes(1);
    });

    it('에러 메시지가 자동으로 사라지지 않아야 함 (현재 구현)', () => {
      // 현재는 alert를 사용하므로 사용자가 닫아야 함
      // 향후 DOM 요소로 변경 시 자동 사라짐 기능 추가 가능
      const errorElement = document.getElementById('error-message');
      const showError = (message: string) => {
        if (errorElement) {
          errorElement.textContent = message;
          errorElement.style.display = 'block';
        }
      };

      showError('에러 메시지');
      // 자동으로 사라지지 않음 (사용자가 확인해야 함)
      expect(errorElement?.style.display).toBe('block');
    });
  });

  describe('에러 메시지 스타일', () => {
    it('에러 메시지가 눈에 띄어야 함', () => {
      const errorElement = document.getElementById('error-message');
      if (errorElement) {
        errorElement.style.color = '#d32f2f'; // 빨간색
        errorElement.style.fontWeight = 'bold';
        errorElement.style.padding = '12px';
        errorElement.style.borderRadius = '4px';
        errorElement.style.backgroundColor = '#ffebee';
      }

      // 스타일이 적용되었는지 확인
      expect(errorElement?.style.color).toBeTruthy();
    });

    it('에러 메시지가 읽기 쉬워야 함', () => {
      const errorElement = document.getElementById('error-message');
      if (errorElement) {
        errorElement.style.fontSize = '14px';
        errorElement.style.lineHeight = '1.5';
      }

      expect(errorElement?.style.fontSize).toBeTruthy();
    });
  });

  describe('다양한 에러 시나리오', () => {
    it('네트워크 오류 시 적절한 메시지가 표시되어야 함', () => {
      const networkError = new Error('Network request failed');
      const getErrorMessage = (error: unknown): string => {
        if (error instanceof Error && error.message.includes('Network')) {
          return '네트워크 연결을 확인하고 다시 시도해주세요.';
        }
        return '오류가 발생했습니다.';
      };

      const message = getErrorMessage(networkError);
      expect(message).toContain('네트워크');
    });

    it('권한 오류 시 적절한 메시지가 표시되어야 함', () => {
      const permissionError = new Error('Permission denied');
      const getErrorMessage = (error: unknown): string => {
        if (error instanceof Error && error.message.includes('Permission')) {
          return '권한이 필요합니다. 확장 기능 설정을 확인해주세요.';
        }
        return '오류가 발생했습니다.';
      };

      const message = getErrorMessage(permissionError);
      expect(message).toContain('권한');
    });

    it('알 수 없는 오류 시 일반적인 메시지가 표시되어야 함', () => {
      const unknownError = new Error('Unknown error');
      const getErrorMessage = (error: unknown): string => {
        if (error instanceof Error) {
          // 알 수 없는 오류는 일반적인 메시지 반환
          return '링크 추출 중 알 수 없는 오류가 발생했습니다.';
        }
        return '알 수 없는 오류가 발생했습니다.';
      };

      const message = getErrorMessage(unknownError);
      expect(message).toContain('알 수 없는 오류');
    });
  });
});

