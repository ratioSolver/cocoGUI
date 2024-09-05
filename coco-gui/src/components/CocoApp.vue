<template>
  <n-config-provider :themeOverrides="themeOverrides">
    <n-layout class="coco-app">
      <n-layout-header bordered>
        <n-flex justify="space-between" style="align-items: center; height: 64px;">
          <n-flex style="align-items: center;">
            <n-button quaternary size="large">
              <n-icon size="36" :component="LineHorizontal320Regular" @click="drawer = !drawer" />
            </n-button>
            <slot name="header">
            </slot>
          </n-flex>
          <slot name="header-extra">
          </slot>
        </n-flex>
      </n-layout-header>
      <n-layout-content style="height: calc(100vh - 65px); overflow: auto;">
        <n-drawer v-model:show="drawer" placement="left" size="30%">
          <slot name="drawer">
          </slot>
        </n-drawer>
        <slot>
        </slot>
      </n-layout-content>
    </n-layout>
  </n-config-provider>
</template>

<script setup lang="ts">
import { NLayout, NLayoutHeader, NFlex, NLayoutContent, NButton, NIcon, NDrawer } from 'naive-ui'
import { LineHorizontal320Regular } from '@vicons/fluent'
import { ref } from 'vue'

const drawer = ref(false);
</script>

<script lang="ts">
import { NConfigProvider, GlobalThemeOverrides } from 'naive-ui'

const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#FF8C00',          // Dark Orange for primary elements
    primaryColorHover: '#FF7F24',     // Slightly darker orange for hover
    primaryColorPressed: '#FF6A00',   // Even darker for pressed state
    primaryColorSuppl: '#FFA500',     // Lighter orange for supplementary elements
  },
  Layout: {
    headerColor: '#F4E1D2',
  }
}
</script>

<style scoped>
.coco-app {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  overflow: auto;
  transition: all 0.3s;
}
</style>