<template>
  <v-window-item :value="user.id">
    <v-form v-model="valid">
      <v-container>
        <v-row>
          <v-col cols="12" md="6">
            <v-text-field v-model="user.first_name" :rules="[v => !!v || 'First name is required']" label="First name"
              required />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model="user.last_name" :rules="[v => !!v || 'Last name is required']" label="Last name"
              required />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model="user.email" :rules="[v => !!v || 'E-mail is required']" label="E-mail" required />
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field v-model="user.password" :type="'password'" :rules="[v => !!v || 'Password is required']"
              label="Password" required />
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
defineProps({
  user: {
    type: Object,
    required: true,
  },
});
</script>