<script setup lang="ts">
import {computed, nextTick, onMounted, ref, watch} from "vue";
import {fetchSpotCandles, marketDataSourceLabelMap} from "../home/spotMarketDataSources.ts";
import {fetchMarketSentimentHistory, resolveMarketSentimentAccent} from "../home/marketSentiment.ts";
import type {MarketDataSource} from "../config/config.ts";
import {
  ensureSpotTickerRuntime,
  runtimeCoinPrices,
  runtimeCoins,
  runtimeMarketDataSource
} from "../home/spotTickerRuntime.ts";

const coinPrices = runtimeCoinPrices
const sparklineSeriesMap = ref<Record<string, number[]>>({})
const sparklineSource = ref<MarketDataSource | null>(null)
const sentimentScore = ref<number | null>(null)
const sentimentClassification = ref('暂无')
const sentimentUpdatedAt = ref<number | null>(null)
let sparklineRequestToken = 0

const FLOATING_SPARKLINE_POINT_COUNT = 24
const FLOATING_SPARKLINE_WIDTH = 300
const FLOATING_SPARKLINE_HEIGHT = 46
const FLOATING_SPARKLINE_PADDING = 4
const FLOATING_WINDOW_WIDTH = 320

interface SparklineShape {
  linePath: string;
  areaPath: string;
}

const sourceLabel = computed(() => marketDataSourceLabelMap[runtimeMarketDataSource.value])
const runtimeSignature = computed(() => `${runtimeMarketDataSource.value}::${runtimeCoins.value.join(',')}`)
const sentimentAccent = computed(() => resolveMarketSentimentAccent(sentimentScore.value ?? 50))
const preferredWindowHeight = computed(() => {
  if (coinPrices.value.length === 0) {
    return 190
  }
  return 112 + (coinPrices.value.length * 60) + ((coinPrices.value.length - 1) * 8) + 20
})

function formatPrice(value: string | number) {
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

function formatSignedPercent(value: string | number) {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue)) {
    return '--'
  }
  return `${numberValue > 0 ? '+' : ''}${numberValue.toFixed(2)}%`
}

function formatSentimentScore(value: number | null) {
  if (value === null || !Number.isFinite(value)) {
    return '--'
  }
  return Math.round(value)
}

