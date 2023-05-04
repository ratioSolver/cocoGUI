<template>
  <v-dialog v-model="new_sensor_type_dialog" max-width="500px">
    <v-card>
      <v-toolbar dark color="primary">
        <v-toolbar-title>New sensor type</v-toolbar-title>
      </v-toolbar>
      <v-card-text>
        <v-form v-model="valid">
          <v-text-field v-model="name" :rules="[v => !!v || 'Name is required']" name="name" label="Sensor type name"
            type="text" clearable required />
          <v-text-field v-model="description" name="description" label="Description" type="text" clearable />
          <v-divider></v-divider>
          <v-table dense>
            <thead>
              <tr>
                <th class="text-left">Parameter name</th>
                <th class="text-left">Type</th>
                <th class="text-center">
                  <v-btn icon @click="parameters.push({ idx: parameters.length, name: '', type: 0 })">
                    <v-icon>mdi-plus</v-icon>
                  </v-btn>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="par in parameters" :key="par.idx">
                <td>
                  <v-text-field v-model="par.name" :rules="[v => !!v || 'Parameter name is required']" :name="`name_${par.idx}`"
                    label="Parameter name" type="text" clearable required />
                </td>
                <td>
                  <v-select v-model="par.type"
                    :items="[{ id: 0, name: 'Integer' }, { id: 1, name: 'Float' }, { id: 2, name: 'Bool' }, { id: 3, name: 'Symbol' }, { id: 4, name: 'String' }]"
                    label="Parameter type" item-title="name" item-value="id" required />
                </td>
                <td class="text-center">
                  <v-btn icon @click="parameters.splice(par.idx, 1)">
                    <v-icon>mdi-delete</v-icon>
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" to="/" @click="useAppStore().new_sensor_type(name, description, parameters)">Create</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  data() {
    return {
      valid: false,
      name: '',
      description: '',
      parameters: [],
    }
  }
}
</script>

<script setup>
import { useAppStore } from '@/store/app';
import { storeToRefs } from 'pinia';

const { new_sensor_type_dialog } = storeToRefs(useAppStore())
</script>