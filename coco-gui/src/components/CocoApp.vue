<template>
  <n-config-provider :themeOverrides="themeOverrides">
    <n-message-provider>
      <n-modal-provider>
        <coco-layout>
          <template #header>
            <slot name="header"></slot>
          </template>
          <template #header-extra>
            <slot name="header-extra"></slot>
          </template>
          <template #drawer>
            <slot name="drawer"></slot>
          </template>
          <template #default>
            <slot></slot>
          </template>
        </coco-layout>
      </n-modal-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<script setup lang="ts">
import { NConfigProvider, NMessageProvider, NModalProvider, GlobalThemeOverrides } from 'naive-ui'
import CocoLayout from './CocoLayout.vue';

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