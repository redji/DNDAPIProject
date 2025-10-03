<template>
  <div v-if="hasError" class="error-boundary q-pa-md">
    <q-banner class="bg-negative text-white">
      <template #avatar>
        <q-icon name="error" />
      </template>
      <div class="text-h6">Something went wrong</div>
      <div class="q-mt-sm">{{ error?.message || 'An unexpected error occurred' }}</div>
      <template #action>
        <q-btn flat label="Retry" @click="retry" />
      </template>
    </q-banner>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';

const hasError = ref(false);
const error = ref<Error | null>(null);

onErrorCaptured((err: Error) => {
  hasError.value = true;
  error.value = err;
  console.error('Error caught by boundary:', err);
  return false; // Prevent error from propagating
});

function retry() {
  hasError.value = false;
  error.value = null;
}
</script>

<style scoped>
.error-boundary {
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
