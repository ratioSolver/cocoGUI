<template>
  <v-window-item :value="sensor.id">
    <v-form v-model="valid">
      <v-container>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field v-model="sensor.name" :rules="[v => !!v || 'Name is required']" label="Name" required />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model="sensor.description" :rules="[v => !!v || 'Description is required']"
              label="Description" required />
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
            <v-select v-model="sensor.sensor_type" :items="sensor_types" item-title="name" item-value="id"
              :rules="[v => !!v || 'Sensor type is required']" label="Sensor type" required />
          </v-col>
        </v-row>
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
  sensor: {
    type: Object,
    required: true,
  },
});

const { sensor_types } = storeToRefs(useAppStore());
</script>