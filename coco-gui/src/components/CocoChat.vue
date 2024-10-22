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
          <n-button @click="open_mic" :bordered="false" v-if="has_speech_recognition"
            :disabled="!props.item.type.dynamic_properties.has('open_mic') || speaking">
            <n-icon :component="recognizing ? Mic24Filled : Mic24Regular" />
          </n-button>
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
import { Send24Regular, Mic24Regular, Mic24Filled } from '@vicons/fluent';
import { taxonomy } from '@/taxonomy';
import { coco } from '@/coco';
import { ref, watch } from 'vue';

const range = ref<[number, number]>([new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).getTime(), new Date().getTime()]);

const props = withDefaults(defineProps<{ item: taxonomy.Item; chat_id: string; }>(), { chat_id: 'chat' });
if (!props.item.values.length)
  coco.KnowledgeBase.getInstance().load_data(props.item, range.value[0], range.value[1]);

const chat = ref(null)

const message = ref('');

const recognition = new ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)();
const has_speech_recognition = ref(!!recognition);
const recognizing = ref(false);

const synthesis = window.speechSynthesis;
const speaking = ref(false);

// Check if the browser supports the SpeechRecognition API
if (recognition) {
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event: any) => {
    message.value = event.results[0][0].transcript;
  };

  recognition.onspeechend = () => {
    close_mic();
    send_message();
  };

  watch(() => props.item.value, () => {
    if (props.item.value.data.open_mic)
      open_mic();
    else
      close_mic();
  });
}

const open_mic = () => {
  const data: Record<string, any> = {};
  data.open_mic = true;
  coco.KnowledgeBase.getInstance().publish(props.item, data);
  recognizing.value = true;
  recognition.start();
};

const close_mic = () => {
  const data: Record<string, any> = {};
  data.open_mic = false;
  coco.KnowledgeBase.getInstance().publish(props.item, data);
  recognizing.value = false;
  recognition.stop();
};

const syntesize = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.onstart = () => speaking.value = true;
  utterance.onend = () => speaking.value = false;
  synthesis.speak(utterance);
};

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
watch(() => props.item.value.data, (value => {
  if (value.text && !value.me)
    syntesize(value.text);
}));
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