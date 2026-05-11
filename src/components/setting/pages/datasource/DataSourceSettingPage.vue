<script setup lang="ts">
import {computed, getCurrentInstance, onMounted, ref} from "vue";
import {AppConfig, MarketDataSource, normalizeAppConfig} from "../../../config/config.ts";
import {marketDataSourceLabelMap, marketDataSourceOptions} from "../../../home/spotMarketDataSources.ts";
import {applySpotTickerRuntimeConfig} from "../../../home/spotTickerRuntime.ts";

const instance = getCurrentInstance();
const $message = instance?.appContext.config.globalProperties.$message;
const $store = instance?.appContext.config.globalProperties.$store;

const appConfig = ref<AppConfig>(normalizeAppConfig(null))
const selectedSource = ref<MarketDataSource>('binance_spot')
const saving = ref(false)

const currentSourceLabel = computed(() => marketDataSourceLabelMap[selectedSource.value])

const loadSettings = () => {
  $store.get("appConfig").then((value: AppConfig | null) => {
    appConfig.value = normalizeAppConfig(value)
    selectedSource.value = appConfig.value.marketDataSource
  }).catch((e: Error) => {
    $message.error(e.message)
  })
}

const saveSettings = async () => {
  saving.value = true
  try {
    appConfig.value.marketDataSource = selectedSource.value
    await $store.set("appConfig", JSON.parse(JSON.stringify(appConfig.value)))
    await applySpotTickerRuntimeConfig(appConfig.value)
    $message.success(`数据源已切换为 ${currentSourceLabel.value}`)
  } catch (e: any) {
    $message.error(e?.message ?? '保存数据源设置失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <a-card title="数据源设置" :bordered="false">
    <a-form layout="vertical">
      <a-form-item label="现货数据源">
        <a-select
            v-model:value="selectedSource"
            :options="marketDataSourceOptions"
            placeholder="请选择数据源"
        />
      </a-form-item>

      <a-typography-paragraph type="secondary">
        当前支持的都是免 API Key 的公开现货数据源，包含 Binance、OKX、Kraken、Coinbase、Bybit、Bitget 和 KuCoin。
        切换后，首页实时价格和监控币种下拉会一起切换到同一个数据源，避免币种列表和行情来源不一致。
      </a-typography-paragraph>

      <a-button type="primary" :loading="saving" @click="saveSettings">
        保存数据源设置
      </a-button>
    </a-form>
  </a-card>
</template>

<style scoped>

</style>
