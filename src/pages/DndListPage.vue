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
      <q-banner class="bg-negative text-white">{{ state.error }}</q-banner>
    </div>

    <q-skeleton v-if="state.loading" type="rect" class="q-mb-md" height="24px" />

    <q-list bordered separator>
      <q-item v-for="item in filtered" :key="item.index" clickable>
        <q-item-section>
          <q-item-label>{{ item.name }}</q-item-label>
          <q-item-label caption>{{ item.index }}</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
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

const state = computed(() => store.lists[key.value]);
const query = ref('');

const items = computed(() => state.value.data?.results ?? []);
const filtered = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return items.value;
  return items.value.filter((it) => it.name.toLowerCase().includes(q));
});

async function refresh() {
  await store.fetchList(key.value);
}

onMounted(async () => {
  if (!state.value.data && !state.value.loading) {
    await refresh();
  }
});
</script>




