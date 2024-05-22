<template>
  <v-window-item class="fill-height" :value="rule.id" eager>
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
import { ref, onMounted } from 'vue'
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
  code.value = props.rule.content.toString();
  hljs.highlightElement(document.getElementById(get_rule_id(props.rule)));
});

const get_rule_id = (rule) => 'rule-' + rule.id;
</script>