<template>
  <v-window-item class="fill-height" :value="item_type.id">
    <v-card :title="item_type.name" :subtitle="item_type.description">
      <v-container>
        <v-row>
          <v-col cols="6">
            <v-text-field v-model="item_type.name" :rules="[v => !!v || 'Name is required']" label="Name" required />
          </v-col>
          <v-col cols="6">
            <v-text-field v-model="item_type.description" :rules="[v => !!v || 'Description is required']"
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
            <tr v-for="[name, type] in item_type.parameters" :key="name">
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
import { Type } from '@/item';

const props = defineProps({
  item_type: {
    type: Type,
    required: true
  }
});
</script>