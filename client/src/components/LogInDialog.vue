<template>
  <v-dialog v-model="local_dialog" max-width="290">
    <v-card>
      <v-card-title>
        <span class="headline">Log in</span>
      </v-card-title>
      <v-card-text>
        <v-form @submit.prevent="login">
          <v-text-field v-model="username" label="Username" required></v-text-field>
          <v-text-field v-model="password" label="Password" type="password" required></v-text-field>
          <v-btn type="submit" color="primary">Log in</v-btn>
        </v-form>
        <v-alert v-if="error !== null" type="error">{{ error.message }}</v-alert>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Error } from '@/error';

const props = defineProps<{ dialog: boolean; login: (username: string, password: string) => Promise<Error>; }>();
const emit = defineEmits<{ (event: 'update:dialog', value: boolean): void; }>();

const local_dialog = ref(props.dialog);
const username = ref('');
const password = ref('');
const error = ref<Error | null>(null);

watch(() => props.dialog, (value) => local_dialog.value = value);

const login = async () => {
  error.value = await props.login(username.value, password.value);
  if (error.value === null) {
    emit('update:dialog', false);
  }
};
</script>