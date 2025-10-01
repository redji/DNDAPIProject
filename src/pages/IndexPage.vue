<template>
  <q-page class="q-pa-md">
    <div class="q-mb-md">
      <div class="text-h5 q-mb-sm">D&D 5e SRD (2014) Lists</div>
      <q-input v-model="search" filled dense debounce="200" placeholder="Filter endpoints" />
    </div>

    <q-list bordered separator>
      <q-item v-for="key in filteredKeys" :key="key" clickable :to="{ name: 'dnd-list', params: { key } }">
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

const search = ref('');
const filteredKeys = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return allListEndpoints;
  return allListEndpoints.filter((k) => k.includes(q));
});
</script>
