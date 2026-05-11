<script setup lang="ts">
import {getCurrentInstance, onBeforeUnmount, onMounted, ref, watch} from "vue";
import {AppConfig, defaultFloatingWindowConfig, FloatingWindowConfig, normalizeAppConfig} from "../../../config/config.ts";

const instance = getCurrentInstance();
const $message = instance?.appContext.config.globalProperties.$message;
const $store = instance?.appContext.config.globalProperties.$store;

const appConfig = ref<AppConfig>(normalizeAppConfig(null))
const saving = ref(false)
const loaded = ref(false)
const statusText = ref('修改后立即生效，无需手动保存。')
const floatingWindowConfig = ref<FloatingWindowConfig>({...defaultFloatingWindowConfig})
let saveTimer: ReturnType<typeof setTimeout> | null = null

const loadSettings = async () => {
  try {
    const value = await $store.get("appConfig") as AppConfig | null
    appConfig.value = normalizeAppConfig(value)
    floatingWindowConfig.value = {...appConfig.value.floatingWindow}
    loaded.value = true
  } catch (e: any) {
    $message.error(e.message)
  }
}

const persistSettings = async () => {
  saving.value = true
  statusText.value = '正在自动同步悬浮窗设置...'
  try {
    const plainConfig = {
      enabled: floatingWindowConfig.value.enabled,
      opacity: floatingWindowConfig.value.opacity
    }
    appConfig.value.floatingWindow = plainConfig
    await $store.set("appConfig", JSON.parse(JSON.stringify(appConfig.value)))
    await window.ipcRenderer.invoke('floating-window-sync', plainConfig)
    statusText.value = plainConfig.enabled
        ? `悬浮窗已显示，透明度 ${plainConfig.opacity}%。`
        : '悬浮窗已隐藏。'
  } catch (e: any) {
    statusText.value = '自动同步失败，请重试。'
    $message.error(e?.message ?? '保存悬浮窗设置失败')
  } finally {
    saving.value = false
  }
}

const schedulePersistSettings = () => {
  if (!loaded.value) {
    return
  }

  if (saveTimer) {
    clearTimeout(saveTimer)
  }

  saveTimer = setTimeout(() => {
    saveTimer = null
    void persistSettings()
  }, 180)
}

watch(floatingWindowConfig, () => {
  schedulePersistSettings()
}, {
  deep: true
})

onMounted(() => {
  void loadSettings()
})

onBeforeUnmount(() => {
  if (!saveTimer) {
    return
  }

  clearTimeout(saveTimer)
  saveTimer = null
  void persistSettings()
})
</script>

<template>
  <a-card title="悬浮窗设置" :bordered="false">
    <a-form layout="vertical">
      <a-form-item label="显示悬浮窗">
        <a-switch v-model:checked="floatingWindowConfig.enabled"/>
      </a-form-item>

      <a-form-item label="面板透明度">
        <a-slider
            v-model:value="floatingWindowConfig.opacity"
            :min="45"
            :max="100"
            :disabled="!floatingWindowConfig.enabled"
        />
        <a-typography-paragraph type="secondary" style="margin-bottom: 0">
          当前透明度：{{ floatingWindowConfig.opacity }}%。数值越低越通透，越高越清晰。
        </a-typography-paragraph>
      </a-form-item>

      <a-typography-paragraph type="secondary">
        悬浮窗会固定显示市场情绪指数和当前关注币种列表，并自动根据列表长度调整窗口高度，尽量在一个小窗里完整展示，不出现滚动条。
        关闭主窗口时，悬浮窗也会一起退出；下次启动应用时，如果这里保持启用，会自动再次显示。这里的修改会立即生效，并自动写入本地配置。
      </a-typography-paragraph>

      <a-typography-paragraph :type="saving ? 'warning' : 'secondary'" style="margin-bottom: 0">
        {{ statusText }}
      </a-typography-paragraph>
    </a-form>
  </a-card>
</template>

<style scoped>

</style>