function formatSentimentUpdatedAt(value: number | null) {
  if (!value) {
    return '等待更新'
  }

  const date = new Date(value)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${month}-${day}`
}

function isUp(value: string | number) {
  return Number(value) >= 0
}

function pruneSparklineState(coins: string[]) {
  const coinSet = new Set(coins)
  sparklineSeriesMap.value = Object.fromEntries(
      Object.entries(sparklineSeriesMap.value).filter(([coin]) => coinSet.has(coin))
  )
}

async function loadSparklineSeries(coins: string[], source: MarketDataSource) {
  if (sparklineSource.value !== source) {
    sparklineSeriesMap.value = {}
    sparklineSource.value = source
  }

  pruneSparklineState(coins)
  const missingCoins = coins.filter((coin) => !sparklineSeriesMap.value[coin]?.length)
  if (missingCoins.length === 0) {
    return
  }

  const requestToken = ++sparklineRequestToken
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
            .slice(-FLOATING_SPARKLINE_POINT_COUNT)
      }
    } catch {
      if (requestToken !== sparklineRequestToken) {
        return
      }
      sparklineSeriesMap.value = {
        ...sparklineSeriesMap.value,
        [coin]: []
      }
    }
  }
}

function getSparklineValues(coin: string, currentPrice: string | number) {
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

function buildSparklineShape(values: number[]): SparklineShape | null {
  const normalizedValues = values.filter((value) => Number.isFinite(value) && value > 0)
  if (normalizedValues.length === 0) {
    return null
  }

  const minValue = Math.min(...normalizedValues)
  const maxValue = Math.max(...normalizedValues)
  const spread = maxValue - minValue || Math.max(maxValue * 0.04, 1)
  const paddedMin = Math.max(0, minValue - spread * 0.18)
  const paddedMax = maxValue + spread * 0.18
  const chartWidth = FLOATING_SPARKLINE_WIDTH - (FLOATING_SPARKLINE_PADDING * 2)
  const chartHeight = FLOATING_SPARKLINE_HEIGHT - (FLOATING_SPARKLINE_PADDING * 2)
  const step = chartWidth / Math.max(normalizedValues.length - 1, 1)

  const points = normalizedValues.map((value, index) => {
    const ratio = paddedMax <= paddedMin ? 0.5 : (value - paddedMin) / (paddedMax - paddedMin)
    return {
      x: FLOATING_SPARKLINE_PADDING + (step * index),
      y: FLOATING_SPARKLINE_PADDING + chartHeight - (ratio * chartHeight)
    }
  })

  const linePath = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ')

  const firstPoint = points[0]
  const lastPoint = points[points.length - 1]
  const areaPath = `${linePath} L ${lastPoint.x} ${FLOATING_SPARKLINE_HEIGHT - FLOATING_SPARKLINE_PADDING} L ${firstPoint.x} ${FLOATING_SPARKLINE_HEIGHT - FLOATING_SPARKLINE_PADDING} Z`

  return {
    linePath,
    areaPath
  }
}

const sparklineShapeMap = computed<Record<string, SparklineShape | null>>(() => {
  return Object.fromEntries(
      coinPrices.value.map((item) => [item.coin, buildSparklineShape(getSparklineValues(item.coin, item.price))])
  ) as Record<string, SparklineShape | null>
})

async function syncFloatingWindowSize() {
  await nextTick()
  await window.ipcRenderer.invoke('floating-window-fit-content', {
    width: FLOATING_WINDOW_WIDTH,
    height: preferredWindowHeight.value
  })
}

async function loadMarketSentiment() {
  try {
    const points = await fetchMarketSentimentHistory()
    const currentPoint = points[points.length - 1]
    sentimentScore.value = currentPoint?.value ?? null
    sentimentClassification.value = currentPoint?.classification || '暂无'
    sentimentUpdatedAt.value = currentPoint?.timestamp ?? null
  } catch {
    sentimentScore.value = null
    sentimentClassification.value = '暂无'
    sentimentUpdatedAt.value = null
  }
}

watch(runtimeSignature, async () => {
  await loadSparklineSeries(runtimeCoins.value, runtimeMarketDataSource.value)
}, {
  immediate: true
})

watch(() => runtimeCoins.value.length, () => {
  void syncFloatingWindowSize()
}, {
  immediate: true
})

onMounted(() => {
  void ensureSpotTickerRuntime()
  void loadMarketSentiment()
  void syncFloatingWindowSize()
})
</script>

<template>
  <div class="floating-ticker-window">
    <section class="floating-ticker-window__panel">
      <div class="floating-ticker-window__drag-bar">
        <span class="floating-ticker-window__drag-dot"></span>
        <span class="floating-ticker-window__drag-dot"></span>
        <span class="floating-ticker-window__drag-dot"></span>
      </div>

      <section class="floating-ticker-window__sentiment" :class="`floating-ticker-window__sentiment--${sentimentAccent}`">
        <div>
          <small>市场情绪</small>
          <strong>{{ formatSentimentScore(sentimentScore) }}</strong>
        </div>
        <div class="floating-ticker-window__sentiment-meta">
          <span>{{ sentimentClassification }}</span>
          <em>{{ sourceLabel }} · {{ formatSentimentUpdatedAt(sentimentUpdatedAt) }}</em>
        </div>
      </section>

      <div v-if="coinPrices.length > 0" class="floating-ticker-window__list">
        <article
            v-for="item in coinPrices"
            :key="item.coin"
            class="floating-ticker-window__item"
            :class="isUp(item.priceChangePercentage) ? 'floating-ticker-window__item--up' : 'floating-ticker-window__item--down'"
        >
          <div class="floating-ticker-window__sparkline-layer">
            <svg
                v-if="sparklineShapeMap[item.coin]"
                class="floating-ticker-window__sparkline-svg"
                :viewBox="`0 0 ${FLOATING_SPARKLINE_WIDTH} ${FLOATING_SPARKLINE_HEIGHT}`"
                preserveAspectRatio="none"
            >
              <defs>
                <linearGradient :id="`floating-sparkline-${item.coin}`" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stop-color="currentColor" stop-opacity="0.18" />
                  <stop offset="100%" stop-color="currentColor" stop-opacity="0.01" />
                </linearGradient>
              </defs>

              <path
                  :d="sparklineShapeMap[item.coin]?.areaPath"
                  :fill="`url(#floating-sparkline-${item.coin})`"
              />
              <path
                  :d="sparklineShapeMap[item.coin]?.linePath"
                  class="floating-ticker-window__sparkline-line"
              />
            </svg>
          </div>

          <div class="floating-ticker-window__item-content">
            <div class="floating-ticker-window__coin-block">
              <strong>{{ item.coin }}</strong>
              <span>24H {{ formatSignedPercent(item.priceChangePercentage) }}</span>
            </div>
            <span class="floating-ticker-window__price">{{ formatPrice(item.price) }}</span>
          </div>
        </article>
      </div>

      <div v-else class="floating-ticker-window__empty">
        暂无监控币种
      </div>
    </section>
  </div>
</template>

<style scoped>
.floating-ticker-window {
  width: 100vw;
  height: 100vh;
  padding: 10px;
  box-sizing: border-box;
  background: transparent;
}

.floating-ticker-window__panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 22px;
  background:
      radial-gradient(circle at top left, rgba(14, 165, 233, 0.16), transparent 28%),
      radial-gradient(circle at bottom right, rgba(16, 185, 129, 0.14), transparent 30%),
      linear-gradient(180deg, rgba(15, 23, 42, 0.64), rgba(15, 23, 42, 0.46));
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.2);
  backdrop-filter: blur(22px);
  overflow: hidden;
}

