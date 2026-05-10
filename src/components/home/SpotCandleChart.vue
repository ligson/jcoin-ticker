<script setup lang="ts">
import {computed} from "vue";
import {SpotCandle} from "./spotMarketDataSources.ts";

const props = defineProps<{
  candles: SpotCandle[];
  title: string;
  coin: string;
}>()

const viewBoxWidth = 960
const viewBoxHeight = 360
const chartPadding = {
  top: 24,
  right: 88,
  bottom: 36,
  left: 64
}

const plotWidth = viewBoxWidth - chartPadding.left - chartPadding.right
const plotHeight = viewBoxHeight - chartPadding.top - chartPadding.bottom

const normalizedCandles = computed(() => {
  return [...props.candles].sort((first, second) => first.openTime - second.openTime)
})

const priceRange = computed(() => {
  const highs = normalizedCandles.value.map((item) => item.high)
  const lows = normalizedCandles.value.map((item) => item.low)
  const maxValue = highs.length > 0 ? Math.max(...highs) : 0
  const minValue = lows.length > 0 ? Math.min(...lows) : 0
  const spread = maxValue - minValue || maxValue * 0.04 || 1
  const padding = spread * 0.12

  return {
    min: Math.max(0, minValue - padding),
    max: maxValue + padding
  }
})

const scaleY = (price: number) => {
  const {min, max} = priceRange.value
  if (max <= min) {
    return chartPadding.top + (plotHeight / 2)
  }
  const ratio = (price - min) / (max - min)
  return chartPadding.top + plotHeight - (ratio * plotHeight)
}

const chartItems = computed(() => {
  const candles = normalizedCandles.value
  if (candles.length === 0) {
    return []
  }

  const step = plotWidth / Math.max(candles.length - 1, 1)
  const bodyWidth = Math.max(4, Math.min(14, step * 0.58))

  return candles.map((candle, index) => {
    const x = chartPadding.left + (step * index)
    const openY = scaleY(candle.open)
    const closeY = scaleY(candle.close)
    const highY = scaleY(candle.high)
    const lowY = scaleY(candle.low)
    const bodyTop = Math.min(openY, closeY)
    const bodyHeight = Math.max(2, Math.abs(closeY - openY))
    const isUp = candle.close >= candle.open

    return {
      ...candle,
      x,
      openY,
      closeY,
      highY,
      lowY,
      bodyTop,
      bodyHeight,
      bodyWidth,
      isUp
    }
  })
})

const closeLinePath = computed(() => {
  return chartItems.value
      .map((item, index) => `${index === 0 ? 'M' : 'L'} ${item.x} ${item.closeY}`)
      .join(' ')
})

const gridLines = computed(() => {
  return Array.from({length: 5}, (_, index) => {
    const y = chartPadding.top + ((plotHeight / 4) * index)
    const value = priceRange.value.max - (((priceRange.value.max - priceRange.value.min) / 4) * index)
    return {y, value}
  })
})

const xAxisLabels = computed(() => {
  const candles = normalizedCandles.value
  if (candles.length === 0) {
    return []
  }

  const indices = Array.from(new Set([
    0,
    Math.max(0, Math.floor((candles.length - 1) / 2)),
    candles.length - 1
  ]))

  return indices.map((index) => {
    const candle = candles[index]
    const x = chartPadding.left + (plotWidth * (candles.length === 1 ? 0 : (index / (candles.length - 1))))
    return {
      x,
      label: formatAxisTime(candle.openTime)
    }
  })
})

const timeRangeMs = computed(() => {
  const candles = normalizedCandles.value
  if (candles.length < 2) {
    return 0
  }
  return candles[candles.length - 1].openTime - candles[0].openTime
})

const lastCloseItem = computed(() => {
  const items = chartItems.value
  return items.length > 0 ? items[items.length - 1] : null
})

const lastPriceLabel = computed(() => {
  if (!lastCloseItem.value) {
    return ''
  }
  return formatPrice(lastCloseItem.value.close)
})

function formatPrice(value: number) {
  if (value >= 1000) {
    return value.toFixed(2)
  }
  if (value >= 1) {
    return value.toFixed(4)
  }
  if (value >= 0.01) {
    return value.toFixed(6)
  }
  return value.toFixed(8)
}

