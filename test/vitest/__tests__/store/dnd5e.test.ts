import { installQuasarPlugin } from '@quasar/quasar-app-extension-testing-unit-vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useDnd5eStore, allListEndpoints, type ApiListResponse, type ListEndpointKey } from 'src/stores/dnd5e';

// Mock the boot module
vi.mock('src/boot/dnd5e', () => ({
  api: {
    get: vi.fn(),
  },
}));

import * as dndBoot from 'src/boot/dnd5e';

installQuasarPlugin();

describe('useDnd5eStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  describe('initialization', () => {
    it('initializes lists for all endpoints', () => {
      const store = useDnd5eStore();
      for (const key of allListEndpoints) {
        expect(store.lists[key]).toBeDefined();
        expect(store.lists[key].loading).toBe(false);
        expect(store.lists[key].data).toBeNull();
        expect(store.lists[key].error).toBeNull();
      }
    });

    it('has correct number of endpoints', () => {
      expect(allListEndpoints).toHaveLength(24);
      expect(allListEndpoints).toContain('classes');
      expect(allListEndpoints).toContain('spells');
      expect(allListEndpoints).toContain('monsters');
    });
  });

  describe('getters', () => {
    it('classes getter returns classes list state', () => {
      const store = useDnd5eStore();
      expect(store.classes).toBe(store.lists['classes']);
    });

    it('spells getter returns spells list state', () => {
      const store = useDnd5eStore();
      expect(store.spells).toBe(store.lists['spells']);
    });

    it('monsters getter returns monsters list state', () => {
      const store = useDnd5eStore();
      expect(store.monsters).toBe(store.lists['monsters']);
    });
  });

  describe('fetchList', () => {
    it('stores results and clears loading on success', async () => {
      const mockData: ApiListResponse = {
        count: 1,
        results: [{ index: 'wizard', name: 'Wizard', url: '/api/2014/classes/wizard' }],
      };

      const getSpy = vi.spyOn(dndBoot.api, 'get').mockResolvedValueOnce({ data: mockData });

      const store = useDnd5eStore();
      await store.fetchList('classes');

      expect(getSpy).toHaveBeenCalledWith('/classes');
      expect(store.lists['classes'].data).toEqual(mockData);
      expect(store.lists['classes'].loading).toBe(false);
      expect(store.lists['classes'].error).toBeNull();
    });

    it('sets loading state during fetch', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      vi.spyOn(dndBoot.api, 'get').mockReturnValueOnce(promise);

      const store = useDnd5eStore();
      const fetchPromise = store.fetchList('spells');

      expect(store.lists['spells'].loading).toBe(true);
      expect(store.lists['spells'].error).toBeNull();

      resolvePromise!({ data: { count: 0, results: [] } });
      await fetchPromise;

      expect(store.lists['spells'].loading).toBe(false);
    });

    it('sets error and clears loading on failure', async () => {
      const store = useDnd5eStore();
      vi.spyOn(dndBoot.api, 'get').mockRejectedValueOnce(new Error('network error'));
      
      await store.fetchList('monsters');
      
      expect(store.lists['monsters'].error).toBe('Failed to load monsters');
      expect(store.lists['monsters'].loading).toBe(false);
      expect(store.lists['monsters'].data).toBeNull();
    });

    it('clears previous error on new fetch', async () => {
      const store = useDnd5eStore();
      
      // First fetch fails
      vi.spyOn(dndBoot.api, 'get').mockRejectedValueOnce(new Error('network error'));
      await store.fetchList('classes');
      expect(store.lists['classes'].error).toBe('Failed to load classes');

      // Second fetch succeeds
      const mockData: ApiListResponse = { count: 0, results: [] };
      vi.spyOn(dndBoot.api, 'get').mockResolvedValueOnce({ data: mockData });
      await store.fetchList('classes');
      
      expect(store.lists['classes'].error).toBeNull();
      expect(store.lists['classes'].data).toEqual(mockData);
    });

    it('works with all endpoint types', async () => {
      const store = useDnd5eStore();
      const mockData: ApiListResponse = { count: 0, results: [] };
      const getSpy = vi.spyOn(dndBoot.api, 'get').mockResolvedValue({ data: mockData });

      // Test a few different endpoints
      const testEndpoints: ListEndpointKey[] = ['races', 'equipment', 'feats', 'languages'];
      
      for (const endpoint of testEndpoints) {
        await store.fetchList(endpoint);
        expect(getSpy).toHaveBeenCalledWith(`/${endpoint}`);
        expect(store.lists[endpoint].data).toEqual(mockData);
      }
    });
  });

  describe('fetchAll', () => {
    it('calls all endpoints', async () => {
      const store = useDnd5eStore();
      const getSpy = vi.spyOn(dndBoot.api, 'get').mockResolvedValue({ data: { count: 0, results: [] } });

      await store.fetchAll();

      expect(getSpy).toHaveBeenCalledTimes(allListEndpoints.length);
      
      // Verify each endpoint was called
      for (const endpoint of allListEndpoints) {
        expect(getSpy).toHaveBeenCalledWith(`/${endpoint}`);
      }
    });

    it('handles mixed success and failure', async () => {
      const store = useDnd5eStore();
      const getSpy = vi.spyOn(dndBoot.api, 'get')
        .mockImplementation((url: string) => {
          if (url === '/classes') {
            return Promise.resolve({ data: { count: 0, results: [] } });
          }
          if (url === '/spells') {
            return Promise.reject(new Error('network error'));
          }
          return Promise.resolve({ data: { count: 0, results: [] } });
        });

      await store.fetchAll();

      expect(store.lists['classes'].data).toBeDefined();
      expect(store.lists['classes'].error).toBeNull();
      expect(store.lists['spells'].data).toBeNull();
      expect(store.lists['spells'].error).toBe('Failed to load spells');
    });

    it('sets loading states for all endpoints', async () => {
      let resolvePromises: ((value: any) => void)[] = [];
      const promises = allListEndpoints.map(() => new Promise((resolve) => {
        resolvePromises.push(resolve);
      }));

      vi.spyOn(dndBoot.api, 'get').mockImplementation(() => promises.shift()!);

      const store = useDnd5eStore();
      const fetchAllPromise = store.fetchAll();

      // All should be loading
      for (const endpoint of allListEndpoints) {
        expect(store.lists[endpoint].loading).toBe(true);
      }

      // Resolve all promises
      resolvePromises.forEach(resolve => resolve({ data: { count: 0, results: [] } }));
      await fetchAllPromise;

      // All should be done loading
      for (const endpoint of allListEndpoints) {
        expect(store.lists[endpoint].loading).toBe(false);
      }
    });
  });

  describe('error handling', () => {
    it('handles axios error objects', async () => {
      const store = useDnd5eStore();
      const axiosError = {
        response: { status: 404, data: 'Not Found' },
        message: 'Request failed with status code 404'
      };
      
      vi.spyOn(dndBoot.api, 'get').mockRejectedValueOnce(axiosError);
      await store.fetchList('classes');
      
      expect(store.lists['classes'].error).toBe('Failed to load classes');
    });

    it('handles string errors', async () => {
      const store = useDnd5eStore();
      vi.spyOn(dndBoot.api, 'get').mockRejectedValueOnce('String error');
      await store.fetchList('spells');
      
      expect(store.lists['spells'].error).toBe('Failed to load spells');
    });
  });

  describe('data integrity', () => {
    it('preserves data structure from API', async () => {
      const mockData: ApiListResponse = {
        count: 2,
        results: [
          { index: 'wizard', name: 'Wizard', url: '/api/2014/classes/wizard' },
          { index: 'fighter', name: 'Fighter', url: '/api/2014/classes/fighter' }
        ]
      };

      vi.spyOn(dndBoot.api, 'get').mockResolvedValueOnce({ data: mockData });

      const store = useDnd5eStore();
      await store.fetchList('classes');

      expect(store.lists['classes'].data).toEqual(mockData);
      expect(store.lists['classes'].data?.count).toBe(2);
      expect(store.lists['classes'].data?.results).toHaveLength(2);
      expect(store.lists['classes'].data?.results[0]).toEqual({
        index: 'wizard',
        name: 'Wizard',
        url: '/api/2014/classes/wizard'
      });
    });
  });
});
