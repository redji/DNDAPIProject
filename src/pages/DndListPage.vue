<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-input v-model="query" dense filled debounce="200" placeholder="Search by name" />
      </div>
      <div class="col-12 col-md-6 text-right">
        <q-btn color="primary" :loading="state.loading" label="Refresh" @click="refresh" />
      </div>
    </div>

    <div v-if="state.error" class="q-mb-md">
      <q-banner class="bg-negative text-white" data-testid="error-banner">{{ state.error }}</q-banner>
    </div>

    <div v-if="state.loading" class="q-mb-md">
      <q-skeleton type="rect" height="24px" data-testid="loading-skeleton" />
      <q-skeleton type="rect" height="24px" class="q-mt-sm" />
      <q-skeleton type="rect" height="24px" class="q-mt-sm" />
    </div>

    <q-list v-if="filtered.length > 0" bordered separator>
      <q-item v-for="item in filtered" :key="item.index" clickable>
        <q-item-section>
          <q-item-label>{{ item.name }}</q-item-label>
          <q-item-label caption>{{ item.index }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
    
    <div v-else-if="!state.loading && !state.error" class="text-center q-pa-lg">
      <q-icon name="search_off" size="3em" color="grey-5" />
      <div class="text-h6 q-mt-md text-grey-6">No items found</div>
      <div class="text-caption text-grey-5">
        {{ query ? 'Try adjusting your search terms' : 'No data available for this endpoint' }}
      </div>
    </div>
  </q-page>
  
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDnd5eStore, type ListEndpointKey, allListEndpoints } from 'src/stores/dnd5e';

const route = useRoute();
const router = useRouter();
const store = useDnd5eStore();

const key = computed(() => route.params.key as ListEndpointKey);

// Validate key; redirect to home if invalid
watch(
  () => key.value,
  (k) => {
    if (!allListEndpoints.includes(k)) {
      void router.replace('/');
    }
  },
  { immediate: true }
);

const state = computed(() => {
  const endpointKey = key.value;
  if (!allListEndpoints.includes(endpointKey)) {
    return { loading: false, error: 'Invalid endpoint', data: null };
  }
  return store.lists[endpointKey];
});

const query = ref('');

const items = computed(() => state.value?.data?.results ?? []);
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return items.value;
  return items.value.filter((it) => it.name.toLowerCase().includes(q));
});

async function refresh() {
  const endpointKey = key.value;
  if (allListEndpoints.includes(endpointKey)) {
    await store.fetchList(endpointKey);
  }
}

onMounted(async () => {
  const endpointKey = key.value;
  if (allListEndpoints.includes(endpointKey) && !state.value?.data && !state.value?.loading) {
    await refresh();
  }
});
</script>




