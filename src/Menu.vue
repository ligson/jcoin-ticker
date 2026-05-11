<script setup lang="ts">
import {computed} from "vue";
import {useRoute, useRouter} from "vue-router";
import {DollarCircleOutlined, SettingOutlined} from '@ant-design/icons-vue';

const navItems = [
  {
    label: '主页',
    key: 'home',
    icon: DollarCircleOutlined,
  },
  {
    label: '设置',
    key: 'setting',
    icon: SettingOutlined,
  }
]
const router = useRouter()
const route = useRoute()

const currentTopLevelKey = computed(() => {
  if (route.path.startsWith('/setting')) {
    return 'setting'
  }
  return 'home'
})

const navigateTo = (key: string) => {
  if (currentTopLevelKey.value === key) {
    return
  }
  void router.push(`/${key}`)
}

</script>

<template>
  <div class="top-nav">
    <div class="top-nav__brand">
      <span class="top-nav__brand-mark">JC</span>
      <div class="top-nav__brand-copy">
        <strong>jcoin-ticker</strong>
        <span>桌面盯盘台</span>
      </div>
    </div>

    <div class="top-nav__tabs">
      <button
          v-for="item in navItems"
          :key="item.key"
          type="button"
          class="top-nav__tab"
          :class="currentTopLevelKey === item.key ? 'top-nav__tab--active' : ''"
          @click="navigateTo(item.key)"
      >
        <component :is="item.icon" />
        <span>{{ item.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.top-nav {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.top-nav__brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.top-nav__brand-mark {
  width: 34px;
  height: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: linear-gradient(135deg, #f97316, #fb7185);
  color: #ffffff;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  box-shadow: 0 10px 24px rgba(249, 115, 22, 0.22);
}

.top-nav__brand-copy strong {
  display: block;
  color: #111827;
  font-size: 14px;
  line-height: 1.1;
}

.top-nav__brand-copy span {
  display: block;
  margin-top: 2px;
  color: #6b7280;
  font-size: 11px;
  line-height: 1.1;
}

.top-nav__tabs {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px;
  border-radius: 16px;
  background: #f3f6fb;
  border: 1px solid #e7ebf3;
}

.top-nav__tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
}

.top-nav__tab:hover {
  background: rgba(255, 255, 255, 0.78);
  color: #0f172a;
  transform: translateY(-1px);
}

.top-nav__tab--active {
  background: #ffffff;
  color: #111827;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
}
</style>
