import { defineStore, acceptHMRUpdate } from 'pinia';
import { api as dnd5eApi } from 'src/boot/dnd5e';

export type ApiIndexItem = {
  index: string;
  name: string;
  url: string;
};

export type ApiListResponse = {
  count: number;
  results: ApiIndexItem[];
};

export type FetchState<T> = {
  loading: boolean;
  error: string | null;
  data: T | null;
};

function createFetchState<T>(): FetchState<T> {
  return {
    loading: false,
    error: null,
    data: null,
  };
}

export const allListEndpoints = [
  'ability-scores',
  'alignments',
  'backgrounds',
  'classes',
  'conditions',
  'damage-types',
  'equipment',
  'equipment-categories',
  'feats',
  'features',
  'languages',
  'magic-items',
  'magic-schools',
  'monsters',
  'proficiencies',
  'races',
  'rule-sections',
  'rules',
  'skills',
  'spells',
  'subclasses',
  'subraces',
  'traits',
  'weapon-properties',
] as const;

export type ListEndpointKey = typeof allListEndpoints[number];

type ListsState = Record<ListEndpointKey, FetchState<ApiListResponse>>;

function createListsState(): ListsState {
  return allListEndpoints.reduce((acc, key) => {
    (acc as Record<string, FetchState<ApiListResponse>>)[key] = createFetchState<ApiListResponse>();
    return acc;
  }, {} as ListsState);
}

export const useDnd5eStore = defineStore('dnd5e', {
  state: () => ({
    lists: createListsState(),
  }),

  getters: {
    // Backward-compatible aliases
    classes(state): FetchState<ApiListResponse> {
      return state.lists['classes'];
    },
    spells(state): FetchState<ApiListResponse> {
      return state.lists['spells'];
    },
    monsters(state): FetchState<ApiListResponse> {
      return state.lists['monsters'];
    },
  },

  actions: {
    async fetchList(key: ListEndpointKey): Promise<void> {
      const bucket = this.lists[key];
      bucket.loading = true;
      bucket.error = null;
      try {
        const { data } = await dnd5eApi.get<ApiListResponse>(`/${key}`);
        bucket.data = data;
      } catch {
        bucket.error = `Failed to load ${key}`;
      } finally {
        bucket.loading = false;
      }
    },

    async fetchAll(): Promise<void> {
      await Promise.all(
        allListEndpoints.map((key) => this.fetchList(key))
      );
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDnd5eStore, import.meta.hot));
}


