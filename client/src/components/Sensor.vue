<template>
  <v-window-item :value="sensor.id">
    <v-container>
      <v-row>
        <v-col cols="12" md="6">
          <v-text-field v-model="sensor.name" :rules="[v => !!v || 'Name is required']" label="Name" required />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field v-model="sensor.description" :rules="[v => !!v || 'Description is required']" label="Description"
            required />
        </v-col>
        <v-col v-if="sensor.location" cols="12" md="3">
          <v-text-field v-model="sensor.location.x" :rules="[v => !!v || 'Location x is required']" label="Location x"
            required />
        </v-col>
        <v-col v-if="sensor.location" cols="12" md="3">
          <v-text-field v-model="sensor.location.y" :rules="[v => !!v || 'Location y is required']" label="Location y"
            required />
        </v-col>
        <v-col cols="12" md="6">
          <v-select v-model="sensor.type" :items="Array.from(sensor_types.values())" item-title="name" item-value="id"
            :rules="[v => !!v || 'Sensor type is required']" label="Sensor type" required />
        </v-col>
      </v-row>
    </v-container>
    <v-divider></v-divider>
    <SensorValue v-if="sensor.value" :sensor="sensor" />
    <v-divider></v-divider>
    <SensorPublisher :sensor="sensor" />
  </v-window-item>
</template>

<script setup>
import { useAppStore } from '@/store/app';
import { storeToRefs } from 'pinia';
import SensorValue from '@/components/SensorValue.vue';
import SensorPublisher from '@/components/SensorPublisher.vue';

defineProps({
  sensor: {
    type: Object,
    required: true,
  },
});

const { sensor_types } = storeToRefs(useAppStore());
</script>