function formatAxisTime(timestamp: number) {
  const date = new Date(timestamp)
  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${date.getUTCDate()}`.padStart(2, '0')
  const hour = `${date.getUTCHours()}`.padStart(2, '0')
  const minute = `${date.getUTCMinutes()}`.padStart(2, '0')

  if (timeRangeMs.value >= 45 * 24 * 60 * 60 * 1000) {
    return `${year}-${month}`
  }

  if (timeRangeMs.value >= 2 * 24 * 60 * 60 * 1000) {
    return `${month}-${day}`
  }

  return `${month}-${day} ${hour}:${minute}`
}
</script>

<template>
  <div class="spot-candle-chart">
    <div class="spot-candle-chart__header">
      <div>
        <div class="spot-candle-chart__eyebrow">{{ coin }} / USDT</div>
        <h3 class="spot-candle-chart__title">{{ title }}</h3>
      </div>
      <div v-if="lastCloseItem" class="spot-candle-chart__last-price">
        <span class="spot-candle-chart__last-label">最新收盘</span>
        <strong>{{ lastPriceLabel }}</strong>
      </div>
    </div>

    <div v-if="chartItems.length > 0" class="spot-candle-chart__canvas">
      <svg
          :viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`"
          class="spot-candle-chart__svg"
          preserveAspectRatio="none"
      >
        <line
            v-for="line in gridLines"
            :key="line.y"
            :x1="chartPadding.left"
            :x2="viewBoxWidth - chartPadding.right"
            :y1="line.y"
            :y2="line.y"
            class="spot-candle-chart__grid-line"
        />

        <text
            v-for="line in gridLines"
            :key="`label-${line.y}`"
            :x="chartPadding.left - 14"
            :y="line.y + 4"
            class="spot-candle-chart__axis-label"
        >
          {{ formatPrice(line.value) }}
        </text>

        <path
            :d="closeLinePath"
            class="spot-candle-chart__close-line"
        />

        <g v-for="item in chartItems" :key="item.openTime">
          <line
              :x1="item.x"
              :x2="item.x"
              :y1="item.highY"
              :y2="item.lowY"
              :class="item.isUp ? 'spot-candle-chart__wick spot-candle-chart__wick--up' : 'spot-candle-chart__wick spot-candle-chart__wick--down'"
          />
          <rect
              :x="item.x - (item.bodyWidth / 2)"
              :y="item.bodyTop"
              :width="item.bodyWidth"
              :height="item.bodyHeight"
              rx="3"
              :class="item.isUp ? 'spot-candle-chart__body spot-candle-chart__body--up' : 'spot-candle-chart__body spot-candle-chart__body--down'"
          />
        </g>

        <template v-if="lastCloseItem">
          <line
              :x1="chartPadding.left"
              :x2="viewBoxWidth - chartPadding.right"
              :y1="lastCloseItem.closeY"
              :y2="lastCloseItem.closeY"
              class="spot-candle-chart__last-line"
          />
          <rect
              :x="viewBoxWidth - chartPadding.right + 12"
              :y="lastCloseItem.closeY - 13"
              width="64"
              height="26"
              rx="13"
              class="spot-candle-chart__last-badge"
          />
          <text
              :x="viewBoxWidth - chartPadding.right + 44"
              :y="lastCloseItem.closeY + 5"
              text-anchor="middle"
              class="spot-candle-chart__last-badge-text"
          >
            {{ lastPriceLabel }}
          </text>
        </template>

        <text
            v-for="label in xAxisLabels"
            :key="`time-${label.x}`"
            :x="label.x"
            :y="viewBoxHeight - 8"
            text-anchor="middle"
            class="spot-candle-chart__axis-label"
        >
          {{ label.label }}
        </text>
      </svg>
    </div>

    <div v-else class="spot-candle-chart__empty">
      暂无可展示的 K 线数据。
    </div>
  </div>
</template>

<style scoped>
.spot-candle-chart {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.spot-candle-chart__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.spot-candle-chart__eyebrow {
  margin-bottom: 6px;
  color: rgba(71, 85, 105, 0.78);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.spot-candle-chart__title {
  color: #0f172a;
  font-size: 22px;
  font-weight: 700;
}

.spot-candle-chart__last-price {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  color: #0f172a;
}

.spot-candle-chart__last-price strong {
  font-size: 24px;
  line-height: 1;
}

.spot-candle-chart__last-label {
  color: rgba(71, 85, 105, 0.82);
  font-size: 12px;
}

.spot-candle-chart__canvas {
  width: 100%;
  height: 360px;
  border-radius: 26px;
  background:
      radial-gradient(circle at top left, rgba(255, 255, 255, 0.36), transparent 45%),
      linear-gradient(180deg, rgba(248, 250, 252, 0.98), rgba(241, 245, 249, 0.88));
}

.spot-candle-chart__svg {
  width: 100%;
  height: 100%;
}

.spot-candle-chart__grid-line {
  stroke: rgba(148, 163, 184, 0.2);
  stroke-width: 1;
}

.spot-candle-chart__axis-label {
  fill: rgba(71, 85, 105, 0.78);
  font-size: 12px;
}

.spot-candle-chart__close-line {
  fill: none;
  stroke: rgba(59, 130, 246, 0.32);
  stroke-width: 2.25;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.spot-candle-chart__wick {
  stroke-width: 2;
  stroke-linecap: round;
}

.spot-candle-chart__wick--up {
  stroke: rgba(22, 163, 74, 0.88);
}

.spot-candle-chart__wick--down {
  stroke: rgba(220, 38, 38, 0.82);
}

.spot-candle-chart__body--up {
  fill: rgba(34, 197, 94, 0.86);
}

.spot-candle-chart__body--down {
  fill: rgba(248, 113, 113, 0.88);
}

.spot-candle-chart__last-line {
  stroke: rgba(59, 130, 246, 0.42);
  stroke-width: 1.5;
  stroke-dasharray: 4 5;
}

.spot-candle-chart__last-badge {
  fill: rgba(15, 23, 42, 0.92);
}

.spot-candle-chart__last-badge-text {
  fill: #f8fafc;
  font-size: 12px;
  font-weight: 700;
}

.spot-candle-chart__empty {
  padding: 48px 18px;
  border-radius: 24px;
  background: rgba(248, 250, 252, 0.88);
  color: rgba(71, 85, 105, 0.88);
  text-align: center;
}

@media (max-width: 768px) {
  .spot-candle-chart__header {
    flex-direction: column;
  }

  .spot-candle-chart__last-price {
    align-items: flex-start;
  }

  .spot-candle-chart__canvas {
    height: 300px;
  }
}
</style>
