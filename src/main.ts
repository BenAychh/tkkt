import './assets/main.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { debounce } from 'ts-debounce';
import { PiniaDebounce } from '@pinia/plugin-debounce';
import PrimeVue from 'primevue/config';
import Aura from 'primevue/themes/aura';
import ToastService from 'primevue/toastservice';
import ConfirmationService from 'primevue/confirmationservice';
import Tooltip from 'primevue/tooltip';

import App from './App.vue';
import router from './router';
import { initializeSQLite } from '@/db/db';

await initializeSQLite();

const app = createApp(App);
const pinia = createPinia();
pinia.use(PiniaDebounce(debounce));

app.use(pinia);
app.use(ToastService);
app.use(ConfirmationService);
app.directive('tooltip', Tooltip);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.my-app-dark',
    },
  },
});
app.use(router);

app.mount('#app');
