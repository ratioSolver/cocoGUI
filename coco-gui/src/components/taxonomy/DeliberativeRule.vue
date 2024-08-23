<template>
  <n-card v-if="rule" :title="props.rule.name">
    <pre v-html="hljs.highlight(props.rule.content, { language: 'riddle' })"></pre>
  </n-card>
</template>

<script setup lang="ts">
import { rule } from '@/rule';

const props = defineProps<{ rule: rule.DeliberativeRule; }>();
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