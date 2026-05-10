<script setup lang="ts">

import {computed, h, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {MenuProps} from "ant-design-vue";
import {DollarCircleOutlined, SettingOutlined} from '@ant-design/icons-vue';

const activeKey = ref<string[]>(['home']);


const menuOptions = ref<MenuProps['items']>([
  {
    label: '主页',
    key: 'home',
    title: '主页',
    icon: () => h(DollarCircleOutlined),
  },
  {
    label: '设置',
    title: '设置',
    key: 'setting',
    icon: () => h(SettingOutlined),
  },
  {
    label: '帮助',
    title: '帮助',
    key: 'help',
    icon: () => h(SettingOutlined),
  }
])
const router = useRouter()
const route = useRoute()

const currentTopLevelKey = computed(() => {
  if (route.path.startsWith('/setting')) {
    return 'setting'
  }
  if (route.path.startsWith('/help')) {
    return 'help'
  }
  return 'home'
})

// 添加菜单项点击处理函数
const handleMenuSelect: MenuProps['onClick'] = e => {
  activeKey.value = [e.key + ""];
  router.push("/" + e.key + "")
};

watch(currentTopLevelKey, (value) => {
  activeKey.value = [value]
}, {
  immediate: true
})

</script>

<template>
  <a-menu style="flex: 1"
          v-model:selected-keys="activeKey"
          mode="horizontal"
          :items="menuOptions"
          @click="handleMenuSelect"
  />
</template>

<style scoped>

</style>
