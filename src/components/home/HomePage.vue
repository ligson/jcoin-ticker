<script setup lang="ts">
import {computed, getCurrentInstance, onMounted, ref, watch} from "vue";
import {useRouter} from "vue-router";
import {AppstoreOutlined, HolderOutlined, LineChartOutlined} from "@ant-design/icons-vue";
import HomeMarketOverviewBar from "./HomeMarketOverviewBar.vue";
import MarketSentimentPanel from "./MarketSentimentPanel.vue";
import store from "../../config/store.ts";
import type {MarketDataSource} from "../config/config.ts";
import {normalizeAppConfig} from "../config/config.ts";
import {fetchSpotCandles} from "./spotMarketDataSources.ts";
import {
  applySpotTickerRuntimeConfig,
  ensureSpotTickerRuntime,
  runtimeCoinPrices,
  runtimeCoins,
  runtimeMarketDataSource
} from "./spotTickerRuntime.ts";

const coinPrices = runtimeCoinPrices
const router = useRouter()
const instance = getCurrentInstance();
const $message = instance?.appContext.config.globalProperties.$message;
const draggingCoin = ref('')
const dragOverCoin = ref('')
const dragInsertMode = ref<'before' | 'after'>('before')
const suppressClick = ref(false)
const sparklineSeriesMap = ref<Record<string, number[]>>({})
const sparklineLoadingMap = ref<Record<string, boolean>>({})
const sparklineSource = ref<MarketDataSource | null>(null)
const activeHomeView = ref<'watch' | 'sentiment'>('watch')
const homeInitializing = ref(true)
const homeInitError = ref('')
let sparklineRequestToken = 0

const HOME_SPARKLINE_POINT_COUNT = 24
const HOME_SPARKLINE_WIDTH = 208
const HOME_SPARKLINE_HEIGHT = 68
const HOME_SPARKLINE_PADDING = 6
const marketDataSourceLabels: Record<MarketDataSource, string> = {
  binance_spot: 'Binance 现货',
  okx_spot: 'OKX 现货',
  kraken_spot: 'Kraken 现货',
  coinbase_spot: 'Coinbase 现货',
  bybit_spot: 'Bybit 现货',
  bitget_spot: 'Bitget 现货',
  kucoin_spot: 'KuCoin 现货'
}

interface SparklineShape {
  linePath: string;
  areaPath: string;
  lastPoint: {
    x: number;
    y: number;
  };
}

interface SparklineSummary {
  startPrice: number;
  endPrice: number;
  isUp: boolean;
}

// 定义颜色数组
const avatarColors = ref([
  '#f56a00', '#7265e6', '#ffbf00', '#00a2ae',
  '#00a854', '#f44336', '#9c27b0', '#3f51b5',
  '#2196f3', '#00bcd4', '#4caf50', '#ff9800'
]);

// 根据币种名称获取固定颜色的函数
const getAvatarColor = (coin: string) => {
  // 使用币种名称的哈希值来确定颜色索引
  let hash = 0;
  for (let i = 0; i < coin.length; i++) {
    hash = coin.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarColors.value.length;
  return avatarColors.value[index];
};

const getTrendClass = (priceChangePercentage: string) => {
  return Number(priceChangePercentage) >= 0
      ? 'ticker-list-item--up'
      : 'ticker-list-item--down'
}

const isPriceUp = (priceChangePercentage: string) => {
  return Number(priceChangePercentage) >= 0
}

const formatPrice = (value: string | number) => {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    return '--'
  }
  if (numberValue >= 1000) {
    return numberValue.toFixed(2)
  }
  if (numberValue >= 1) {
    return numberValue.toFixed(4)
  }
  if (numberValue >= 0.01) {
    return numberValue.toFixed(6)
  }
  return numberValue.toFixed(8)
}

const formatSignedPercent = (value: string | number) => {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) {
    return '--'
  }
  return `${numberValue > 0 ? '+' : ''}${numberValue.toFixed(2)}%`
}

const formatCompactNumber = (value: string | number) => {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue) || numberValue < 0) {
    return '--'
  }
  if (numberValue >= 100000000) {
    return `${(numberValue / 100000000).toFixed(2)}亿`
  }
  if (numberValue >= 10000) {
    return `${(numberValue / 10000).toFixed(2)}万`
  }
  if (numberValue >= 1000) {
    return `${(numberValue / 1000).toFixed(2)}K`
  }
  return numberValue.toFixed(2)
}

