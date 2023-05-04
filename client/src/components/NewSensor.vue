<template>
  <v-dialog v-model="new_sensor_dialog" max-width="500px">
    <v-card>
      <v-toolbar dark color="primary">
        <v-toolbar-title>New sensor</v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <v-form v-model="valid">
          <v-text-field v-model="name" :rules="[v => !!v || 'Name is required']" name="name" label="Sensor name" type="text" clearable required />
          <v-text-field v-model="description" name="description" label="Description"
            type="text" clearable />
          <v-select v-model="sensor_type" :items="Array.from(sensor_types.values())" label="Sensor type" item-title="name" item-value="id" required />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" to="/" @click="useAppStore().new_sensor(name, description)">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      valid: false,
      name: '',
      description: '',
      sensor_type: ''
    }
  }
}
</script>

<script setup>
import { useAppStore } from '@/store/app';
import { storeToRefs } from 'pinia';

const { new_sensor_dialog, sensor_types } = storeToRefs(useAppStore())
</script>