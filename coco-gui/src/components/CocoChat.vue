<template>
  <n-grid y-gap="12" :cols="1" class="chat-container" style="grid-template-rows: 1fr auto; padding: 12px;">
    <n-grid-item>
      <n-list :id="props.chat_id" style="max-height: calc(100vh - 190px);" ref="chat" :show-divider="false">
        <n-list-item v-for="msg in messages(props.item.values)" :key="msg.timestamp.getTime()"
          :align="msg.me ? 'right' : 'left'">
          <n-tag v-if="msg.text" :type="msg.me ? 'primary' : 'default'" round>
            {{ msg.text }}
          </n-tag>
        </n-list-item>
      </n-list>
    </n-grid-item>
    <n-grid-item>
      <n-input v-model:value="message" placeholder="Type a message..." style="width: 100%;" @keyup.enter="send_message">
        <template #suffix>
          <n-button @click="send_message" :bordered="false">
            <n-icon :component="Send24Regular" />
          </n-button>
        </template>
      </n-input>
    </n-grid-item>
  </n-grid>
</template>

<script setup lang="ts">
import { NGrid, NGridItem, NList, NListItem, NTag, NInput, NButton, NIcon } from 'naive-ui';
import { Send24Regular } from '@vicons/fluent';
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
  if (!message.value)
    return;

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

<style scoped>
.chat-container {
  height: 100%;
  width: 100%;
}
</style>