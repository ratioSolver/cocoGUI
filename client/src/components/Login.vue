<template>
    <v-dialog persistent v-model="login_dialog" max-width="500px">
        <v-card>
            <v-toolbar dark color="primary">
                <v-toolbar-title>Login form</v-toolbar-title>
            </v-toolbar>
            <v-card-text>
                <v-form>
                    <v-text-field v-model="email" prepend-icon="mdi-account" name="login" label="Login" type="text" />
                    <v-text-field v-model="password" prepend-icon="mdi-lock" name="password" label="Password" type="password" />
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" to="/" @click="useAppStore().login(email, password)">Login</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
export default {
    data() {
        return {
            email: '',
            password: ''
        }
    }
}
</script >

<script setup>
import { useAppStore } from '@/store/app';
import { storeToRefs } from 'pinia';

const { login_dialog } = storeToRefs(useAppStore())
</script>