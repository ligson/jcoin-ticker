<script setup lang="ts">
import {computed, ref} from "vue";
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
const hoveredIndex = ref<number | null>(null)

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

const hoveredItem = computed(() => {
  if (hoveredIndex.value === null) {
    return null
  }
  return chartItems.value[hoveredIndex.value] ?? null
})

const activeItem = computed(() => hoveredItem.value ?? lastCloseItem.value)

const activePriceLabel = computed(() => {
  if (!activeItem.value) {
    return ''
  }
  return formatPrice(activeItem.value.close)
})

const hoverTooltipClass = computed(() => {
  if (!hoveredItem.value) {
    return ''
  }
  return hoveredItem.value.x > (viewBoxWidth * 0.7)
      ? 'spot-candle-chart__tooltip--left'
      : 'spot-candle-chart__tooltip--right'
})

const hoverTooltipStyle = computed(() => {
  if (!hoveredItem.value) {
    return {}
  }
  return {
    left: `${(hoveredItem.value.x / viewBoxWidth) * 100}%`,
    top: `${(Math.max(chartPadding.top + 12, hoveredItem.value.highY - 10) / viewBoxHeight) * 100}%`
  }
})

const hoverPriceLineLabel = computed(() => {
  if (!hoveredItem.value) {
    return ''
  }
  return formatPrice(hoveredItem.value.close)
})

function handlePointerMove(event: MouseEvent) {
  const currentTarget = event.currentTarget as HTMLElement | null
  if (!currentTarget || chartItems.value.length === 0) {
    hoveredIndex.value = null
    return
  }

  const rect = currentTarget.getBoundingClientRect()
  const relativeX = ((event.clientX - rect.left) / rect.width) * viewBoxWidth
  const clampedX = Math.min(viewBoxWidth - chartPadding.right, Math.max(chartPadding.left, relativeX))
  const step = chartItems.value.length > 1
      ? plotWidth / (chartItems.value.length - 1)
      : plotWidth
  const nextIndex = chartItems.value.length === 1
      ? 0
      : Math.round((clampedX - chartPadding.left) / step)

  hoveredIndex.value = Math.min(chartItems.value.length - 1, Math.max(0, nextIndex))
}

function handlePointerLeave() {
  hoveredIndex.value = null
}

function formatPrice(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '--'
  }
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

function formatSignedPercent(value: number) {
  if (!Number.isFinite(value)) {
    return '--'
  }
  return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
}

function formatCompactNumber(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '--'
  }
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(2)}B`
  }
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}M`
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}K`
  }
  return value.toFixed(2)
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

function formatTooltipTime(timestamp: number) {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')} ${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`
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
        <strong>{{ activePriceLabel || lastPriceLabel }}</strong>
      </div>
    </div>

    <div
        v-if="chartItems.length > 0"
        class="spot-candle-chart__canvas"
        @mousemove="handlePointerMove"
        @mouseleave="handlePointerLeave"
    >
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

        <g
            v-for="item in chartItems"
            :key="item.openTime"
            :class="{'spot-candle-chart__candle-group--muted': hoveredItem && hoveredItem.openTime !== item.openTime}"
        >
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

        <template v-if="activeItem">
          <line
              :x1="chartPadding.left"
              :x2="viewBoxWidth - chartPadding.right"
              :y1="activeItem.closeY"
              :y2="activeItem.closeY"
              class="spot-candle-chart__last-line"
          />
          <rect
              :x="viewBoxWidth - chartPadding.right + 12"
              :y="activeItem.closeY - 13"
              width="64"
              height="26"
              rx="13"
              class="spot-candle-chart__last-badge"
          />
          <text
              :x="viewBoxWidth - chartPadding.right + 44"
              :y="activeItem.closeY + 5"
              text-anchor="middle"
              class="spot-candle-chart__last-badge-text"
          >
            {{ hoveredItem ? hoverPriceLineLabel : lastPriceLabel }}
          </text>
        </template>

        <template v-if="hoveredItem">
          <line
              :x1="hoveredItem.x"
              :x2="hoveredItem.x"
              :y1="chartPadding.top"
              :y2="chartPadding.top + plotHeight"
              class="spot-candle-chart__crosshair-line"
          />
          <line
              :x1="chartPadding.left"
              :x2="viewBoxWidth - chartPadding.right"
              :y1="hoveredItem.closeY"
              :y2="hoveredItem.closeY"
              class="spot-candle-chart__crosshair-line spot-candle-chart__crosshair-line--horizontal"
          />
          <circle
              :cx="hoveredItem.x"
              :cy="hoveredItem.closeY"
              r="5"
              class="spot-candle-chart__crosshair-point"
          />
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

      <div
          v-if="hoveredItem"
          class="spot-candle-chart__tooltip"
          :class="hoverTooltipClass"
          :style="hoverTooltipStyle"
      >
        <div class="spot-candle-chart__tooltip-time">{{ formatTooltipTime(hoveredItem.openTime) }}</div>
        <div class="spot-candle-chart__tooltip-grid">
          <span>开</span>
          <strong>{{ formatPrice(hoveredItem.open) }}</strong>
          <span>高</span>
          <strong>{{ formatPrice(hoveredItem.high) }}</strong>
          <span>低</span>
          <strong>{{ formatPrice(hoveredItem.low) }}</strong>
          <span>收</span>
          <strong>{{ formatPrice(hoveredItem.close) }}</strong>
          <span>涨跌</span>
          <strong>{{ formatSignedPercent(((hoveredItem.close - hoveredItem.open) / hoveredItem.open) * 100) }}</strong>
          <span>成交量</span>
          <strong>{{ formatCompactNumber(hoveredItem.volume) }}</strong>
        </div>
      </div>
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
  position: relative;
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

.spot-candle-chart__candle-group--muted {
  opacity: 0.34;
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

.spot-candle-chart__crosshair-line {
  stroke: rgba(15, 23, 42, 0.16);
  stroke-width: 1.2;
  stroke-dasharray: 4 5;
}

.spot-candle-chart__crosshair-line--horizontal {
  stroke: rgba(59, 130, 246, 0.3);
}

.spot-candle-chart__crosshair-point {
  fill: #ffffff;
  stroke: rgba(59, 130, 246, 0.88);
  stroke-width: 2.5;
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

.spot-candle-chart__tooltip {
  position: absolute;
  min-width: 188px;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.92);
  color: #f8fafc;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
  pointer-events: none;
  transform: translate(-50%, calc(-100% - 12px));
}

.spot-candle-chart__tooltip--left {
  transform: translate(calc(-100% - 14px), calc(-100% - 12px));
}

.spot-candle-chart__tooltip--right {
  transform: translate(14px, calc(-100% - 12px));
}

.spot-candle-chart__tooltip-time {
  margin-bottom: 10px;
  color: rgba(226, 232, 240, 0.82);
  font-size: 11px;
}

.spot-candle-chart__tooltip-grid {
  display: grid;
  grid-template-columns: auto auto;
  gap: 6px 12px;
  align-items: center;
}

.spot-candle-chart__tooltip-grid span {
  color: rgba(203, 213, 225, 0.82);
  font-size: 11px;
}

.spot-candle-chart__tooltip-grid strong {
  color: #ffffff;
  font-size: 12px;
  text-align: right;
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

  .spot-candle-chart__tooltip {
    min-width: 164px;
    padding: 10px 12px;
  }
}
</style>
