<script setup lang="ts">
import {computed, getCurrentInstance, ref, watch} from "vue";
import {useRouter} from "vue-router";
import {HolderOutlined} from "@ant-design/icons-vue";
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
let sparklineRequestToken = 0

const HOME_SPARKLINE_POINT_COUNT = 24
const HOME_SPARKLINE_WIDTH = 208
const HOME_SPARKLINE_HEIGHT = 68
const HOME_SPARKLINE_PADDING = 6

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

watch(sparklineSignature, async () => {
  await loadSparklineSeries(runtimeCoins.value, runtimeMarketDataSource.value)
}, {
  immediate: true
})

void ensureSpotTickerRuntime()

</script>

<template>
  <div class="home-page">
    <HomeMarketOverviewBar :coin-prices="coinPrices" />
    <MarketSentimentPanel />

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
            <div class="ticker-list-item__header">
              <div class="ticker-list-item__identity">
                <a-avatar :style="{backgroundColor: getAvatarColor(item.coin)}" size="large">
                  {{ item.coin }}
                </a-avatar>

                <div class="ticker-list-item__identity-text">
                  <div class="ticker-list-item__symbol-row">
                    <strong>{{ item.coin }}</strong>
                    <span class="ticker-list-item__pair-pill">USDT 现货</span>
                  </div>
                  <span class="ticker-list-item__pair-text">{{ item.coin }} / USDT</span>
                </div>
              </div>

              <span class="ticker-list-item__drag-hint" title="拖拽调整顺序">
                <HolderOutlined />
                <HolderOutlined />
              </span>
            </div>

            <div class="ticker-list-item__body">
              <div class="ticker-list-item__price-block">
                <span class="ticker-list-item__price-label">最新价格</span>
                <strong>{{ formatPrice(item.price) }}</strong>
              </div>

              <div
                  class="ticker-list-item__sparkline-card"
                  :class="isPriceUp(item.priceChangePercentage) ? 'ticker-list-item__sparkline-card--up' : 'ticker-list-item__sparkline-card--down'"
              >
                <div class="ticker-list-item__sparkline-header">
                  <span>24H 小走势</span>
                  <div class="ticker-list-item__sparkline-meta">
                    <small>1H 采样</small>
                    <span
                        v-if="sparklineSummaryMap[item.coin]"
                        class="ticker-list-item__sparkline-badge"
                    >
                      {{ sparklineSummaryMap[item.coin]?.isUp ? '上行' : '下行' }}
                    </span>
                  </div>
                </div>

                <div class="ticker-list-item__sparkline-body">
                  <svg
                      v-if="sparklineShapeMap[item.coin]"
                      class="ticker-list-item__sparkline-svg"
                      :viewBox="`0 0 ${HOME_SPARKLINE_WIDTH} ${HOME_SPARKLINE_HEIGHT}`"
                      preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient :id="`sparkline-gradient-${item.coin}`" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stop-color="currentColor" stop-opacity="0.22" />
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
                        r="3.2"
                        class="ticker-list-item__sparkline-point"
                    />
                  </svg>

                  <span v-else class="ticker-list-item__sparkline-placeholder">
                    {{ isSparklineLoading(item.coin) ? '走势加载中' : '暂无走势' }}
                  </span>

                  <div
                      v-if="sparklineSummaryMap[item.coin]"
                      class="ticker-list-item__sparkline-tooltip"
                  >
                    <div class="ticker-list-item__sparkline-tooltip-item">
                      <span>起点价</span>
                      <strong>{{ formatPrice(sparklineSummaryMap[item.coin]?.startPrice ?? 0) }}</strong>
                    </div>
                    <div class="ticker-list-item__sparkline-tooltip-item">
                      <span>终点价</span>
                      <strong>{{ formatPrice(sparklineSummaryMap[item.coin]?.endPrice ?? 0) }}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div
                  class="ticker-list-item__change-pill"
                  :class="isPriceUp(item.priceChangePercentage) ? 'ticker-list-item__change-pill--up' : 'ticker-list-item__change-pill--down'"
              >
                <span>{{ isPriceUp(item.priceChangePercentage) ? '24H 涨幅' : '24H 跌幅' }}</span>
                <strong>{{ formatSignedPercent(item.priceChangePercentage) }}</strong>
              </div>
            </div>

            <div class="ticker-list-item__stats-grid">
              <div class="ticker-list-item__stat">
                <span>24H 最高</span>
                <strong>{{ formatPrice(item.high) }}</strong>
              </div>
              <div class="ticker-list-item__stat">
                <span>24H 最低</span>
                <strong>{{ formatPrice(item.low) }}</strong>
              </div>
              <div class="ticker-list-item__stat">
                <span>24H 成交量</span>
                <strong>{{ formatCompactNumber(item.volume) }}</strong>
              </div>
              <div class="ticker-list-item__stat">
                <span>24H 成交额</span>
                <strong>{{ formatCompactNumber(item.volumeInUSDT) }}</strong>
              </div>
            </div>
          </div>
        </a-list-item>
      </template>
    </a-list>
  </div>