.floating-ticker-window__drag-bar {
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  -webkit-app-region: drag;
}

.floating-ticker-window__drag-dot {
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: rgba(226, 232, 240, 0.58);
}

.floating-ticker-window__sentiment {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
}

.floating-ticker-window__sentiment small {
  display: block;
  color: rgba(226, 232, 240, 0.76);
  font-size: 10px;
  line-height: 1;
}

.floating-ticker-window__sentiment strong {
  display: block;
  margin-top: 4px;
  color: #ffffff;
  font-size: 24px;
  line-height: 1;
}

.floating-ticker-window__sentiment-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.floating-ticker-window__sentiment-meta span {
  font-size: 12px;
  font-weight: 700;
}

.floating-ticker-window__sentiment-meta em {
  color: rgba(226, 232, 240, 0.74);
  font-style: normal;
  font-size: 10px;
}

.floating-ticker-window__sentiment--emerald .floating-ticker-window__sentiment-meta span {
  color: #86efac;
}

.floating-ticker-window__sentiment--amber .floating-ticker-window__sentiment-meta span {
  color: #fbbf24;
}

.floating-ticker-window__sentiment--sky .floating-ticker-window__sentiment-meta span {
  color: #7dd3fc;
}

.floating-ticker-window__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}

.floating-ticker-window__item {
  position: relative;
  min-height: 60px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.07);
  overflow: hidden;
}

.floating-ticker-window__item--up {
  color: #86efac;
}

.floating-ticker-window__item--down {
  color: #fda4af;
}

.floating-ticker-window__sparkline-layer {
  position: absolute;
  inset: 0;
  opacity: 0.92;
}

.floating-ticker-window__sparkline-svg {
  width: 100%;
  height: 100%;
}

.floating-ticker-window__sparkline-line {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  opacity: 0.72;
}

.floating-ticker-window__item-content {
  position: relative;
  z-index: 1;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
}

.floating-ticker-window__coin-block strong {
  display: block;
  color: #ffffff;
  font-size: 15px;
  line-height: 1.1;
}

.floating-ticker-window__coin-block span {
  display: block;
  margin-top: 4px;
  font-size: 11px;
  line-height: 1.2;
}

.floating-ticker-window__price {
  color: #ffffff;
  font-size: 18px;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
}

.floating-ticker-window__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 72px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.06);
  color: rgba(226, 232, 240, 0.8);
  font-size: 12px;
}
</style>
