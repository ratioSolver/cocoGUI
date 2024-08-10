<template>
  <n-card size="small" :title="props.title" :class="{ 'full-screen': maximized }"
    header-style="background-color: #f0f2f5;" hoverable>
    <template #header-extra>
      <n-button size="small" icon-only @click="maximized = !maximized">
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
.full-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1000;
  overflow: auto;
  transition: all 0.3s;
}

.content {
  padding: 10px;
}
</style>
