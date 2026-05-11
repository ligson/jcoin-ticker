<script setup lang="ts">
import {onMounted, onUnmounted} from "vue";
import Menu from "./Menu.vue";
import FloatingTickerWindow from "./components/floating/FloatingTickerWindow.vue";

const isFloatingWindow = new URLSearchParams(window.location.search).get('window') === 'floating'

onMounted(() => {
  if (!isFloatingWindow) {
    return
  }

  document.documentElement.classList.add('is-floating-window')
  document.body.classList.add('is-floating-window')
  document.documentElement.style.background = 'transparent'
  document.body.style.background = 'transparent'
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  if (!isFloatingWindow) {
    return
  }

  document.documentElement.classList.remove('is-floating-window')
  document.body.classList.remove('is-floating-window')
  document.documentElement.style.background = ''
  document.body.style.background = ''
  document.body.style.overflow = ''
})
</script>

<template>
  <FloatingTickerWindow v-if="isFloatingWindow" />

  <a-layout v-else class="app-shell">
    <a-layout-header class="app-shell__header">
      <Menu class="app-shell__menu" />
    </a-layout-header>
    <a-layout-content class="app-shell__content">
      <router-view/>
    </a-layout-content>
  </a-layout>
</template>

<style scoped>
.app-shell {
  flex: 1;
  min-height: 100vh;
  background:
      radial-gradient(circle at top left, rgba(251, 146, 60, 0.08), transparent 22%),
      linear-gradient(180deg, #f8fafc 0%, #f3f6fb 100%);
}

.app-shell__header {
  height: 74px;
  display: flex;
  align-items: center;
  padding: 0 18px;
  background: rgba(255, 255, 255, 0.82);
  border-bottom: 1px solid rgba(226, 232, 240, 0.92);
  backdrop-filter: blur(18px);
}

.app-shell__menu {
  flex: 1;
}

.app-shell__content {
  flex: 1;
  background: transparent;
}
</style>
