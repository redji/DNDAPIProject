import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { path: 'endpoints', name: 'endpoints', component: () => import('pages/EndpointsPage.vue') },
      { path: 'dnd/:key', name: 'dnd-list', component: () => import('pages/DndListPage.vue') },
      { path: 'dnd/:key/:index', name: 'dnd-detail', component: () => import('pages/DndDetailPage.vue') },
      { path: 'dnd/:key/:index/path/:path(.*)*', name: 'dnd-detail-path', component: () => import('pages/DndDetailPage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
