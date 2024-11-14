<template>
  <n-flex style="align-items: center;">
    <n-button v-if="coco.KnowledgeBase.getInstance().user?.properties.role == 0" size="large"
      @click="new_type_dialog = true">
      <n-icon size="22" :component="AppsAddIn20Filled" />
    </n-button>
    <n-button v-if="coco.KnowledgeBase.getInstance().user?.properties.role < 1" size="large"
      @click="new_item_dialog = true">
      <n-icon size="22" :component="AddSquare20Filled" />
    </n-button>
    <n-button v-if="coco.KnowledgeBase.getInstance().user?.properties.role < 2" size="large"
      @click="new_user_dialog = true">
      <n-icon size="22" :component="PersonAdd20Filled" />
    </n-button>
    <n-dropdown v-if="coco.KnowledgeBase.getInstance().auth" trigger="click"
      :options="coco.KnowledgeBase.getInstance().user ? loggedin_options : loggedout_options" @select="handle_option">
      <n-button v-if="coco.KnowledgeBase.getInstance().user" size="large">
        <n-icon size="36" :component="Person20Filled" />
      </n-button>
      <n-button v-else size="large">Login</n-button>
    </n-dropdown>
  </n-flex>
  <new-type-dialog
    v-if="!coco.KnowledgeBase.getInstance().user || coco.KnowledgeBase.getInstance().user!.properties.role == 0"
    :modal="new_type_dialog" @update:modal="new_type_dialog = $event" />
  <new-item-dialog
    v-if="!coco.KnowledgeBase.getInstance().user || coco.KnowledgeBase.getInstance().user!.properties.role < 1"
    :modal="new_item_dialog" @update:modal="new_item_dialog = $event" />
  <new-user-dialog
    v-if="!coco.KnowledgeBase.getInstance().user || coco.KnowledgeBase.getInstance().user!.properties.role < 2"
    :modal="new_user_dialog" @update:modal="new_user_dialog = $event" />
  <login-dialog v-if="coco.KnowledgeBase.getInstance().auth && !coco.KnowledgeBase.getInstance().user"
    :modal="login_dialog" @update:modal="login_dialog = $event" />
</template>

<script setup lang="ts">
import NewTypeDialog from './taxonomy/NewTypeDialog.vue';
import NewItemDialog from './taxonomy/NewItemDialog.vue';
import NewUserDialog from './user/NewUserDialog.vue';
import LoginDialog from './user/LoginDialog.vue';
import { coco } from '@/coco';
import { AppsAddIn20Filled, AddSquare20Filled, PersonAdd20Filled, Person20Filled } from '@vicons/fluent';
import { NFlex, NDropdown, NButton, NIcon, type DropdownOption } from 'naive-ui';
import { ref } from 'vue';

const new_type_dialog = ref(false);
const new_item_dialog = ref(false);
const new_user_dialog = ref(false);
const login_dialog = ref(false);

const loggedout_options: DropdownOption[] = [
  { label: 'Login', key: 'login' },
  { label: 'Register', key: 'register' }
];
const loggedin_options: DropdownOption[] = [
  { label: 'Profile', key: 'profile' },
  { label: 'Logout', key: 'logout' }
];
function handle_option(key: string): void {
  switch (key) {
    case 'login': login_dialog.value = true; break;
    case 'register': new_user_dialog.value = true; break;
    case 'profile': break;
    case 'logout': return coco.KnowledgeBase.getInstance().logout();
  }
}
</script>