const pruneSparklineState = (coins: string[]) => {
  const coinSet = new Set(coins)
  sparklineSeriesMap.value = Object.fromEntries(
      Object.entries(sparklineSeriesMap.value).filter(([coin]) => coinSet.has(coin))
  )
  sparklineLoadingMap.value = Object.fromEntries(
      Object.entries(sparklineLoadingMap.value).filter(([coin]) => coinSet.has(coin))
  )
}

const loadSparklineSeries = async (coins: string[], source: MarketDataSource) => {
  if (sparklineSource.value !== source) {
    sparklineSeriesMap.value = {}
    sparklineLoadingMap.value = {}
    sparklineSource.value = source
  }

  pruneSparklineState(coins)

  const missingCoins = coins.filter((coin) => !sparklineSeriesMap.value[coin]?.length)
  if (missingCoins.length === 0) {
    return
  }

  const requestToken = ++sparklineRequestToken
  sparklineLoadingMap.value = {
    ...sparklineLoadingMap.value,
    ...Object.fromEntries(missingCoins.map((coin) => [coin, true]))
  }

  for (const coin of missingCoins) {
    try {
      const candles = await fetchSpotCandles(source, coin, '1h')
      if (requestToken !== sparklineRequestToken) {
        return
      }

      sparklineSeriesMap.value = {
        ...sparklineSeriesMap.value,
        [coin]: candles
            .map((item) => item.close)
            .filter((value) => Number.isFinite(value) && value > 0)
            .slice(-HOME_SPARKLINE_POINT_COUNT)
      }
    } catch {
      if (requestToken !== sparklineRequestToken) {
        return
      }

      sparklineSeriesMap.value = {
        ...sparklineSeriesMap.value,
        [coin]: []
      }
    } finally {
      if (requestToken !== sparklineRequestToken) {
        return
      }

      sparklineLoadingMap.value = {
        ...sparklineLoadingMap.value,
        [coin]: false
      }
    }
  }
}

const getSparklineValues = (coin: string, currentPrice: string | number) => {
  const history = sparklineSeriesMap.value[coin] ?? []
  if (history.length === 0) {
    return []
  }

  const realtimePrice = Number(currentPrice)
  if (!Number.isFinite(realtimePrice) || realtimePrice <= 0) {
    return history
  }

  if (history.length === 1) {
    return [history[0], realtimePrice]
  }

  return [...history.slice(0, -1), realtimePrice]
}

const buildSparklineShape = (values: number[]): SparklineShape | null => {
  const normalizedValues = values.filter((value) => Number.isFinite(value) && value > 0)
  if (normalizedValues.length === 0) {
    return null
  }

  const minValue = Math.min(...normalizedValues)
  const maxValue = Math.max(...normalizedValues)
  const spread = maxValue - minValue || Math.max(maxValue * 0.04, 1)
  const paddedMin = Math.max(0, minValue - spread * 0.18)
  const paddedMax = maxValue + spread * 0.18
  const chartWidth = HOME_SPARKLINE_WIDTH - (HOME_SPARKLINE_PADDING * 2)
  const chartHeight = HOME_SPARKLINE_HEIGHT - (HOME_SPARKLINE_PADDING * 2)
  const step = chartWidth / Math.max(normalizedValues.length - 1, 1)

  const points = normalizedValues.map((value, index) => {
    const ratio = paddedMax <= paddedMin ? 0.5 : (value - paddedMin) / (paddedMax - paddedMin)
    return {
      x: HOME_SPARKLINE_PADDING + (step * index),
      y: HOME_SPARKLINE_PADDING + chartHeight - (ratio * chartHeight)
    }
  })

  const linePath = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ')

  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]
  const areaPath = `${linePath} L ${lastPoint.x} ${HOME_SPARKLINE_HEIGHT - HOME_SPARKLINE_PADDING} L ${firstPoint.x} ${HOME_SPARKLINE_HEIGHT - HOME_SPARKLINE_PADDING} Z`

  return {
    linePath,
    areaPath,
    lastPoint
  }
}

const isSparklineLoading = (coin: string) => {
  return Boolean(sparklineLoadingMap.value[coin])
}

