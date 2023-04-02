<template>
  <v-list-item>
    <v-list-item-title>{{user.first_name}}</v-list-item-title>
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