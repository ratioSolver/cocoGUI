<template>
  <n-grid x-gap="12" y-gap="12" :cols="2">
    <n-grid-item>
      <frame-component title="Taxonomy">
        <taxonomy-graph graph_id="taxonomy-graph" :state="useCoCoStore().kb" style="min-height: 400px;"></taxonomy-graph>
      </frame-component>
    </n-grid-item>
  </n-grid>
</template>

<script setup lang="ts">
import { NGrid, NGridItem } from 'naive-ui';
import { FrameComponent, TaxonomyGraph } from 'coco-gui';
import { useCoCoStore } from '@/stores/coco';
</script>