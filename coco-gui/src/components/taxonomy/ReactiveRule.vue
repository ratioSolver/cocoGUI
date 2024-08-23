<template>
  <n-card v-if="rule" :title="props.rule.name">
    <pre v-html="hljs.highlight(props.rule.content, { language: 'clips' })"></pre>
  </n-card>
</template>

<script setup lang="ts">
import { rule } from '@/rule';

const props = defineProps<{ rule: rule.ReactiveRule; }>();
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