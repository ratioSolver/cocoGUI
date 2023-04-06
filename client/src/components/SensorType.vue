<template>
  <v-window-item :value="sensor_type.id">
    <v-form v-model="valid">
      <v-container>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field v-model="sensor_type.name" :rules="[v => !!v || 'Name is required']" label="Name" required />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model="sensor_type.description" :rules="[v => !!v || 'Description is required']"
              label="Description" required />
          </v-col>
        </v-row>
        <v-divider></v-divider>
        <v-table>
          <thead>
            <tr>
              <th class="text-left">Parameter name</th>
              <th class="text-left">Type</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="parameter in sensor_type.parameters" :key="parameter.name">
              <td>{{ parameter.name }}</td>
              <td>{{ parameter_type(parameter.type) }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-container>
    </v-form>
  </v-window-item>
</template>

<script>
export default {
  data: () => ({
    valid: false
  })
}
</script>

<script setup>
import { useAppStore } from '@/store/app';
import { storeToRefs } from 'pinia';

defineProps({
  sensor_type: {
    type: Object,
    required: true,
  },
});

const { parameter_type } = storeToRefs(useAppStore());
</script>