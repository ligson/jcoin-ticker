<script setup lang="ts">
import {computed, h, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {ApiOutlined, DashboardOutlined, DollarCircleOutlined, GlobalOutlined, InfoCircleOutlined} from "@ant-design/icons-vue";
import {MenuProps} from "ant-design-vue";

const activeKey = ref<string[]>(["ticker-coin"]);


const menuOptions = ref<MenuProps['items']>([
  {
    label: '监控币种',
    key: 'ticker-coin',
    icon: h(DollarCircleOutlined),
  },
  {
    label: '代理设置',
    key: 'proxy',
    icon: h(GlobalOutlined),
  },
  {
    label: '数据源',
    key: 'data-source',
    icon: h(ApiOutlined),
  },
  {
    label: '悬浮窗',
    key: 'floating-window',
    icon: h(DashboardOutlined),
  },
  {
    label: '关于',
    key: 'about',
    icon: h(InfoCircleOutlined),
  }
])
const router = useRouter()
const route = useRoute()

const currentSettingKey = computed(() => {
  const routeName = String(route.name ?? '')
  return ['ticker-coin', 'proxy', 'data-source', 'floating-window', 'about'].includes(routeName)
      ? routeName
      : 'ticker-coin'
})

const handleMenuSelect: MenuProps['onClick'] = (e) => {
  activeKey.value = [e.key + ""];
  router.push(`/setting/${e.key}`)
};

watch(currentSettingKey, (value) => {
  activeKey.value = [value]
}, {
  immediate: true
})
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
