<template>
  <n-card v-if="rule" :title="rule.name">
    <pre v-html="code"></pre>
  </n-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { onBeforeRouteUpdate } from 'vue-router';
import { useCoCoStore } from '@/stores/coco';
import { rule } from '@/rule';

const rule = ref<rule.DeliberativeRule | undefined>(undefined);
onBeforeRouteUpdate((to, from) => { rule.value = useCoCoStore().state.deliberative_rules.get(to.params.id as string); });

const code = ref('');

watch(rule, () => {
  if (rule.value)
    code.value = hljs.highlight(rule.value.content.toString(), { language: 'riddle' }).value;
});
</script>

<script lang="ts">
import 'highlight.js/styles/default.min.css'
import hljs from 'highlight.js/lib/core'
import { HLJSApi } from 'highlight.js';

hljs.registerLanguage('riddle', function (hljs: HLJSApi) {
  return {
    case_insensitive: false,
    keywords: {
      keyword: 'class predicate fact goal new for this void return bool int real time string typedef enum',
      built_in: 'Impulse Interval Agent StateVariable ReusableResource ConsumableResource',
      literal: 'true false'
    },
    contains: [
      {
        className: 'comment',
        begin: '//', end: '$'
      },
      {
        className: 'comment',
        begin: '/\\*', end: '\\*/'
      },
      {
        className: 'variable',
        begin: '\\[a-zA-Z][a-zA-Z0-9_-]*'
      },
      {
        className: 'number',
        begin: '\\b\\d+(\\.\\d+)?'
      },
      {
        className: 'string',
        begin: '"', end: '"'
      },
      {
        className: 'punctuation',
        begin: '[:,()]'
      },
      {
        className: 'operator',
        begin: '\\b(&|\\\||\\\^|or|!|<|>|->|>=|<=|==|\\\+|-|\\\*|/)\\b'
      }
    ]
  };
});
</script>