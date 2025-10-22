<script setup lang="ts">
import Menu from "./Menu.vue";
</script>

<template>
  <a-layout style="flex: 1">
    <a-layout-header style="display: flex;height: 50px;flex-direction: row;background: #FFFFFF">
      <Menu style="flex: 1"/>
    </a-layout-header>
    <a-layout-content style="flex: 1;background: #FFFFFF">
      <router-view/>
    </a-layout-content>
    <a-layout-footer style="display: flex;height: 50px;align-items: center;justify-content: center;"><span></span></a-layout-footer>
  </a-layout>
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}

.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}

.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
