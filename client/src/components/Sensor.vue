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
    <v-divider v-if="sensor.value"></v-divider>
    <v-container v-if="sensor.value">
      <v-table>
        <thead>
          <tr>
            <th class="text-left" width="60%">Parameter name</th>
            <th class="text-left" width="20%">Type</th>
            <th class="text-left" width="20%">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="parameter in sensor_types.get(sensor.type).parameters" :key="parameter.name">
            <td>{{ parameter.name }}</td>
            <td>{{ parameter_type(parameter.type) }}</td>
            <td>{{ sensor.value[parameter.name] }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-container>
    <v-divider></v-divider>
    <v-container>
      <v-table>
        <thead>
          <tr>
            <th class="text-left" width="60%">Parameter name</th>
            <th class="text-left" width="20%">Type</th>
            <th class="text-left" width="20%">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="parameter in sensor_types.get(sensor.type).parameters" :key="parameter.name">
            <td>{{ parameter.name }}</td>
            <td>{{ parameter_type(parameter.type) }}</td>
            <td>
              <v-text-field v-if="input_type(parameter.type) == 'number'" v-model.number="value[parameter.name]"
                :type="input_type(parameter.type)" :rules="[v => !!v || 'Value is required']" label="Value" required />
              <v-text-field v-else v-model="value[parameter.name]" :type="input_type(parameter.type)"
                :rules="[v => !!v || 'Value is required']" label="Value" required />
            </td>
          </tr>
        </tbody>
      </v-table>
      <v-btn block @click="useAppStore().publish_sensor_value(sensor.id, value)">Publish</v-btn>
    </v-container>
  </v-window-item>
</template>

<script>
export default {
  data: () => ({
    value: {},
  }),
  mounted() {
    useAppStore().sensor_types.get(this.sensor.type).parameters.forEach((parameter) => {
      this.value[parameter.name] = this.sensor.value ? this.sensor.value[parameter.name] : '';
    });
  },
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

const { sensor_types, parameter_type, input_type } = storeToRefs(useAppStore());
</script>