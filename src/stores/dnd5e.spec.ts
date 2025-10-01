import { beforeEach, describe, expect, it, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useDnd5eStore, allListEndpoints, type ApiListResponse } from './dnd5e';
import * as dndBoot from 'src/boot/dnd5e';

describe('useDnd5eStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes lists for all endpoints', () => {
    const store = useDnd5eStore();
    for (const key of allListEndpoints) {
      expect(store.lists[key]).toBeDefined();
      expect(store.lists[key].loading).toBe(false);
      expect(store.lists[key].data).toBeNull();
      expect(store.lists[key].error).toBeNull();
    }
  });

  it('fetchList stores results and clears loading', async () => {
    const mockData: ApiListResponse = {
      count: 1,
      results: [{ index: 'wizard', name: 'Wizard', url: '/api/2014/classes/wizard' }],
    };

    const getSpy = vi.spyOn(dndBoot.api, 'get').mockResolvedValueOnce({ data: mockData } as any);

    const store = useDnd5eStore();
    await store.fetchList('classes');

    expect(getSpy).toHaveBeenCalledWith('/classes');
    expect(store.lists['classes'].data).toEqual(mockData);
    expect(store.lists['classes'].loading).toBe(false);
    expect(store.lists['classes'].error).toBeNull();
  });

  it('fetchAll calls all endpoints', async () => {
    const store = useDnd5eStore();
    const getSpy = vi.spyOn(dndBoot.api, 'get').mockResolvedValue({ data: { count: 0, results: [] } } as any);

    await store.fetchAll();

    expect(getSpy).toHaveBeenCalledTimes(allListEndpoints.length);
  });

  it('sets error on failure', async () => {
    const store = useDnd5eStore();
    vi.spyOn(dndBoot.api, 'get').mockRejectedValueOnce(new Error('network'));
    await store.fetchList('classes');
    expect(store.lists['classes'].error).toBe('Failed to load classes');
    expect(store.lists['classes'].loading).toBe(false);
  });
});



