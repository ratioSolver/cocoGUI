<template>
  <v-dialog v-model="new_sensor_type_dialog" max-width="500px">
    <v-card>
      <v-toolbar dark color="primary">
        <v-toolbar-title>New sensor type</v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <v-form>
          <v-text-field v-model="name" prepend-icon="mdi-account" name="name" label="Sensor type name" type="text" />
          <v-text-field v-model="description" prepend-icon="mdi-lock" name="description" label="Description"
            type="text" />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" to="/" @click="useAppStore().new_sensor_type(name, description)">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      name: '',
      description: ''
    }
  }
}
</script>

<script setup>
import { useAppStore } from '@/store/app';
import { storeToRefs } from 'pinia';

const { new_sensor_type_dialog } = storeToRefs(useAppStore())
</script>