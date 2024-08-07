<template>
  <n-card>
    <n-list id="chat-list" style="max-height: calc(100vh - 190px);">
      <n-list-item v-for="msg in props.messages" :key="msg.timestamp.getDate()"
        :class="Object.hasOwn(msg.data, 'me') ? 'text-right' : 'text-left'">
        <n-tag :type="Object.hasOwn(msg.data, 'me') ? 'primary' : 'default'">{{ msg.data.content }}</n-tag>
      </n-list-item>
    </n-list>
    <template #action>
      <n-input v-model:value="message" @keyup.enter="send_message" />
      <n-button @click="send_message">Send</n-button>
    </template>
  </n-card>
</template>

<script setup lang="ts">
import { NCard, NList, NListItem, NTag, NInput, NButton } from 'naive-ui';
import { taxonomy } from '@/taxonomy';
import { ref, nextTick } from 'vue';

const props = defineProps<{ messages: taxonomy.Data[]; }>();
const emit = defineEmits<{ (event: 'send', message: string): void; }>();

const message = ref('');

const send_message = () => {
  emit('send', message.value);
  message.value = '';
  nextTick(() => {
    const chat_list = document.getElementById('chat-list')! as HTMLDivElement;
    chat_list.scrollTop = chat_list.scrollHeight;
  });
};
</script>