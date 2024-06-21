<template>
  <v-card :title="type.name" :subtitle="type.description">
    <v-container>
      <v-row>
        <v-col cols="6">
          <v-text-field v-model="type.name" :rules="[v => !!v || 'Name is required']" label="Name" required />
        </v-col>
        <v-col cols="6">
          <v-text-field v-model="type.description" :rules="[v => !!v || 'Description is required']" label="Description"
            required />
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
          <tr v-for="[index, tp] in Object.entries(type.static_parameters) as [string, coco.Parameter][]" :key="index">
            <td>{{ tp.name }}</td>
            <td>{{ tp.default_value }}</td>
          </tr>
        </tbody>
      </v-table>
      <v-divider />
      <v-table>
        <thead>
          <tr>
            <th class="text-left">Parameter name</th>
            <th class="text-left">Parameter type</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="[index, tp] in Object.entries(type.dynamic_parameters) as [string, coco.Parameter][]" :key="index">
            <td>{{ tp.name }}</td>
            <td>{{ tp.default_value }}</td>
          </tr>
        </tbody>
      </v-table>
    </v-container>
  </v-card>
</template>

<script setup lang="ts">
import { coco } from '@/type';

defineProps<{ type: coco.Type; }>();
</script>