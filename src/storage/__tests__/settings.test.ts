/**
 * 설정 저장/로드 테스트
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  loadSettings,
  saveSettings,
  addRecentDomain,
  getRecentDomains,
  clearRecentDomains,
  updateDomainFilter,
  updateMode,
} from '../settings';
import { DEFAULT_SETTINGS } from '../../types';

// Chrome Storage API 모킹
const mockStorage: Record<string, any> = {};

vi.mock('../../types', async () => {
  const actual = await vi.importActual('../../types');
  return {
    ...actual,
  };
});

// Chrome API 모킹
global.chrome = {
  storage: {
    sync: {
      get: vi.fn((keys: string | string[] | Record<string, any> | null, callback?: (items: Record<string, any>) => void) => {
        const result: Record<string, any> = {};
        const keysArray = Array.isArray(keys) ? keys : keys ? [keys] : Object.keys(mockStorage);
        
        keysArray.forEach((key) => {
          if (mockStorage[key]) {
            result[key] = mockStorage[key];
          }
        });

        if (callback) {
          callback(result);
          return undefined;
        }
        return Promise.resolve(result);
      }),
      set: vi.fn((items: Record<string, any>, callback?: () => void) => {
        Object.assign(mockStorage, items);
        if (callback) {
          callback();
          return undefined;
        }
        return Promise.resolve();
      }),
    },
  },
} as any;

describe('설정 저장/로드', () => {
  beforeEach(() => {
    // 각 테스트 전에 저장소 초기화
    Object.keys(mockStorage).forEach((key) => delete mockStorage[key]);
    vi.clearAllMocks();
  });

  describe('loadSettings', () => {
    it('저장된 설정이 없으면 기본 설정을 반환해야 함', async () => {
      const settings = await loadSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });

    it('저장된 설정이 있으면 저장된 설정을 반환해야 함', async () => {
      const customSettings = {
        domainFilter: 'example.com',
        mode: 'preview' as const,
        recentDomains: ['example.com'],
      };

      mockStorage['linkCollectorSettings'] = customSettings;

      const settings = await loadSettings();
      expect(settings.domainFilter).toBe('example.com');
      expect(settings.mode).toBe('preview');
      expect(settings.recentDomains).toEqual(['example.com']);
    });

    it('저장된 설정과 기본 설정을 병합해야 함', async () => {
      const partialSettings = {
        domainFilter: 'example.com',
      };

      mockStorage['linkCollectorSettings'] = partialSettings;

      const settings = await loadSettings();
      expect(settings.domainFilter).toBe('example.com');
      expect(settings.mode).toBe(DEFAULT_SETTINGS.mode);
      expect(settings.recentDomains).toEqual(DEFAULT_SETTINGS.recentDomains);
    });

    it('에러 발생 시 기본 설정을 반환해야 함', async () => {
      vi.spyOn(chrome.storage.sync, 'get').mockRejectedValueOnce(new Error('Storage error'));

      const settings = await loadSettings();
      expect(settings).toEqual(DEFAULT_SETTINGS);
    });
  });

  describe('saveSettings', () => {
    it('설정을 저장해야 함', async () => {
      const settings = {
        domainFilter: 'example.com',
        mode: 'preview' as const,
        recentDomains: ['example.com'],
      };

      await saveSettings(settings);

      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        linkCollectorSettings: settings,
      });
    });

    it('에러 발생 시 예외를 던져야 함', async () => {
      vi.spyOn(chrome.storage.sync, 'set').mockRejectedValueOnce(new Error('Storage error'));

      await expect(saveSettings(DEFAULT_SETTINGS)).rejects.toThrow('Storage error');
    });
  });

  describe('addRecentDomain', () => {
    it('최근 도메인을 추가해야 함', async () => {
      await addRecentDomain('example.com');

      const domains = await getRecentDomains();
      expect(domains).toContain('example.com');
      expect(domains[0]).toBe('example.com');
    });

    it('이미 존재하는 도메인은 맨 앞으로 이동해야 함', async () => {
      mockStorage['linkCollectorSettings'] = {
        ...DEFAULT_SETTINGS,
        recentDomains: ['test.com', 'example.com'],
      };

      await addRecentDomain('example.com');

      const domains = await getRecentDomains();
      expect(domains[0]).toBe('example.com');
      expect(domains.length).toBe(2);
    });

    it('최대 10개까지만 유지해야 함', async () => {
      const manyDomains = Array.from({ length: 10 }, (_, i) => `domain${i}.com`);
      mockStorage['linkCollectorSettings'] = {
        ...DEFAULT_SETTINGS,
        recentDomains: manyDomains,
      };

      await addRecentDomain('new-domain.com');

      const domains = await getRecentDomains();
      expect(domains.length).toBe(10);
      expect(domains[0]).toBe('new-domain.com');
      expect(domains).not.toContain('domain9.com');
    });

    it('빈 문자열은 무시해야 함', async () => {
      await addRecentDomain('');

      const domains = await getRecentDomains();
      expect(domains.length).toBe(0);
    });

    it('공백만 있는 문자열은 무시해야 함', async () => {
      await addRecentDomain('   ');

      const domains = await getRecentDomains();
      expect(domains.length).toBe(0);
    });
  });

  describe('getRecentDomains', () => {
    it('최근 도메인 목록을 반환해야 함', async () => {
      mockStorage['linkCollectorSettings'] = {
        ...DEFAULT_SETTINGS,
        recentDomains: ['example.com', 'test.com'],
      };

      const domains = await getRecentDomains();
      expect(domains).toEqual(['example.com', 'test.com']);
    });

    it('저장된 도메인이 없으면 빈 배열을 반환해야 함', async () => {
      const domains = await getRecentDomains();
      expect(domains).toEqual([]);
    });
  });

  describe('clearRecentDomains', () => {
    it('최근 도메인 목록을 초기화해야 함', async () => {
      mockStorage['linkCollectorSettings'] = {
        ...DEFAULT_SETTINGS,
        recentDomains: ['example.com', 'test.com'],
      };

      await clearRecentDomains();

      const domains = await getRecentDomains();
      expect(domains).toEqual([]);
    });
  });

  describe('updateDomainFilter', () => {
    it('도메인 필터를 업데이트해야 함', async () => {
      await updateDomainFilter('example.com');

      const settings = await loadSettings();
      expect(settings.domainFilter).toBe('example.com');
    });

    it('공백을 제거해야 함', async () => {
      await updateDomainFilter('  example.com  ');

      const settings = await loadSettings();
      expect(settings.domainFilter).toBe('example.com');
    });
  });

  describe('updateMode', () => {
    it('작업 모드를 preview로 업데이트해야 함', async () => {
      await updateMode('preview');

      const settings = await loadSettings();
      expect(settings.mode).toBe('preview');
    });

    it('작업 모드를 download로 업데이트해야 함', async () => {
      await updateMode('download');

      const settings = await loadSettings();
      expect(settings.mode).toBe('download');
    });
  });
});

