<script setup lang="ts">
import {computed, getCurrentInstance, onMounted, ref} from "vue";
import {AppConfig, normalizeAppConfig} from "../../../config/config.ts";
import {fetchSpotSymbolOptions, marketDataSourceLabelMap, TickerSymbolOption} from "../../../home/spotMarketDataSources.ts";
import {applySpotTickerRuntimeConfig} from "../../../home/spotTickerRuntime.ts";

interface TickerSymbolCache {
  updatedAt: number;
  options: TickerSymbolOption[];
}

const TICKER_SYMBOL_CACHE_TTL_MS = 12 * 60 * 60 * 1000

const tags = ref<string[]>([])
const keyword = ref('')
const selectedCoin = ref<string>()
const symbolOptions = ref<TickerSymbolOption[]>([])
const loadingSymbolOptions = ref(false)
const symbolCacheUpdatedAt = ref<number | null>(null)
const appConfig = ref<AppConfig>(normalizeAppConfig(null));
const instance = getCurrentInstance();
const $message = instance?.appContext.config.globalProperties.$message;
const $store = instance?.appContext.config.globalProperties.$store;

const getTickerSymbolCacheKey = () => `spotTickerSymbolCache:${appConfig.value.marketDataSource}`

const loadSettings = async () => {
  try {
    const value = await $store.get("appConfig") as AppConfig | null
    appConfig.value = normalizeAppConfig(value)
    tags.value = [...appConfig.value.coins]
  } catch (e: any) {
    $message.error(e.message)
  }
}

const filteredOptions = computed(() => {
  const upperKeyword = keyword.value.trim().toUpperCase()
  const selectedSet = new Set(tags.value)
  const candidates = symbolOptions.value.filter(item => !selectedSet.has(item.value))
  const matchedOptions = upperKeyword
      ? candidates.filter(item => item.value.includes(upperKeyword) || item.symbol.includes(upperKeyword))
      : candidates

  return matchedOptions.slice(0, 50).map(item => ({
    label: item.label,
    value: item.value
  }))
})

const formattedUpdatedAt = computed(() => {
  if (!symbolCacheUpdatedAt.value) {
    return '暂无'
  }
  return new Date(symbolCacheUpdatedAt.value).toLocaleString()
})

const currentSourceLabel = computed(() => marketDataSourceLabelMap[appConfig.value.marketDataSource])

const getStoredTickerSymbolCache = async () => {
  const value = await $store.get(getTickerSymbolCacheKey())
  if (!value || typeof value.updatedAt !== 'number' || !Array.isArray(value.options)) {
    return null
  }

  return value as TickerSymbolCache
}

const isTickerSymbolCacheFresh = (cache: TickerSymbolCache) => {
  return Date.now() - cache.updatedAt < TICKER_SYMBOL_CACHE_TTL_MS
}

const saveCoins = async () => {
  appConfig.value.coins = [...tags.value]
  await $store.set("appConfig", JSON.parse(JSON.stringify(appConfig.value)))
  await applySpotTickerRuntimeConfig(appConfig.value)
}

const handleSearch = (value: string) => {
  keyword.value = value
}

const loadSymbolOptions = async (forceRefresh = false) => {
  loadingSymbolOptions.value = true
  try {
    const storedCache = await getStoredTickerSymbolCache()

    if (!forceRefresh && storedCache) {
      symbolOptions.value = Array.isArray(storedCache.options) ? storedCache.options : []
      symbolCacheUpdatedAt.value = storedCache.updatedAt
      return
    }

    const options = await fetchSpotSymbolOptions(appConfig.value.marketDataSource)
    const cache: TickerSymbolCache = {
      updatedAt: Date.now(),
      options
    }
    await $store.set(getTickerSymbolCacheKey(), JSON.parse(JSON.stringify(cache)))
    symbolOptions.value = options
    symbolCacheUpdatedAt.value = cache.updatedAt
  } catch (e: any) {
    const storedCache = await getStoredTickerSymbolCache()
    if (storedCache) {
      symbolOptions.value = Array.isArray(storedCache.options) ? storedCache.options : []
      symbolCacheUpdatedAt.value = storedCache.updatedAt
      $message.warning(e?.message ?? '刷新币种列表失败，已回退到本地缓存')
      return
    }
    $message.error(e?.message ?? '加载币种列表失败')
  } finally {
    loadingSymbolOptions.value = false
  }
}

const handleClose = async (removedTag: string) => {
  const tags2 = tags.value.filter(tag => tag !== removedTag);
  tags.value = tags2;
  try {
    await saveCoins()
    $message.success(`${removedTag} 已移除`)
  } catch (e: any) {
    $message.error(e?.message ?? '保存监控币种失败')
  }
};

const handleSelect = async (coin: string) => {
  if (tags.value.includes(coin)) {
    selectedCoin.value = undefined
    return
  }

  tags.value = [...tags.value, coin]
  try {
    await saveCoins()
    keyword.value = ''
    selectedCoin.value = undefined
    $message.success(`${coin} 已添加`)
  } catch (e: any) {
    $message.error(e?.message ?? '保存监控币种失败')
  }
};

onMounted(async () => {
  await loadSettings()
  await loadSymbolOptions()
})
</script>

<template>
  <a-space direction="vertical" style="width: 100%">
    <div>
      <template v-for="tag in tags" :key="tag">
        <a-tag :closable="true" style="margin-bottom: 8px" @close="handleClose(tag)">
          {{ tag }}
        </a-tag>
      </template>
    </div>

    <a-space wrap>
      <a-select
          v-model:value="selectedCoin"
          show-search
          allow-clear
          :filter-option="false"
          :loading="loadingSymbolOptions"
          :options="filteredOptions"
          :not-found-content="loadingSymbolOptions ? '币种列表加载中...' : '没有匹配的币种'"
          placeholder="搜索并选择币种，例如 BTC"
          style="width: 280px"
          @search="handleSearch"
          @select="handleSelect"
      />
      <a-button :loading="loadingSymbolOptions" @click="loadSymbolOptions(true)">
        刷新币种列表
      </a-button>
    </a-space>

    <a-typography-paragraph type="secondary" style="margin-bottom: 0">
      当前数据源：{{ currentSourceLabel }}。页面默认优先读取本地缓存，只有本地没有缓存或你手动点击“刷新币种列表”时才会重新请求。币种列表仅保留 `USDT` 现货交易对，确保和首页实时价格数据源保持一致，当前最多展示 50 条匹配结果。上次更新时间：{{ formattedUpdatedAt }}
    </a-typography-paragraph>
  </a-space>
</template>

<style scoped>

</style>
