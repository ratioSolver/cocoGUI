/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'
import { useCoCoStore } from './store/coco';

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

const app = createApp(App)

registerPlugins(app)

app.mount('#app')

console.log('Connecting to ' + import.meta.env.VITE_NAME + '..');
document.title = import.meta.env.VITE_NAME;
useCoCoStore().connect();