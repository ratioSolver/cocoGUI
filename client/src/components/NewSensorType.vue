<template>
  <v-dialog v-model="new_sensor_type_dialog" max-width="500px">
    <v-card>
      <v-toolbar dark color="primary">
        <v-toolbar-title>New sensor type</v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <v-form v-model="valid">
          <v-text-field v-model="name" :rules="[v => !!v || 'Name is required']" name="name" label="Sensor type name"
            type="text" clearable required />
          <v-text-field v-model="description" name="description" label="Description" type="text" clearable />
          <v-divider></v-divider>
          <v-table>
            <thead>
              <tr>
                <th class="text-left">Parameter name</th>
                <th class="text-left">Type</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="[name, type] in parameters" :key="name">
                <td>{{ name }}</td>
                <td>{{ type }}</td>
              </tr>
            </tbody>
          </v-table>
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
      valid: false,
      name: '',
      description: '',
      parameters: {},
    }
  }
}
</script>

<script setup>
import { useAppStore } from '@/store/app';
import { storeToRefs } from 'pinia';

const { new_sensor_type_dialog } = storeToRefs(useAppStore())
</script>