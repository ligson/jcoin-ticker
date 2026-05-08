<script setup lang="ts">
import {getCurrentInstance, onMounted, ref} from "vue";
import {AppConfig, defaultProxyConfig, normalizeAppConfig, ProxyConfig} from "../../../config/config.ts";
import {reconnectSpotTickerRuntime} from "../../../home/spotTickerRuntime.ts";

const instance = getCurrentInstance();
const $message = instance?.appContext.config.globalProperties.$message;
const $store = instance?.appContext.config.globalProperties.$store;

const appConfig = ref<AppConfig>(normalizeAppConfig(null))
const saving = ref(false)
const proxyConfig = ref<ProxyConfig>({...defaultProxyConfig})

const loadSettings = () => {
  $store.get("appConfig").then((value: AppConfig | null) => {
    appConfig.value = normalizeAppConfig(value)
    proxyConfig.value = {...appConfig.value.proxy}
  }).catch((e: Error) => {
    $message.error(e.message)
  })
}

const saveProxySettings = async () => {
  if (proxyConfig.value.enabled && !proxyConfig.value.server.trim()) {
    $message.error('启用代理时必须填写代理地址')
    return
  }

  saving.value = true
  try {
    const plainProxyConfig = {
      enabled: proxyConfig.value.enabled,
      server: proxyConfig.value.server.trim(),
      bypassRules: proxyConfig.value.bypassRules.trim(),
      ignoreCertificateErrors: proxyConfig.value.ignoreCertificateErrors
    }
    appConfig.value.proxy = plainProxyConfig
    await $store.set("appConfig", JSON.parse(JSON.stringify(appConfig.value)))
    await window.ipcRenderer.invoke('proxy-apply', plainProxyConfig)
    await reconnectSpotTickerRuntime()
    $message.success('代理设置已保存，并已应用到后续请求')
  } catch (e: any) {
    $message.error(e?.message ?? '保存代理设置失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <a-card title="代理设置" :bordered="false">
    <a-form layout="vertical">
      <a-form-item label="启用代理">
        <a-switch v-model:checked="proxyConfig.enabled"/>
      </a-form-item>

      <a-form-item label="代理地址">
        <a-input
            v-model:value="proxyConfig.server"
            :disabled="!proxyConfig.enabled"
            placeholder="示例：http://127.0.0.1:7890 或 socks5://127.0.0.1:1080"
        />
      </a-form-item>

      <a-form-item label="绕过规则">
        <a-input
            v-model:value="proxyConfig.bypassRules"
            :disabled="!proxyConfig.enabled"
            placeholder="可选，示例：<local>;127.0.0.1;localhost"
        />
      </a-form-item>

      <a-form-item label="忽略数据源证书错误">
        <a-switch v-model:checked="proxyConfig.ignoreCertificateErrors"/>
      </a-form-item>

      <a-typography-paragraph type="secondary">
        保存后会立即应用到后续请求。已经建立的旧连接不会强制迁移，返回首页后会按新代理重新建立连接。
        只有当代理会替换 HTTPS 证书，导致 Binance、OKX、Kraken、Coinbase 这类公开数据源请求出现证书错误时，才建议开启这个开关。
      </a-typography-paragraph>

      <a-button type="primary" :loading="saving" @click="saveProxySettings">
        保存代理设置
      </a-button>
    </a-form>
  </a-card>
</template>

<style scoped>

</style>
