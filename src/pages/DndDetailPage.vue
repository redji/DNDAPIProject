<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-col-gutter-md q-mb-md">
      <div class="col-12">
        <q-breadcrumbs>
          <q-breadcrumbs-el icon="home" :to="{ name: 'endpoints' }" label="Endpoints" />
          <q-breadcrumbs-el :to="{ name: 'dnd-list', params: { key } }" :label="key" />
          <q-breadcrumbs-el :to="{ name: 'dnd-detail', params: { key, index } }" :label="index" />
          <q-breadcrumbs-el v-for="(seg, i) in pathSegments" :key="i"
            :to="breadcrumbTo(i)" :label="seg" />
        </q-breadcrumbs>
      </div>
    </div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-8">
        <q-card>
          <q-card-section>
            <div class="row items-center q-col-gutter-sm">
              <div class="col-auto text-h6">{{ detail?.name || index }}</div>
              <div class="col-auto">
                <q-badge color="primary" outline>{{ isArray(subtree) ? `Array(${(subtree as unknown as unknown[]).length})` : (isObject(subtree) ? 'Object' : typeof subtree) }}</q-badge>
              </div>
            </div>
            <div class="text-caption text-grey q-mt-xs">{{ detail?.url }}</div>
          </q-card-section>
          <q-separator />
          <q-card-section>
            <div class="row items-center q-col-gutter-sm q-mb-sm">
              <div class="col-auto text-caption text-grey-7">Composition:</div>
              <div class="col">
                <div class="sparkline">
                  <div class="bar bar-obj" :style="{ width: compPerc.objects + '%' }" />
                  <div class="bar bar-arr" :style="{ width: compPerc.arrays + '%' }" />
                  <div class="bar bar-str" :style="{ width: compPerc.strings + '%' }" />
                  <div class="bar bar-num" :style="{ width: compPerc.numbers + '%' }" />
                  <div class="bar bar-bool" :style="{ width: compPerc.booleans + '%' }" />
                </div>
              </div>
              <div class="col-auto">
                <q-toggle v-model="viewRaw" color="primary" label="Raw JSON" dense />
              </div>
            </div>
            <div v-if="viewRaw">
              <pre class="q-mt-none q-mb-none hljs">{{ prettyJson }}</pre>
            </div>
            <div v-else-if="isObject(subtree)">
              <q-list bordered separator>
                <q-item v-for="(val, k) in objectEntries(subtree)" :key="k" clickable :to="childLink(k)">
                  <q-item-section>
                    <q-item-label class="row items-center no-wrap">
                      <span class="col-auto">{{ k }}</span>
                      <q-badge class="q-ml-sm" :color="typeColor(val)" outline>{{ typeLabel(val) }}</q-badge>
                    </q-item-label>
                    <q-item-label caption>
                      <div class="row items-center no-wrap">
                        <div class="col">{{ summarize(val) }}</div>
                        <div class="col-auto sizebar">
                          <div class="sizebar-fill" :style="{ width: sizePercent(val) + '%' }" />
                        </div>
                      </div>
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn flat dense round icon="content_copy" @click.stop="copyPath(k)" :aria-label="`Copy path ${k}`" />
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
            <div v-else-if="isArray(subtree)">
              <q-list bordered separator>
                <q-item v-for="(val, i) in (subtree as unknown as unknown[])" :key="i" clickable :to="childLink(i)">
                  <q-item-section>
                    <q-item-label class="row items-center no-wrap">
                      <span class="col-auto">[{{ i }}]</span>
                      <q-badge class="q-ml-sm" :color="typeColor(val)" outline>{{ typeLabel(val) }}</q-badge>
                    </q-item-label>
                    <q-item-label caption>
                      <div class="row items-center no-wrap">
                        <div class="col">{{ summarize(val) }}</div>
                        <div class="col-auto sizebar">
                          <div class="sizebar-fill" :style="{ width: sizePercent(val) + '%' }" />
                        </div>
                      </div>
                    </q-item-label>
                  </q-item-section>
                  <q-item-section side>
                    <q-btn flat dense round icon="content_copy" @click.stop="copyPath(i)" :aria-label="`Copy path [${i}]`" />
                  </q-item-section>
                </q-item>
              </q-list>
            </div>
            <div v-else>
              <pre class="q-mt-none q-mb-none hljs">{{ prettyJson }}</pre>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-4">
        <q-card>
          <q-card-section>
            <div class="text-subtitle1">Statistics</div>
          </q-card-section>
          <q-separator />
          <q-list dense>
            <q-item>
              <q-item-section>Properties</q-item-section>
              <q-item-section side>{{ stats.properties }}</q-item-section>
            </q-item>
            <q-item>
              <q-item-section>Arrays</q-item-section>
              <q-item-section side>{{ stats.arrays }}</q-item-section>
            </q-item>
            <q-item>
              <q-item-section>Strings</q-item-section>
              <q-item-section side>{{ stats.strings }}</q-item-section>
            </q-item>
            <q-item>
              <q-item-section>Numbers</q-item-section>
              <q-item-section side>{{ stats.numbers }}</q-item-section>
            </q-item>
            <q-item>
              <q-item-section>Booleans</q-item-section>
              <q-item-section side>{{ stats.booleans }}</q-item-section>
            </q-item>
          </q-list>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';

type JsonValue = unknown;

const route = useRoute();
const key = route.params.key as string;
const index = route.params.index as string;
const pathParam = (route.params.path as string | undefined) || '';

