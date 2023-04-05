<template>
  <v-list-item :value="user.id" :title="user.first_name + ' ' + user.last_name" :subtitle="user.email">
  </v-list-item>
</template>

<script setup>
defineProps({
  user: {
    type: Object,
    required: true,
  },
})
</script>