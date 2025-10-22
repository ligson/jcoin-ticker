<script setup lang="ts">
import {h, ref} from "vue";
import {useRouter} from "vue-router";
import {DollarCircleOutlined} from "@ant-design/icons-vue";
import {MenuProps} from "ant-design-vue";

const activeKey = ref<string[]>(["ticker-coin"]);


const menuOptions = ref<MenuProps['items']>([
  {
    label: '监控币种',
    key: 'ticker-coin',
    icon: h(DollarCircleOutlined),
  },
  {
    label: '关于',
    key: 'about',
    icon: h(DollarCircleOutlined),
  }
])
const router = useRouter()
const handleMenuSelect: MenuProps['onClick'] = (e) => {
  console.log('点击的菜单项 key:', e.key);
  activeKey.value = [e.key + ""];
  router.push(`/setting/${e.key}`)
};
</script>

<template>
  <div style="flex: 1;width: 100%;height: 100%;display: flex;flex-direction: row;">
    <div style="width: 300px;">
      <a-menu v-model:selected-keys="activeKey"
              mode="vertical"
              :items="menuOptions"
              @click="handleMenuSelect" style="border-right: 1px solid #EFEFF4">
      </a-menu>
    </div>
    <div style="display: flex;flex: 1">
      <div style="padding: 10px;flex: 1;">
        <router-view></router-view>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
