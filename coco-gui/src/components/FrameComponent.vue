<template>
  <n-card :title="props.title" :class="{ fullscreen: maximized }">
    <template #header-extra>
      <n-button class="toggle-button" @click="maximized = !maximized">
        <n-icon size="small" :component="maximized ? FullScreenMinimize24Regular : FullScreenMaximize20Regular" />
      </n-button>
    </template>
    <div class="content">
      <slot></slot>
    </div>
  </n-card>
</template>

<script setup lang="ts">
import { NCard, NButton, NIcon } from 'naive-ui';
import { FullScreenMaximize20Regular, FullScreenMinimize24Regular } from '@vicons/fluent';
import { ref } from 'vue';

const props = defineProps<{ title: string; }>();

const maximized = ref(false);
</script>

<style scoped>
.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  overflow: auto;
  transition: all 0.3s;
}

.toggle-button {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1001;
}

.content {
  padding: 20px;
}
</style>