const sparklineSummaryMap = computed<Record<string, SparklineSummary | null>>(() => {
  return Object.fromEntries(
      coinPrices.value.map((item) => {
        const values = getSparklineValues(item.coin, item.price)
        if (values.length < 2) {
          return [item.coin, null]
        }

        const startPrice = values[0]
        const endPrice = values[values.length - 1]
        return [item.coin, {
          startPrice,
          endPrice,
          isUp: endPrice >= startPrice
        }]
      })
  ) as Record<string, SparklineSummary | null>
})

const monitoredSummary = computed(() => {
  const changes = coinPrices.value
      .map((item) => Number(item.priceChangePercentage))
      .filter((value) => Number.isFinite(value))
  const upCount = changes.filter((value) => value > 0).length
  const downCount = changes.filter((value) => value < 0).length
  const averageChange = changes.length > 0
      ? changes.reduce((sum, value) => sum + value, 0) / changes.length
      : 0

  return {
    total: coinPrices.value.length,
    upCount,
    downCount,
    averageChange
  }
})

const currentSourceLabel = computed(() => {
  return marketDataSourceLabels[runtimeMarketDataSource.value] ?? '公开现货'
})

const openCoinDetail = (coin: string) => {
  void router.push({
    name: 'coin-detail',
    params: {
      coin
    }
  })
}

const buildReorderedCoins = (sourceCoin: string, targetCoin: string, insertMode: 'before' | 'after') => {
  const currentCoins = coinPrices.value.map((item) => item.coin)
  const sourceIndex = currentCoins.indexOf(sourceCoin)
  const targetIndex = currentCoins.indexOf(targetCoin)
  if (sourceIndex < 0 || targetIndex < 0 || sourceCoin === targetCoin) {
    return currentCoins
  }

  const nextCoins = [...currentCoins]
  nextCoins.splice(sourceIndex, 1)
  const adjustedTargetIndex = sourceIndex < targetIndex ? targetIndex - 1 : targetIndex
  const insertIndex = insertMode === 'after' ? adjustedTargetIndex + 1 : adjustedTargetIndex
  nextCoins.splice(insertIndex, 0, sourceCoin)
  return nextCoins
}

const persistCoinOrder = async (coins: string[]) => {
  const value = await store.get("appConfig")
  const appConfig = normalizeAppConfig(value)
  appConfig.coins = [...coins]
  await store.set("appConfig", JSON.parse(JSON.stringify(appConfig)))
  await applySpotTickerRuntimeConfig(appConfig)
}

const handleCoinClick = (coin: string) => {
  if (draggingCoin.value || suppressClick.value) {
    return
  }
  openCoinDetail(coin)
}

const handleDragStart = (event: DragEvent, coin: string) => {
  draggingCoin.value = coin
  suppressClick.value = true
  event.dataTransfer?.setData('text/plain', coin)
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
  }
}

const handleDragOver = (event: DragEvent, coin: string) => {
  event.preventDefault()
  if (!draggingCoin.value || draggingCoin.value === coin) {
    return
  }

  const currentTarget = event.currentTarget as HTMLElement | null
  const rect = currentTarget?.getBoundingClientRect()
  const midpoint = rect ? rect.top + (rect.height / 2) : 0
  dragOverCoin.value = coin
  dragInsertMode.value = (event.clientY > midpoint) ? 'after' : 'before'
}

const clearDragState = () => {
  draggingCoin.value = ''
  dragOverCoin.value = ''
  dragInsertMode.value = 'before'
  window.setTimeout(() => {
    suppressClick.value = false
  }, 0)
}

const handleDrop = async (event: DragEvent, coin: string) => {
  event.preventDefault()
  const sourceCoin = event.dataTransfer?.getData('text/plain') || draggingCoin.value
  if (!sourceCoin || sourceCoin === coin) {
    clearDragState()
    return
  }

  const nextCoins = buildReorderedCoins(sourceCoin, coin, dragInsertMode.value)
  const currentCoins = coinPrices.value.map((item) => item.coin)
  clearDragState()

  if (nextCoins.join(',') === currentCoins.join(',')) {
    return
  }

  try {
    await persistCoinOrder(nextCoins)
  } catch (error: any) {
    $message?.error(error?.message ?? '保存币种顺序失败')
  }
}

const handleDragEnd = () => {
  clearDragState()
}

