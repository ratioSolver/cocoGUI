<template>
  <n-card>
    <n-list :id="props.chat_id" style="max-height: calc(100vh - 190px);" ref="chat" :show-divider="false">
      <n-list-item v-for="msg in messages(props.item.values)" :key="msg.timestamp.getTime()"
        :align="msg.me ? 'right' : 'left'">
        <n-tag v-if="msg.text" :type="msg.me ? 'primary' : 'default'" round>
          {{ msg.text }}
        </n-tag>
      </n-list-item>
    </n-list>
    <template #action>
      <n-input v-model:value="message" @keyup.enter="send_message" />
      <n-button type="primary" @click="send_message">Send</n-button>
    </template>
  </n-card>
</template>

<script setup lang="ts">
import { NCard, NList, NListItem, NTag, NInput, NButton } from 'naive-ui';
import { taxonomy } from '@/taxonomy';
import { coco } from '@/coco';
import { ref, watch } from 'vue';

const range = ref<[number, number]>([new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).getTime(), new Date().getTime()]);

const props = withDefaults(defineProps<{ item: taxonomy.Item; chat_id: string; }>(), { chat_id: 'chat' });
if (!props.item.values.length)
  coco.KnowledgeBase.getInstance().load_data(props.item, range.value[0], range.value[1]);

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
function messages(data: taxonomy.Data[]) {
  return data.filter((v: taxonomy.Data) => Object.keys(v.data).includes('text')).map((v: taxonomy.Data) => {
    return {
      timestamp: new Date(v.timestamp),
      me: v.data.me,
      text: v.data.text
    };
  });
}
</script>