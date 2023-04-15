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
            <tr v-for="[name, type] in sensor_type.parameters" :key="name">
              <td>{{ name }}</td>
              <td>{{ type }}</td>
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
defineProps({
  sensor_type: {
    type: Object,
    required: true,
  },
});
</script>