const sparklineSignature = computed(() => {
  return `${runtimeMarketDataSource.value}::${runtimeCoins.value.join(',')}`
})

const sparklineShapeMap = computed<Record<string, SparklineShape | null>>(() => {
  return Object.fromEntries(
      coinPrices.value.map((item) => [item.coin, buildSparklineShape(getSparklineValues(item.coin, item.price))])
  ) as Record<string, SparklineShape | null>
})

const initializeHomeRuntime = async () => {
  homeInitializing.value = true
  homeInitError.value = ''

  try {
    await ensureSpotTickerRuntime()
  } catch (error: any) {
    homeInitError.value = error instanceof Error ? error.message : String(error)
  } finally {
    homeInitializing.value = false
  }
}

watch(sparklineSignature, async () => {
  await loadSparklineSeries(runtimeCoins.value, runtimeMarketDataSource.value)
}, {
  immediate: true
})

onMounted(() => {
  void initializeHomeRuntime()
})

</script>

<template>
  <div class="home-page">
    <div v-if="homeInitializing" class="home-page__boot">
      <a-spin />
      <span>正在加载本地盯盘配置...</span>
    </div>

    <a-result
        v-else-if="homeInitError"
        status="warning"
        title="首页初始化失败"
        :sub-title="homeInitError"
        class="home-page__error"
    >
      <template #extra>
        <a-button type="primary" @click="initializeHomeRuntime">
          重新加载
        </a-button>
      </template>
    </a-result>

    <section v-else class="home-terminal">
      <header class="home-terminal__topbar">
        <div class="home-terminal__title-block">
          <span class="home-terminal__eyebrow">实时现货终端</span>
          <h1>桌面盯盘台</h1>
        </div>

        <div class="home-terminal__status-strip">
          <div class="home-terminal__status-item">
            <span>数据源</span>
            <strong>{{ currentSourceLabel }}</strong>
          </div>
          <div class="home-terminal__status-item">
            <span>监控</span>
            <strong>{{ monitoredSummary.total }} 个</strong>
          </div>
          <div class="home-terminal__status-item home-terminal__status-item--up">
            <span>上涨</span>
            <strong>{{ monitoredSummary.upCount }}</strong>
          </div>
          <div class="home-terminal__status-item home-terminal__status-item--down">
            <span>下跌</span>
            <strong>{{ monitoredSummary.downCount }}</strong>
          </div>
          <div class="home-terminal__status-item">
            <span>均值</span>
            <strong>{{ formatSignedPercent(monitoredSummary.averageChange) }}</strong>
          </div>
        </div>

        <div class="home-terminal__view-switch">
          <button
              type="button"
              class="home-terminal__view-button"
              :class="activeHomeView === 'watch' ? 'home-terminal__view-button--active' : ''"
              @click="activeHomeView = 'watch'"
          >
            <AppstoreOutlined />
            <span>行情工作台</span>
          </button>
          <button
              type="button"
              class="home-terminal__view-button"
              :class="activeHomeView === 'sentiment' ? 'home-terminal__view-button--active' : ''"
              @click="activeHomeView = 'sentiment'"
          >
            <LineChartOutlined />
            <span>市场情绪</span>
          </button>
        </div>
      </header>

      <div v-if="activeHomeView === 'watch'" class="home-terminal__workspace">
        <aside class="home-terminal__watch-panel">
          <div class="home-terminal__panel-header">
            <div>
              <span>Watchlist</span>
              <strong>关注币种</strong>
            </div>
            <span class="home-terminal__live-dot">实时</span>
          </div>

          <a-list class="ticker-price-list" item-layout="horizontal" :data-source="coinPrices">
            <template #renderItem="{ item }">
              <a-list-item
                  :key="item.coin"
                  class="ticker-list-item"
                  :class="getTrendClass(item.priceChangePercentage)"
                  :draggable="true"
                  :data-drag-over="dragOverCoin === item.coin ? dragInsertMode : ''"
                  :data-dragging="draggingCoin === item.coin ? 'true' : 'false'"
                  @click="handleCoinClick(item.coin)"
                  @dragstart="handleDragStart($event, item.coin)"
                  @dragover="handleDragOver($event, item.coin)"
                  @drop="handleDrop($event, item.coin)"
                  @dragend="handleDragEnd"
              >
                <div class="ticker-list-item__card">
                  <div class="ticker-list-item__identity">
                    <a-avatar :style="{backgroundColor: getAvatarColor(item.coin)}" size="large">
                      {{ item.coin.slice(0, 3) }}
                    </a-avatar>

                    <div class="ticker-list-item__identity-text">
                      <div class="ticker-list-item__symbol-row">
                        <strong>{{ item.coin }}</strong>
                        <span>{{ item.coin }} / USDT</span>
                      </div>
                      <small>现货 · 24H</small>
                    </div>
                  </div>

                  <div class="ticker-list-item__price-block">
                    <span>最新价</span>
                    <strong>{{ formatPrice(item.price) }}</strong>
                  </div>

                  <div
                      class="ticker-list-item__sparkline-card"
                      :class="isPriceUp(item.priceChangePercentage) ? 'ticker-list-item__sparkline-card--up' : 'ticker-list-item__sparkline-card--down'"
                  >
                    <svg
                        v-if="sparklineShapeMap[item.coin]"
                        class="ticker-list-item__sparkline-svg"
                        :viewBox="`0 0 ${HOME_SPARKLINE_WIDTH} ${HOME_SPARKLINE_HEIGHT}`"
                        preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient :id="`sparkline-gradient-${item.coin}`" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stop-color="currentColor" stop-opacity="0.2" />
                          <stop offset="100%" stop-color="currentColor" stop-opacity="0.02" />
                        </linearGradient>
                      </defs>
                      <path
                          :d="sparklineShapeMap[item.coin]?.areaPath"
                          :fill="`url(#sparkline-gradient-${item.coin})`"
                      />
                      <path
                          :d="sparklineShapeMap[item.coin]?.linePath"
                          class="ticker-list-item__sparkline-line"
                      />
                      <circle
                          v-if="sparklineShapeMap[item.coin]?.lastPoint"
                          :cx="sparklineShapeMap[item.coin]?.lastPoint.x"
                          :cy="sparklineShapeMap[item.coin]?.lastPoint.y"
                          r="3.1"
                          class="ticker-list-item__sparkline-point"
                      />
                    </svg>

                    <span v-else class="ticker-list-item__sparkline-placeholder">
                      {{ isSparklineLoading(item.coin) ? '加载中' : '暂无走势' }}
                    </span>

                    <div
                        v-if="sparklineSummaryMap[item.coin]"
                        class="ticker-list-item__sparkline-tooltip"
                    >
                      <span>起点 {{ formatPrice(sparklineSummaryMap[item.coin]?.startPrice ?? 0) }}</span>
                      <strong>终点 {{ formatPrice(sparklineSummaryMap[item.coin]?.endPrice ?? 0) }}</strong>
                    </div>
                  </div>

                  <div
                      class="ticker-list-item__change-pill"
                      :class="isPriceUp(item.priceChangePercentage) ? 'ticker-list-item__change-pill--up' : 'ticker-list-item__change-pill--down'"
                  >
                    <span>24H</span>
                    <strong>{{ formatSignedPercent(item.priceChangePercentage) }}</strong>
                  </div>

                  <div class="ticker-list-item__stats-grid">
                    <div class="ticker-list-item__stat">
                      <span>高</span>
                      <strong>{{ formatPrice(item.high) }}</strong>
                    </div>
                    <div class="ticker-list-item__stat">
                      <span>低</span>
                      <strong>{{ formatPrice(item.low) }}</strong>
                    </div>
                    <div class="ticker-list-item__stat">
                      <span>量</span>
                      <strong>{{ formatCompactNumber(item.volume) }}</strong>
                    </div>
                    <div class="ticker-list-item__stat">
                      <span>额</span>
                      <strong>{{ formatCompactNumber(item.volumeInUSDT) }}</strong>
                    </div>
                  </div>

                  <span class="ticker-list-item__drag-hint" title="拖拽调整顺序">
                    <HolderOutlined />
                    <HolderOutlined />
                  </span>
                </div>
              </a-list-item>
            </template>
          </a-list>
        </aside>

        <section class="home-terminal__insight-panel">
          <HomeMarketOverviewBar class="home-market-overview--terminal" :coin-prices="coinPrices" />
        </section>
      </div>

      <section v-else class="home-terminal__sentiment-panel">
        <MarketSentimentPanel class="market-sentiment-panel--terminal" />
      </section>
    </section>
  </div>
