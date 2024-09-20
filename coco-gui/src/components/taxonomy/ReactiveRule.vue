<template>
  <n-grid v-if="rule" x-gap="12" y-gap="12" :cols="1" style="padding: 12px;">
    <n-grid-item>
      <n-input v-model:value="name" label="Name" required />
    </n-grid-item>
    <n-grid-item>
      <n-code :code="content" language="clips" label="Content" :hljs="hljs" />
    </n-grid-item>
    <n-grid-item>
      <n-input type="textarea" v-model:value="content" label="Content" placeholder="Enter rule content" round
        clearable />
    </n-grid-item>
  </n-grid>
</template>

<script setup lang="ts">
import { rule } from '@/rule';
import { ref } from 'vue';
import { NGrid, NGridItem, NCode, NInput } from 'naive-ui';

const props = defineProps<{ rule: rule.ReactiveRule; }>();

const name = ref<string>(props.rule.name);
const content = ref<string>(props.rule.content);
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