</template>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
}

.ticker-price-list {
  padding: 8px 4px;
}

.ticker-list-item {
  margin-bottom: 12px;
  padding: 0 !important;
  border: none !important;
  background: transparent !important;
}

.ticker-list-item__card {
  width: 100%;
  padding: 18px 20px;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92));
  transition:
      border-color 0.22s ease,
      background 0.22s ease,
      box-shadow 0.22s ease,
      transform 0.22s ease,
      opacity 0.18s ease;
  cursor: pointer;
}

.ticker-list-item[data-dragging='true'] .ticker-list-item__card {
  opacity: 0.56;
  cursor: grabbing;
}

.ticker-list-item[data-dragging='true'] .ticker-list-item__drag-hint {
  opacity: 1;
  transform: scale(1.02);
}

.ticker-list-item[data-drag-over='before'] .ticker-list-item__card {
  box-shadow: inset 0 4px 0 #0ea5e9;
}

.ticker-list-item[data-drag-over='after'] .ticker-list-item__card {
  box-shadow: inset 0 -4px 0 #0ea5e9;
}

.ticker-list-item--up:hover .ticker-list-item__card {
  border-color: rgba(34, 197, 94, 0.24);
  background:
      linear-gradient(135deg, rgba(244, 255, 248, 0.98), rgba(231, 252, 240, 0.94));
  box-shadow: 0 18px 38px rgba(34, 197, 94, 0.08);
  transform: translateY(-2px);
}

.ticker-list-item--down:hover .ticker-list-item__card {
  border-color: rgba(248, 113, 113, 0.24);
  background:
      linear-gradient(135deg, rgba(255, 245, 246, 0.98), rgba(255, 236, 238, 0.94));
  box-shadow: 0 18px 38px rgba(248, 113, 113, 0.08);
  transform: translateY(-2px);
}