</template>

<style scoped>
.home-page {
  height: calc(100vh - 74px);
  min-height: 0;
  padding: 14px;
  box-sizing: border-box;
  overflow: hidden;
  color: #0f172a;
}

.home-page__boot,
.home-page__error {
  height: 100%;
  min-height: 420px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  background:
      radial-gradient(circle at 12% 0%, rgba(14, 165, 233, 0.12), transparent 24%),
      linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.9));
}

.home-page__boot {
  flex-direction: column;
  gap: 14px;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
}

.home-terminal {
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  background:
      radial-gradient(circle at 12% 0%, rgba(14, 165, 233, 0.14), transparent 24%),
      radial-gradient(circle at 90% 10%, rgba(249, 115, 22, 0.1), transparent 22%),
      linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(241, 245, 249, 0.9));
  box-shadow: 0 26px 80px rgba(15, 23, 42, 0.1);
}

.home-terminal__topbar {
  min-height: 76px;
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr) max-content;
  align-items: center;
  gap: 14px;
  padding: 12px 14px;
  border: 1px solid rgba(226, 232, 240, 0.86);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(18px);
}

.home-terminal__eyebrow {
  color: #f97316;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.home-terminal__title-block h1 {
  margin: 4px 0 0;
  color: #0f172a;
  font-size: 24px;
  line-height: 1;
  letter-spacing: -0.04em;
}

