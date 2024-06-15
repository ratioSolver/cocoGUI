/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Plugins
import { registerPlugins } from '@/plugins'
import { useAppStore } from '@/store/app';
import { Type, Item } from '@/item';

// Components
import App from './App.vue'

// Composables
import { createApp } from 'vue'

const app = createApp(App)

registerPlugins(app)

app.mount('#app')
useAppStore().connect()
console.log('Server is running on ' + import.meta.env.VITE_HOST + ':' + import.meta.env.VITE_PORT)

useAppStore().types.set(1, new Type(1, 'type1', 'type1 description', [], []))
useAppStore().types.set(2, new Type(2, 'type2', 'type2 description', [], []))

useAppStore().items.set(3, new Item(3, 'item1', useAppStore().types.get(1), 'item1 description', []))
useAppStore().items.set(4, new Item(4, 'item2', useAppStore().types.get(2), 'item2 description', []))