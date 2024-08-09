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

const rule = ref<rule.ReactiveRule | undefined>(undefined);
onBeforeRouteUpdate((to, from) => { rule.value = useCoCoStore().state.reactive_rules.get(to.params.id as string); });

const code = ref('');

watch(rule, () => {
  if (rule.value)
    code.value = hljs.highlight(rule.value.content.toString(), { language: 'clips' }).value;
});
</script>

<script lang="ts">
import 'highlight.js/styles/default.min.css'
import hljs from 'highlight.js/lib/core'
import { HLJSApi } from 'highlight.js';

hljs.registerLanguage('clips', function (hljs: HLJSApi) {
  return {
    case_insensitive: true,
    keywords: {
      keyword: 'defrule deftemplate deffunction slot multislot assert retract modify bind type return',
      literal: 'nil SYMBOL STRING NUMBER TRUE FALSE'
    },
    contains: [
      hljs.COMMENT(';', '$'),
      {
        className: 'variable',
        begin: '\\?[a-zA-Z][a-zA-Z0-9_-]*'
      },
      {
        className: 'string',
        begin: '"', end: '"'
      },
      {
        className: 'number',
        begin: '\\b\\d+(\\.\\d+)?\\b'
      },
      {
        className: 'punctuation',
        begin: '[:,()]'
      },
      {
        className: 'built_in',
        begin: '\\b(eq|do-for-fact|do-for-all-facts)\\b'
      },
      {
        className: 'operator',
        begin: '\\b(and|or|not|=>|<=>|\\\+|-|\\\*|/)\\b'
      }
    ]
  };
});
</script>