.home-terminal__status-strip {
  display: grid;
  grid-template-columns: minmax(138px, 1.55fr) repeat(4, minmax(76px, 1fr));
  gap: 8px;
}

.home-terminal__status-item {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 5px;
  padding: 10px 11px;
  border-radius: 16px;
  background: rgba(248, 250, 252, 0.82);
  border: 1px solid rgba(226, 232, 240, 0.84);
}

.home-terminal__status-item span {
  color: #64748b;
  font-size: 11px;
}

.home-terminal__status-item strong {
  overflow: hidden;
  color: #0f172a;
  font-size: 15px;
  line-height: 1.1;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.home-terminal__status-item--up strong {
  color: #16a34a;
}

.home-terminal__status-item--down strong {
  color: #dc2626;
}

.home-terminal__view-switch {
  display: inline-flex;
  align-items: center;
  justify-self: end;
  gap: 6px;
  padding: 5px;
  border-radius: 16px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(241, 245, 249, 0.88);
}

.home-terminal__view-button {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 10px 14px;
  border: none;
  border-radius: 12px;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
}

.home-terminal__view-button--active {
  color: #0f172a;
  background: #ffffff;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.09);
}

.home-terminal__workspace {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(600px, 1.28fr) minmax(360px, 0.72fr);
  gap: 14px;
}

.home-terminal__watch-panel,
.home-terminal__insight-panel,
.home-terminal__sentiment-panel {
  min-height: 0;
  border: 1px solid rgba(226, 232, 240, 0.88);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
  overflow: hidden;
}

.home-terminal__watch-panel {
  display: flex;
  flex-direction: column;
  padding: 14px;
}

.home-terminal__panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.home-terminal__panel-header span {
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.home-terminal__panel-header strong {
  display: block;
  margin-top: 4px;
  color: #0f172a;
  font-size: 22px;
  line-height: 1;
}

.home-terminal__live-dot {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 11px;
  border-radius: 999px;
  background: rgba(34, 197, 94, 0.1);
  color: #15803d !important;
  letter-spacing: 0 !important;
  text-transform: none !important;
}

.home-terminal__live-dot::before {
  content: "";
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #22c55e;
  box-shadow: 0 0 0 5px rgba(34, 197, 94, 0.12);
}

.ticker-price-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
  overflow-x: hidden;
  padding-right: 4px;
}

.ticker-price-list :deep(.ant-spin-nested-loading),
.ticker-price-list :deep(.ant-spin-container) {
  height: 100%;
}

.ticker-list-item {
  margin-bottom: 10px;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
}

.ticker-list-item__card {
  position: relative;
  width: 100%;
  min-height: 82px;
  display: grid;
  grid-template-columns: minmax(86px, 0.95fr) minmax(82px, 0.75fr) minmax(82px, 0.9fr) minmax(58px, 0.45fr);
  gap: 10px;
  align-items: center;
  padding: 12px 34px 12px 12px;
  border: 1px solid rgba(226, 232, 240, 0.88);
  border-radius: 20px;
  background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.88));
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease, opacity 0.18s ease;
}

