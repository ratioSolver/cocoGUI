<template>
  <v-card :title="rule.name">
    <v-container>
      <v-row>
        <v-col cols="12">
          <div v-html="code"></div>
        </v-col>
      </v-row>
    </v-container>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Rule } from '@/knowledge';

const props = defineProps({
  rule: {
    type: Rule,
    required: true
  }
});

const code = ref('');

onMounted(() => {
  code.value = hljs.highlight(props.rule.content.toString(), { language: 'riddle' }).value;
});
</script>

<script>
import 'highlight.js/styles/default.min.css'
import hljs from 'highlight.js/lib/core'

hljs.registerLanguage('riddle', function (hljs) {
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