.ticker-list-item__header,
.ticker-list-item__body {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ticker-list-item__header {
  gap: 16px;
  margin-bottom: 18px;
}

.ticker-list-item__identity {
  display: flex;
  align-items: center;
  gap: 16px;
}

.ticker-list-item__identity-text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ticker-list-item__symbol-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ticker-list-item__symbol-row strong {
  color: #0f172a;
  font-size: 24px;
  line-height: 1;
}

.ticker-list-item__pair-pill {
  display: inline-flex;
  align-items: center;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(226, 232, 240, 0.68);
  color: #475569;
  font-size: 12px;
  font-weight: 600;
}

.ticker-list-item__pair-text,
.ticker-list-item__price-label,
.ticker-list-item__stat span {
  color: rgba(71, 85, 105, 0.78);
  font-size: 13px;
}

.ticker-list-item__drag-hint {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  min-width: 34px;
  height: 28px;
  padding: 0 8px;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: rgba(241, 245, 249, 0.82);
  color: #94a3b8;
  font-size: 12px;
  cursor: grab;
  opacity: 0;
  transform: translateY(2px);
  transition:
      opacity 0.2s ease,
      transform 0.2s ease,
      color 0.2s ease,
      border-color 0.2s ease,
      background 0.2s ease;
}

.ticker-list-item:hover .ticker-list-item__drag-hint {
  opacity: 1;
  transform: translateY(0);
}

.ticker-list-item__drag-hint:hover {
  color: #0f172a;
  border-color: rgba(14, 165, 233, 0.22);
  background: rgba(224, 242, 254, 0.92);
}

.ticker-list-item__body {
  gap: 18px;
  margin-bottom: 16px;
}

.ticker-list-item__price-block {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ticker-list-item__price-block strong {
  color: #0f172a;
  font-size: 34px;
  line-height: 1;
  letter-spacing: -0.04em;
}

.ticker-list-item__sparkline-card {
  flex: 0 0 228px;
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 14px 12px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(248, 250, 252, 0.9);
  color: #0f172a;
}

.ticker-list-item__sparkline-card--up {
  color: #16a34a;
  border-color: rgba(34, 197, 94, 0.18);
  background:
      linear-gradient(180deg, rgba(240, 253, 244, 0.94), rgba(248, 250, 252, 0.92));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.ticker-list-item__sparkline-card--down {
  color: #dc2626;
  border-color: rgba(248, 113, 113, 0.18);
  background:
      linear-gradient(180deg, rgba(255, 241, 242, 0.94), rgba(248, 250, 252, 0.92));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.ticker-list-item__sparkline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: rgba(71, 85, 105, 0.82);
  font-size: 12px;
}

.ticker-list-item__sparkline-meta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.ticker-list-item__sparkline-header small {
  color: rgba(100, 116, 139, 0.82);
  font-size: 11px;
}

.ticker-list-item__sparkline-badge {
  display: inline-flex;
  align-items: center;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  color: currentColor;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.ticker-list-item__sparkline-body {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 68px;
}

.ticker-list-item__sparkline-svg {
  width: 100%;
  height: 68px;
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
  left: 8px;
  right: 8px;
  top: 6px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.86);
  color: #f8fafc;
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

.ticker-list-item__sparkline-tooltip-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ticker-list-item__sparkline-tooltip-item span {
  color: rgba(226, 232, 240, 0.84);
  font-size: 11px;
}

.ticker-list-item__sparkline-tooltip-item strong {
  color: #ffffff;
  font-size: 13px;
  line-height: 1;
}

.ticker-list-item__change-pill {
  display: flex;
  min-width: 146px;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
  padding: 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(148, 163, 184, 0.12);
  background: rgba(248, 250, 252, 0.82);
}

.ticker-list-item__change-pill span {
  font-size: 12px;
  color: rgba(71, 85, 105, 0.76);
}

.ticker-list-item__change-pill strong {
  font-size: 24px;
  line-height: 1;
}

.ticker-list-item__change-pill--up strong {
  color: #16a34a;
}

.ticker-list-item__change-pill--down strong {
  color: #dc2626;
}

.ticker-list-item__stats-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.ticker-list-item__stat {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 14px 16px;
  border-radius: 18px;
  border: 1px solid rgba(226, 232, 240, 0.92);
  background: rgba(255, 255, 255, 0.72);
}

.ticker-list-item__stat strong {
  color: #0f172a;
  font-size: 16px;
  line-height: 1.2;
}

@media (max-width: 920px) {
  .ticker-list-item__body {
    flex-direction: column;
    align-items: flex-start;
  }

  .ticker-list-item__price-block,
  .ticker-list-item__sparkline-card,
  .ticker-list-item__change-pill {
    width: 100%;
  }

  .ticker-list-item__change-pill {
    width: 100%;
    align-items: flex-start;
  }

  .ticker-list-item__stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .ticker-list-item__card {
    padding: 16px;
  }

  .ticker-list-item__header {
    align-items: flex-start;
  }

  .ticker-list-item__identity {
    align-items: flex-start;
  }

  .ticker-list-item__symbol-row {
    flex-wrap: wrap;
  }

  .ticker-list-item__price-block strong {
    font-size: 28px;
  }

  .ticker-list-item__stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
