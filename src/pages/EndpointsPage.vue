<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-6">
        <q-input v-model="query" dense filled debounce="200" placeholder="Filter endpoints" />
      </div>
    </div>

    <q-list bordered separator>
      <q-item v-for="key in filtered" :key="key" clickable :to="{ name: 'dnd-list', params: { key } }">
        <q-item-section>
          <q-item-label class="text-capitalize">{{ key.replace('-', ' ') }}</q-item-label>
          <q-item-label caption>{{ `/api/2014/${key}` }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-icon name="chevron_right" />
        </q-item-section>
      </q-item>
    </q-list>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { allListEndpoints } from 'src/stores/dnd5e';

const query = ref('');
const filtered = computed(() => {
  const q = query.value?.trim().toLowerCase() || '';
  if (!q) return allListEndpoints;
  return allListEndpoints.filter((k) => k.includes(q));
});
</script>


