<template>
  <v-container>
    <v-table dense>
      <thead>
        <tr>
          <th class="text-left" width="60%">Parameter name</th>
          <th class="text-left" width="20%">Type</th>
          <th class="text-left" width="20%">Value</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="[name, type] in sensor.type.parameters" :key="name">
          <td>{{ name }}</td>
          <td>{{ type }}</td>
          <td>
            <v-text-field v-if="input_type(type) == 'number'" v-model.number="value[name]" :type="input_type(type)"
              :rules="[v => !!v || 'Value is required']" label="Value" required />
            <v-text-field v-else v-model="value[name]" :type="input_type(type)" :rules="[v => !!v || 'Value is required']"
              label="Value" required />
          </td>
        </tr>
      </tbody>
    </v-table>
    <v-btn block @click="useAppStore().publish_sensor_value(sensor.id, value)">Publish</v-btn>
  </v-container>
</template>

<script>
export default {
  data: () => ({
    value: {},
  }),
  mounted() {
    for (const [name, type] of this.sensor.type.parameters)
      if (this.sensor.value) {
        this.value[name] = this.sensor.value[name];
      } else {
        switch (type) {
          case 'int':
            this.value[name] = 0;
            break;
          case 'float':
            this.value[name] = 0.0;
            break;
          case 'symbol':
          case 'string':
            this.value[name] = '';
            break;
          case 'bool':
            this.value[name] = false;
            break;
          default:
            this.value[name] = '';
            break;
        }
      }
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

const { input_type } = storeToRefs(useAppStore());
</script>