const pathSegments = computed(() => pathParam.split('/').filter(Boolean));
const viewRaw = ref(false);

const state = reactive({
  loading: false,
  error: '' as string | null,
  data: null as Record<string, JsonValue> | null,
});

type DetailData = Record<string, JsonValue>;
const detail = computed<DetailData | null>(() => (state.data ? (state.data as DetailData) : null));
const subtree = computed<unknown>(() => {
  let current: unknown = state.data as unknown;
  for (const seg of pathSegments.value) {
    if (current && typeof current === 'object' && !Array.isArray(current)) {
      current = (current as Record<string, unknown>)[seg];
    } else if (Array.isArray(current)) {
      const idx = Number(seg);
      current = Number.isFinite(idx) ? current[idx] : undefined;
    } else {
      current = undefined;
    }
  }
  return current ?? state.data;
});
const prettyJson = computed(() => (subtree.value ? JSON.stringify(subtree.value, null, 2) : ''));

const stats = computed(() => {
  const s = { properties: 0, arrays: 0, strings: 0, numbers: 0, booleans: 0 };
  if (!state.data) return s;
  const walk = (v: unknown) => {
    if (Array.isArray(v)) {
      s.arrays += 1;
      v.forEach(walk);
    } else if (typeof v === 'object' && v !== null) {
      const obj = v as Record<string, unknown>;
      s.properties += Object.keys(obj).length;
      Object.values(obj).forEach(walk);
    } else if (typeof v === 'string') s.strings += 1;
    else if (typeof v === 'number') s.numbers += 1;
    else if (typeof v === 'boolean') s.booleans += 1;
  };
  walk(subtree.value ?? state.data);
  return s;
});

const compPerc = computed(() => {
  const total = stats.value.properties + stats.value.arrays + stats.value.strings + stats.value.numbers + stats.value.booleans || 1;
  return {
    objects: Math.round((stats.value.properties / total) * 100),
    arrays: Math.round((stats.value.arrays / total) * 100),
    strings: Math.round((stats.value.strings / total) * 100),
    numbers: Math.round((stats.value.numbers / total) * 100),
    booleans: Math.round((stats.value.booleans / total) * 100),
  };
});

async function fetchDetail() {
  state.loading = true;
  state.error = '';
  try {
    const res = await fetch(`https://www.dnd5eapi.co/api/2014/${key}/${index}`);
    const json = await res.json();
    state.data = json;
  } catch {
    state.error = 'Failed to load details';
  } finally {
    state.loading = false;
  }
}

onMounted(() => {
  void fetchDetail();
});

function breadcrumbTo(i: number) {
  const segs = pathSegments.value.slice(0, i + 1).join('/');
  return { name: 'dnd-detail-path', params: { key, index, path: segs } };
}

function childLink(childKey: string | number) {
  const next = [...pathSegments.value, String(childKey)].join('/');
  return { name: 'dnd-detail-path', params: { key, index, path: next } };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function objectEntries(v: unknown): Record<string, unknown> {
  if (!isObject(v)) return {};
  return v;
}

function isArray(v: unknown): v is unknown[] {
  return Array.isArray(v);
}

function summarize(v: unknown): string {
  if (Array.isArray(v)) return `Array(${v.length})`;
  if (isObject(v)) return 'Object';
  if (typeof v === 'string') return v.length > 60 ? v.slice(0, 60) + '…' : v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return String(v);
}

function typeLabel(v: unknown): string {
  if (Array.isArray(v)) return 'Array';
  if (isObject(v)) return 'Object';
  return typeof v;
}

function typeColor(v: unknown): string {
  if (isObject(v)) return 'secondary';
  if (Array.isArray(v)) return 'accent';
  if (typeof v === 'string') return 'primary';
  if (typeof v === 'number') return 'orange';
  if (typeof v === 'boolean') return 'teal';
  return 'grey';
}

function approximateSize(v: unknown): number {
  try {
    if (v === null || v === undefined) return 0;
    if (typeof v === 'string') return v.length;
    if (typeof v === 'number' || typeof v === 'boolean') return 1;
    if (Array.isArray(v)) return v.length * 2;
    if (isObject(v)) return Object.keys(v).length * 2;
    return 0;
  } catch {
    return 0;
  }
}

function sizePercent(v: unknown): number {
  const sz = approximateSize(v);
  // normalize into 0..100 range with mild nonlinearity for readability
  const pct = Math.min(100, Math.round(Math.sqrt(sz) * 25));
  return pct;
}

async function copyPath(child: string | number) {
  const next = [...pathSegments.value, String(child)].join('/');
  const url = window.location.origin + routerLink(next);
  try {
    await navigator.clipboard.writeText(url);
  } catch {
    // noop
  }
}

function routerLink(next: string): string {
  return `/#/dnd/${key}/${index}/path/${next}`;
}
</script>

<style scoped>
pre {
  white-space: pre-wrap;
  word-break: break-word;
}
.sparkline {
  display: flex;
  height: 6px;
  border-radius: 3px;
  overflow: hidden;
  background: #f1f3f5;
}
.sparkline .bar { height: 100%; }
.bar-obj { background: #9c27b0; }
.bar-arr { background: #00bcd4; }
.bar-str { background: #2196f3; }
.bar-num { background: #ff9800; }
.bar-bool { background: #009688; }
.sizebar { width: 80px; height: 6px; background: #eef2f7; border-radius: 3px; overflow: hidden; }
.sizebar-fill { height: 100%; background: #c5e1fa; }
</style>


