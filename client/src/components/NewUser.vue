<template>
    <v-dialog v-model="new_user_dialog" max-width="500px">
      <v-card>
        <v-toolbar dark color="primary">
          <v-toolbar-title>New user</v-toolbar-title>
        </v-toolbar>
        <v-card-text>
          <v-form v-model="valid">
            <v-text-field v-model="first_name" :rules="[v => !!v || 'First name is required']" name="first_name" label="First name" type="text" clearable required />
            <v-text-field v-model="last_name" :rules="[v => !!v || 'Last name is required']" name="last_name" label="Last name" type="text" clearable required />
            <v-text-field v-model="email" :rules="[v => !!v || 'E-mail is required']" name="email" label="E-mail" type="text" clearable required />
            <v-text-field v-model="password" :rules="[v => !!v || 'Password is required']" name="password" label="Password" type="password" clearable required />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" to="/" @click="useAppStore().new_user(first_name, last_name, email, password)">Create</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </template>
  
  <script>
  export default {
    data() {
      return {
        valid: false,
        first_name: '',
        last_name: '',
        email: '',
        password: ''
      }
    }
  }
  </script>
  
  <script setup>
  import { useAppStore } from '@/store/app';
  import { storeToRefs } from 'pinia';
  
  const { new_user_dialog } = storeToRefs(useAppStore())
  </script>