.ticker-list-item--up:hover .ticker-list-item__card {
  border-color: rgba(34, 197, 94, 0.28);
  background:
      linear-gradient(135deg, rgba(240, 253, 244, 0.98), rgba(255, 255, 255, 0.92));
  box-shadow: 0 16px 34px rgba(34, 197, 94, 0.08);
  transform: translateY(-1px);
}

.ticker-list-item--down:hover .ticker-list-item__card {
  border-color: rgba(248, 113, 113, 0.3);
  background:
      linear-gradient(135deg, rgba(255, 241, 242, 0.98), rgba(255, 255, 255, 0.92));
  box-shadow: 0 16px 34px rgba(248, 113, 113, 0.08);
  transform: translateY(-1px);
}

.ticker-list-item[data-dragging='true'] .ticker-list-item__card {
  opacity: 0.56;
  cursor: grabbing;
}

.ticker-list-item[data-drag-over='before'] .ticker-list-item__card {
  box-shadow: inset 0 4px 0 #0ea5e9;
}

.ticker-list-item[data-drag-over='after'] .ticker-list-item__card {
  box-shadow: inset 0 -4px 0 #0ea5e9;
}

.ticker-list-item__identity {
  display: flex;
  align-items: center;
  gap: 12px;
}

.ticker-list-item__identity :deep(.ant-avatar) {
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 800;
}

