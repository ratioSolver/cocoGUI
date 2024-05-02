<template>
  <v-window-item class="fill-height" :value="sensor_type.id">
    <v-card :title="sensor_type.name" :subtitle="sensor_type.description">
      <v-container>
        <v-row>
          <v-col cols="6">
            <v-text-field v-model="sensor_type.name" :rules="[v => !!v || 'Name is required']" label="Name" required />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="sensor_type.description" :rules="[v => !!v || 'Description is required']"
              label="Description" required />
          </v-col>
        </v-row>
        <v-divider />
        <v-table>
          <thead>
            <tr>
              <th class="text-left">Parameter name</th>
              <th class="text-left">Parameter type</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="[name, type] in sensor_type.parameters" :key="name">
              <td>{{ name }}</td>
              <td>{{ type }}</td>
            </tr>
          </tbody>
        </v-table>
      </v-container>
    </v-card>
  </v-window-item>
</template>

<script setup>
import { SensorType } from '@/sensor';

const props = defineProps({
  sensor_type: {
    type: SensorType,
    required: true
  }
});
</script>