<template>
  <v-card class="d-flex flex-column fill-height">
    <v-card-text>
      <v-list id="chat-list" class="flex-grow-1 overflow-y-auto" style="max-height: calc(100vh - 190px);">
        <v-list-item v-for="msg in props.messages" :key="msg.timestamp.toDateString"
          :class="msg.me ? 'text-right' : 'text-left'">
          <v-chip :color="msg.me ? 'primary' : 'secondary'" class="white--text">{{ msg.text }}</v-chip>
        </v-list-item>
      </v-list>
    </v-card-text>
    <v-card-actions>
      <v-text-field v-model="message" @keyup.enter="send_message" />
      <v-btn @click="send_message">Send</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { Message } from '@/message';
import { ref, nextTick } from 'vue';

const props = defineProps<{ messages: Message[]; }>();

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