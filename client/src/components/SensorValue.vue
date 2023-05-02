<template>
  <v-container>
    <v-container :id="get_sensor_id(sensor.id)" class="h-25" />
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
          <td>{{ sensor.value[name] }}</td>
        </tr>
      </tbody>
    </v-table>
  </v-container>
</template>

<script>
import { server } from '@/store/app';
import { SensorD3 } from '@/sensorD3';

export default {
  mounted() {
    this.sensor.init(useAppStore().get_sensor_id(this.sensor.id), 1000, 400);
    var d = new Date();
    d.setMonth(d.getMonth() - 1);
    d.setHours(0, 0, 0, 0);
    fetch('http://' + server.host + ':' + server.port + '/sensor/' + this.sensor.id + '?' + new URLSearchParams({ from: d.getTime() / 1000 }), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'token': useAppStore().token
      }
    }).then(res => {
      if (res.status === 200)
        res.json().then(data => this.sensor.set_data(data));
    });
  }
}
</script>

<script setup>
import { useAppStore } from '@/store/app';
import { storeToRefs } from 'pinia';

defineProps({
  sensor: {
    type: SensorD3,
    required: true,
  },
});

const { get_sensor_id } = storeToRefs(useAppStore());
</script>