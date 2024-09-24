<template>
  <n-layout class="coco-app">
    <n-layout-header bordered>
      <n-flex justify="space-between" size="large" style="align-items: center; height: 64px;">
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
</template>

<script setup lang="ts">
import { NLayout, NLayoutHeader, NFlex, NLayoutContent, NButton, NIcon, NDrawer, useMessage } from 'naive-ui'
import { LineHorizontal320Regular } from '@vicons/fluent'
import { ref } from 'vue'
import { coco } from '@/coco'

const message = useMessage()
const drawer = ref(false);

coco.KnowledgeBase.getInstance().info = (msg: string) => message.info(msg);
coco.KnowledgeBase.getInstance().error = (msg: string) => message.error(msg);
coco.KnowledgeBase.getInstance().warning = (msg: string) => message.warning(msg);
coco.KnowledgeBase.getInstance().loading = (msg: string) => message.loading(msg);
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