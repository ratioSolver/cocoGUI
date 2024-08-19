<template>
  <n-layout class="coco-app">
    <n-layout-header bordered style="background-color: lightgray;">
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
    <n-layout-content>
      <n-drawer v-model:show="drawer" placement="left" size="30%">
        <slot name="drawer">
        </slot>
      </n-drawer>
      <slot>
      </slot>
    </n-layout-content>
  </n-layout>
</template>

<script setup lang="ts">
import { NLayout, NLayoutHeader, NFlex, NLayoutContent, NButton, NIcon, NDrawer } from 'naive-ui'
import { LineHorizontal320Regular } from '@vicons/fluent'
import { ref } from 'vue'

const drawer = ref(false);
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