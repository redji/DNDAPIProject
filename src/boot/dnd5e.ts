import { defineBoot } from '#q-app/wrappers';
import axios, { type AxiosInstance } from 'axios';

declare module 'vue' {
  interface ComponentCustomProperties {
    $dnd5e: AxiosInstance;
  }
}

export const dnd5eApi = axios.create({
  baseURL: 'https://www.dnd5eapi.co/api/2014',
  headers: {
    'Accept': 'application/json',
  },
});

export default defineBoot(({ app }) => {
  app.config.globalProperties.$dnd5e = dnd5eApi;
});

export { dnd5eApi as api };




