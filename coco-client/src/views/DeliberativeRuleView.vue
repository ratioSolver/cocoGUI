<template>
  <deliberative-rule v-if="rule" :rule="rule" :key="rule.id" />
</template>

<script setup lang="ts">
import { DeliberativeRule, coco } from 'coco-gui';
import { onBeforeRouteUpdate, useRoute } from 'vue-router';

const route = useRoute();
let rule = coco.KnowledgeBase.getInstance().deliberative_rules.get(route.params.id as string);
onBeforeRouteUpdate((to, from) => { rule = coco.KnowledgeBase.getInstance().deliberative_rules.get(to.params.id as string); });
</script>