.ticker-list-item__identity-text,
.ticker-list-item__price-block,
.ticker-list-item__change-pill {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ticker-list-item__symbol-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.ticker-list-item__symbol-row strong {
  color: #0f172a;
  font-size: 20px;
  line-height: 1;
}

.ticker-list-item__symbol-row span,
.ticker-list-item__identity-text small,
.ticker-list-item__price-block span,
.ticker-list-item__change-pill span,
.ticker-list-item__stat span {
  color: rgba(100, 116, 139, 0.84);
  font-size: 11px;
}

.ticker-list-item__symbol-row span {
  display: none;
}

.ticker-list-item__price-block strong {
  overflow: hidden;
  color: #0f172a;
  font-size: 24px;
  line-height: 1;
  letter-spacing: -0.04em;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ticker-list-item__sparkline-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 54px;
  border-radius: 16px;
  overflow: hidden;
  color: #0f172a;
  background: rgba(248, 250, 252, 0.9);
}

.ticker-list-item__sparkline-card--up {
  color: #16a34a;
  background: rgba(240, 253, 244, 0.86);
}

.ticker-list-item__sparkline-card--down {
  color: #dc2626;
  background: rgba(255, 241, 242, 0.9);
}

.ticker-list-item__sparkline-svg {
  width: 100%;
  height: 52px;
  overflow: visible;
}

.ticker-list-item__sparkline-line {
  fill: none;
  stroke: currentColor;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.ticker-list-item__sparkline-point {
  fill: currentColor;
}

.ticker-list-item__sparkline-placeholder {
  color: rgba(100, 116, 139, 0.78);
  font-size: 12px;
}

.ticker-list-item__sparkline-tooltip {
  position: absolute;
  inset: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 4px;
  padding: 8px 10px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.86);
  color: #f8fafc;
  font-size: 11px;
  opacity: 0;
  transform: translateY(4px);
  pointer-events: none;
  transition:
      opacity 0.18s ease,
      transform 0.18s ease;
}

.ticker-list-item__sparkline-card:hover .ticker-list-item__sparkline-tooltip {
  opacity: 1;
  transform: translateY(0);
}

.ticker-list-item__change-pill {
  align-items: flex-start;
}

.ticker-list-item__change-pill strong {
  font-size: 22px;
  line-height: 1;
}

.ticker-list-item__change-pill--up strong {
  color: #16a34a;
}

.ticker-list-item__change-pill--down strong {
  color: #dc2626;
}

.ticker-list-item__stats-grid {
  display: none;
  grid-column: 1 / -1;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
}

.ticker-list-item__stat {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: 0;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(241, 245, 249, 0.72);
}

.ticker-list-item__stat strong {
  color: #0f172a;
  overflow: hidden;
  font-size: 12px;
  line-height: 1;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.ticker-list-item__drag-hint {
  position: absolute;
  top: 12px;
  right: 10px;
  display: inline-flex;
  flex-direction: column;
  gap: 1px;
  color: #94a3b8;
  font-size: 12px;
  cursor: grab;
  opacity: 0;
  transform: translateX(4px);
  transition: opacity 0.2s ease, transform 0.2s ease, color 0.2s ease;
}

.ticker-list-item:hover .ticker-list-item__drag-hint {
  opacity: 1;
  transform: translateX(0);
}

.home-terminal__insight-panel {
  padding: 14px;
  overflow-y: auto;
  overflow-x: hidden;
}

.home-terminal__sentiment-panel {
  flex: 1;
  min-height: 0;
  padding: 14px;
  overflow-y: auto;
  overflow-x: hidden;
}

.ticker-price-list::-webkit-scrollbar,
.home-terminal__insight-panel::-webkit-scrollbar,
.home-terminal__sentiment-panel::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.ticker-price-list::-webkit-scrollbar-thumb,
.home-terminal__insight-panel::-webkit-scrollbar-thumb,
.home-terminal__sentiment-panel::-webkit-scrollbar-thumb {
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.38);
}

.ticker-price-list::-webkit-scrollbar-track,
.home-terminal__insight-panel::-webkit-scrollbar-track,
.home-terminal__sentiment-panel::-webkit-scrollbar-track {
  background: transparent;
}

.home-market-overview--terminal {
  margin-bottom: 0;
}

:deep(.home-market-overview.home-market-overview--terminal) {
  margin-bottom: 0;
  padding: 18px;
  border-radius: 22px;
  box-shadow: none;
}

:deep(.home-market-overview.home-market-overview--terminal) .home-market-overview__heading {
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  margin-bottom: 14px;
}

:deep(.home-market-overview.home-market-overview--terminal) h2 {
  font-size: 26px;
  white-space: nowrap;
}

:deep(.home-market-overview.home-market-overview--terminal) .home-market-overview__meta {
  flex-direction: row;
  flex-wrap: wrap;
}

:deep(.home-market-overview.home-market-overview--terminal) .home-market-overview__heading p {
  display: none;
}

:deep(.home-market-overview.home-market-overview--terminal) .home-market-overview__grid {
  grid-template-columns: 1fr;
  gap: 10px;
}

:deep(.home-market-overview.home-market-overview--terminal) .overview-card {
  min-height: 116px;
  padding: 15px;
  border-radius: 18px;
}

:deep(.home-market-overview.home-market-overview--terminal) .overview-card__value-row strong {
  font-size: 24px;
}

.market-sentiment-panel--terminal {
  margin-bottom: 0;
}

:deep(.market-sentiment-panel.market-sentiment-panel--terminal) {
  margin-bottom: 0;
  min-height: 100%;
  border-radius: 22px;
  box-shadow: none;
}

@media (max-width: 520px) {
  .home-terminal__topbar {
    grid-template-columns: 1fr;
  }

  .home-terminal__view-switch {
    justify-self: start;
  }

  .home-terminal__workspace {
    grid-template-columns: 1fr;
  }

  .home-terminal__insight-panel {
    min-height: 360px;
  }
}

@media (max-width: 520px) {
  .home-page {
    height: auto;
    min-height: calc(100vh - 74px);
    overflow: visible;
    padding: 10px;
  }

  .home-terminal {
    min-height: calc(100vh - 94px);
  }

  .home-terminal__status-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home-terminal__view-switch,
  .home-terminal__view-button {
    width: 100%;
  }

  .home-terminal__view-button {
    justify-content: center;
  }

  .ticker-list-item__card {
    grid-template-columns: 1fr;
    padding-right: 38px;
  }

  .ticker-list-item__stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  :deep(.home-market-overview.home-market-overview--terminal) .home-market-overview__grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .home-terminal__status-strip {
    grid-template-columns: 1fr;
  }

  .home-terminal__view-switch {
    flex-direction: column;
  }

  .ticker-list-item__symbol-row {
    flex-direction: column;
    width: 100%;
    align-items: flex-start;
    gap: 4px;
  }

  .ticker-list-item__stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
