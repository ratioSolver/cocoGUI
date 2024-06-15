/**
 * main.js
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

// Create the Vue app
const app = createApp(App)

// Register plugins
registerPlugins(app)

// Mount the app
app.mount('#app')
console.log('Server is running on ' + import.meta.env.VITE_HOST + ':' + import.meta.env.VITE_PORT)

import { test_data } from './tests/data';
for (const data of test_data)
    useCoCoStore().update(data);