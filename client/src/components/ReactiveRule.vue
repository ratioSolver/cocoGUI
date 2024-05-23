<template>
  <v-window-item class="fill-height" :value="rule.id" eager>
    <v-card :title="rule.name">
      <v-container>
        <v-row>
          <v-col cols="12">
            <div v-html="code"></div>
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-window-item>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Rule } from '@/solver';

const props = defineProps({
  rule: {
    type: Rule,
    required: true
  }
});

const code = ref('');

onMounted(() => {
  code.value = hljs.highlight(props.rule.content.toString(), { language: 'clips' }).value;
});
</script>

<script>
import 'highlight.js/styles/default.min.css'
import hljs from 'highlight.js/lib/core'

hljs.registerLanguage('clips', function (hljs) {
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