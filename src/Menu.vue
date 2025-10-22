<script setup lang="ts">

import {h, onMounted, ref} from "vue";
import {useRouter} from "vue-router";
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
// 添加菜单项点击处理函数
const handleMenuSelect: MenuProps['onClick'] = e => {
  console.log('点击的菜单项 key:', e.key);
  activeKey.value = [e.key + ""];
  router.push("/" + e.key + "")
};


onMounted(() => {
  // 页面加载时初始化路由
  if (activeKey.value) {
    router.push('/' + activeKey.value[0]);
  }
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
