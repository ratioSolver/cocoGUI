<template>
  <v-dialog v-model="local_dialog" max-width="290">
    <v-card>
      <v-card-title>
        <span class="headline">Register</span>
      </v-card-title>
      <v-card-text>
        <v-form @submit.prevent="register">
          <v-text-field v-model="first_name" label="First name" required></v-text-field>
          <v-text-field v-model="last_name" label="Last name" required></v-text-field>
          <v-text-field v-model="username" label="Username" required></v-text-field>
          <v-text-field v-model="password" label="Password" type="password" required></v-text-field>
          <v-btn type="submit" color="primary">Register</v-btn>
        </v-form>
        <v-alert v-if="error !== null" type="error">{{ error.message }}</v-alert>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Error } from '@/error';

const props = defineProps<{ dialog: boolean; register: (first_name: string, last_name: string, username: string, password: string) => Promise<Error>; }>();
defineEmits<{ (event: 'update:dialog', value: boolean): void; }>();

const local_dialog = ref(props.dialog);
const error = ref<Error | null>(null);
const first_name = ref('');
const last_name = ref('');
const username = ref('');
const password = ref('');

watch(() => props.dialog, (value) => local_dialog.value = value);

const register = async () => {
  error.value = await props.register(first_name.value, last_name.value, username.value, password.value);
  if (error.value === null) {
    emit('update:dialog', false);
  }
};
</script>