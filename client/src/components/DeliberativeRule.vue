<template>
  <v-window-item class="fill-height" :value="rule.id" eager @group:selected="lazy_load">
    <v-card :title="rule.name">
      <v-container>
        <v-row>
          <v-col cols="12">
            <v-textarea :id="get_rule_id(rule)" v-model="code" readonly rows="10" />
          </v-col>
        </v-row>
      </v-container>
    </v-card>
  </v-window-item>
</template>

<script setup>
import hljs from 'highlight.js/lib/core'
import { Rule } from '@/solver';

const props = defineProps({
  rule: {
    type: Rule,
    required: true
  }
});

const code = ref('');

onMounted(() => {
  code.value = rule.content.toString();
  hljs.highlightBlock(document.getElementById(get_rule_id(rule)));
});

const get_rule_id = (rule) => 'rule-' + rule.id;
</script>