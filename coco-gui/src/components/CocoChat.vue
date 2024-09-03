<template>
  <n-card>
    <n-list :id="props.chat_id" style="max-height: calc(100vh - 190px);">
      <n-list-item v-for="msg in messages(props.item)" :key="msg.timestamp.getTime()"
        :class="msg.me ? 'text-right' : 'text-left'">
        <n-tag v-if="msg.text" :type="msg.me ? 'primary' : 'default'" round>
          {{ msg.text }}
        </n-tag>
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
import { coco } from '@/coco';
import { ref, watch } from 'vue';

const props = withDefaults(defineProps<{ item: taxonomy.Item; chat_id: string; }>(), { chat_id: 'chat' });

const chat = ref(null)

const message = ref('');

const send_message = () => {
  const data: Record<string, any> = {};
  data.me = true;
  data.text = message.value;
  coco.KnowledgeBase.getInstance().publish(props.item, data);

  message.value = '';
};

watch(() => props.item.values, () => (chat.value! as HTMLDivElement).scrollTop = (chat.value! as HTMLDivElement).scrollHeight);
</script>

<script lang="ts">
function messages(item: taxonomy.Item) {
  return item.values.filter((v: taxonomy.Data) => Object.keys(v.data).includes('text')).map((v: taxonomy.Data) => {
    return {
      timestamp: new Date(v.timestamp),
      me: v.data.me,
      text: v.data.text
    };
  });
}
</script>