<template>
  <q-page class="q-pa-md">
    <div class="q-mb-md">
    </div>

    <WebGlDemo />

    <div class="q-mt-md">
      <q-btn color="primary" icon="list" label="Browse API Endpoints" :to="{ name: 'endpoints' }" />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import WebGlDemo from 'src/components/WebGlDemo.vue';
</script>
