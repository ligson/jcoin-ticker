<script setup lang="ts">
import {computed, ref} from "vue";
import {SpotMetricPoint} from "./spotAssetMetrics.ts";

const props = defineProps<{
  coin: string;
  title: string;
  subtitle?: string;
  points: SpotMetricPoint[];
  accent?: 'sky' | 'emerald' | 'amber';
  valueMode?: 'compact' | 'score';
  fixedMin?: number;
  fixedMax?: number;
  lastValueLabel?: string;
}>()

const viewBoxWidth = 960
const viewBoxHeight = 320
const chartPadding = {
  top: 22,
  right: 96,
  bottom: 36,
  left: 72
}

const plotWidth = viewBoxWidth - chartPadding.left - chartPadding.right
const plotHeight = viewBoxHeight - chartPadding.top - chartPadding.bottom
const hoveredIndex = ref<number | null>(null)

const normalizedPoints = computed(() => {
  return [...props.points]
      .filter((item) => Number.isFinite(item.timestamp) && Number.isFinite(item.value))
      .sort((first, second) => first.timestamp - second.timestamp)
})

const valueRange = computed(() => {
  if (Number.isFinite(props.fixedMin) && Number.isFinite(props.fixedMax) && Number(props.fixedMax) > Number(props.fixedMin)) {
    return {
      min: Number(props.fixedMin),
      max: Number(props.fixedMax)
    }
  }

  const values = normalizedPoints.value.map((item) => item.value)
  const maxValue = values.length > 0 ? Math.max(...values) : 0
  const minValue = values.length > 0 ? Math.min(...values) : 0
  const spread = maxValue - minValue || maxValue * 0.06 || 1
  const padding = spread * 0.14

  return {
    min: Math.max(0, minValue - padding),
    max: maxValue + padding
  }
})

const scaleY = (value: number) => {
  const {min, max} = valueRange.value
  if (max <= min) {
    return chartPadding.top + (plotHeight / 2)
  }
  const ratio = (value - min) / (max - min)
  return chartPadding.top + plotHeight - (ratio * plotHeight)
}

const chartItems = computed(() => {
  const points = normalizedPoints.value
  if (points.length === 0) {
    return []
  }

  const step = plotWidth / Math.max(points.length - 1, 1)
  return points.map((point, index) => ({
    ...point,
    x: chartPadding.left + (step * index),
    y: scaleY(point.value)
  }))
})

const linePath = computed(() => {
  return chartItems.value
      .map((item, index) => `${index === 0 ? 'M' : 'L'} ${item.x} ${item.y}`)
      .join(' ')
})

const areaPath = computed(() => {
  if (chartItems.value.length === 0) {
    return ''
  }

  const first = chartItems.value[0]
  const last = chartItems.value[chartItems.value.length - 1]
  return `${linePath.value} L ${last.x} ${chartPadding.top + plotHeight} L ${first.x} ${chartPadding.top + plotHeight} Z`
})

const gridLines = computed(() => {
  return Array.from({length: 5}, (_, index) => {
    const y = chartPadding.top + ((plotHeight / 4) * index)
    const value = valueRange.value.max - (((valueRange.value.max - valueRange.value.min) / 4) * index)
    return {y, value}
  })
})

const timeRangeMs = computed(() => {
  const points = normalizedPoints.value
  if (points.length < 2) {
    return 0
  }
  return points[points.length - 1].timestamp - points[0].timestamp
})

const xAxisLabels = computed(() => {
  const points = normalizedPoints.value
  if (points.length === 0) {
    return []
  }

  const indices = Array.from(new Set([
    0,
    Math.max(0, Math.floor((points.length - 1) / 2)),
    points.length - 1
  ]))

  return indices.map((index) => {
    const point = points[index]
    const x = chartPadding.left + (plotWidth * (points.length === 1 ? 0 : (index / (points.length - 1))))
    return {
      x,
      label: formatAxisTime(point.timestamp)
    }
  })
})

const lastPoint = computed(() => {
  return chartItems.value.length > 0 ? chartItems.value[chartItems.value.length - 1] : null
})

const lastValueLabel = computed(() => {
  if (props.lastValueLabel) {
    return props.lastValueLabel
  }
  if (!lastPoint.value) {
    return ''
  }
  return formatValue(lastPoint.value.value)
})

const accentClass = computed(() => `spot-metric-trend-chart--${props.accent ?? 'sky'}`)
const hoveredPoint = computed(() => {
  if (hoveredIndex.value === null) {
    return null
  }
  return chartItems.value[hoveredIndex.value] ?? null
})
const activePoint = computed(() => hoveredPoint.value ?? lastPoint.value)
const activeValueLabel = computed(() => {
  if (!activePoint.value) {
    return ''
  }
  return formatValue(activePoint.value.value)
})
const tooltipClass = computed(() => {
  if (!hoveredPoint.value) {
    return ''
  }
  return hoveredPoint.value.x > (viewBoxWidth * 0.7)
      ? 'spot-metric-trend-chart__tooltip--left'
      : 'spot-metric-trend-chart__tooltip--right'
})
const tooltipStyle = computed(() => {
  if (!hoveredPoint.value) {
    return {}
  }
  return {
    left: `${(hoveredPoint.value.x / viewBoxWidth) * 100}%`,
    top: `${(Math.max(chartPadding.top + 10, hoveredPoint.value.y - 8) / viewBoxHeight) * 100}%`
  }
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

function formatCompactNumber(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return '--'
  }
  if (value >= 1_000_000_000_000) {
    return `${(value / 1_000_000_000_000).toFixed(2)}T`
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

function formatScore(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return '--'
  }
  return `${Math.round(value)}`
}

function formatValue(value: number) {
  return props.valueMode === 'score'
      ? formatScore(value)
      : formatCompactNumber(value)
}

function formatAxisTime(timestamp: number) {
  const date = new Date(timestamp)
  const year = date.getUTCFullYear()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
  const day = `${date.getUTCDate()}`.padStart(2, '0')
  const hour = `${date.getUTCHours()}`.padStart(2, '0')

  if (timeRangeMs.value >= 60 * 24 * 60 * 60 * 1000) {
    return `${year}-${month}`
  }

  if (timeRangeMs.value >= 2 * 24 * 60 * 60 * 1000) {
    return `${month}-${day}`
  }

  return `${month}-${day} ${hour}:00`
}

function formatTooltipTime(timestamp: number) {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')} ${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`
}
</script>

<template>
  <div class="spot-metric-trend-chart" :class="accentClass">
    <div class="spot-metric-trend-chart__header">
      <div>
        <div class="spot-metric-trend-chart__eyebrow">{{ coin }}</div>
        <h3 class="spot-metric-trend-chart__title">{{ title }}</h3>
        <p v-if="subtitle" class="spot-metric-trend-chart__subtitle">{{ subtitle }}</p>
      </div>
      <div v-if="lastPoint" class="spot-metric-trend-chart__last-value">
        <span>最新值</span>
        <strong>{{ activeValueLabel || lastValueLabel }}</strong>
      </div>
    </div>

    <div
        v-if="chartItems.length > 0"
        class="spot-metric-trend-chart__canvas"
        @mousemove="handlePointerMove"
        @mouseleave="handlePointerLeave"
    >
      <svg
          :viewBox="`0 0 ${viewBoxWidth} ${viewBoxHeight}`"
          class="spot-metric-trend-chart__svg"
          preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="spotMetricAreaGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stop-color="currentColor" stop-opacity="0.28" />
            <stop offset="100%" stop-color="currentColor" stop-opacity="0.02" />
          </linearGradient>
        </defs>

        <line
            v-for="line in gridLines"
            :key="line.y"
            :x1="chartPadding.left"
            :x2="viewBoxWidth - chartPadding.right"
            :y1="line.y"
            :y2="line.y"
            class="spot-metric-trend-chart__grid-line"
        />

        <text
            v-for="line in gridLines"
            :key="`label-${line.y}`"
            :x="chartPadding.left - 14"
            :y="line.y + 4"
            class="spot-metric-trend-chart__axis-label"
        >
          {{ formatValue(line.value) }}
        </text>

        <path :d="areaPath" class="spot-metric-trend-chart__area" />
        <path :d="linePath" class="spot-metric-trend-chart__line" />

        <circle
            v-if="activePoint"
            :cx="activePoint.x"
            :cy="activePoint.y"
            r="5.5"
            class="spot-metric-trend-chart__point"
        />

        <template v-if="activePoint">
          <line
              :x1="chartPadding.left"
              :x2="viewBoxWidth - chartPadding.right"
              :y1="activePoint.y"
              :y2="activePoint.y"
              class="spot-metric-trend-chart__last-line"
          />
          <rect
              :x="viewBoxWidth - chartPadding.right + 12"
              :y="activePoint.y - 13"
              width="74"
              height="26"
              rx="13"
              class="spot-metric-trend-chart__last-badge"
          />
          <text
              :x="viewBoxWidth - chartPadding.right + 49"
              :y="activePoint.y + 5"
              text-anchor="middle"
              class="spot-metric-trend-chart__last-badge-text"
          >
            {{ activeValueLabel || lastValueLabel }}
          </text>
        </template>

        <template v-if="hoveredPoint">
          <line
              :x1="hoveredPoint.x"
              :x2="hoveredPoint.x"
              :y1="chartPadding.top"
              :y2="chartPadding.top + plotHeight"
              class="spot-metric-trend-chart__crosshair-line"
          />
          <line
              :x1="chartPadding.left"
              :x2="viewBoxWidth - chartPadding.right"
              :y1="hoveredPoint.y"
              :y2="hoveredPoint.y"
              class="spot-metric-trend-chart__crosshair-line spot-metric-trend-chart__crosshair-line--horizontal"
          />
        </template>

        <text
            v-for="label in xAxisLabels"
            :key="`time-${label.x}`"
            :x="label.x"
            :y="viewBoxHeight - 8"
            text-anchor="middle"
            class="spot-metric-trend-chart__axis-label"
        >
          {{ label.label }}
        </text>
      </svg>

      <div
          v-if="hoveredPoint"
          class="spot-metric-trend-chart__tooltip"
          :class="tooltipClass"
          :style="tooltipStyle"
      >
        <div class="spot-metric-trend-chart__tooltip-time">{{ formatTooltipTime(hoveredPoint.timestamp) }}</div>
        <div class="spot-metric-trend-chart__tooltip-grid">
          <span>数值</span>
          <strong>{{ formatValue(hoveredPoint.value) }}</strong>
        </div>
      </div>
    </div>

    <div v-else class="spot-metric-trend-chart__empty">
      暂无可展示的指标走势数据。
    </div>
  </div>
</template>

<style scoped>
.spot-metric-trend-chart {
  color: #0ea5e9;
}

.spot-metric-trend-chart--emerald {
  color: #10b981;
}

.spot-metric-trend-chart--amber {
  color: #f59e0b;
}

.spot-metric-trend-chart__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 12px;
}

.spot-metric-trend-chart__eyebrow {
  color: rgba(71, 85, 105, 0.72);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.spot-metric-trend-chart__title {
  margin: 6px 0 0;
  color: #0f172a;
  font-size: 24px;
  line-height: 1.1;
}

.spot-metric-trend-chart__subtitle {
  margin: 8px 0 0;
  color: rgba(71, 85, 105, 0.8);
  font-size: 13px;
}

.spot-metric-trend-chart__last-value {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.spot-metric-trend-chart__last-value span {
  color: rgba(71, 85, 105, 0.72);
  font-size: 12px;
}

.spot-metric-trend-chart__last-value strong {
  color: #0f172a;
  font-size: 24px;
  line-height: 1;
}

.spot-metric-trend-chart__canvas {
  position: relative;
  height: 300px;
}

.spot-metric-trend-chart__svg {
  width: 100%;
  height: 100%;
}

.spot-metric-trend-chart__grid-line {
  stroke: rgba(148, 163, 184, 0.22);
  stroke-width: 1;
  stroke-dasharray: 4 6;
}

.spot-metric-trend-chart__axis-label {
  fill: rgba(100, 116, 139, 0.92);
  font-size: 11px;
}

.spot-metric-trend-chart__area {
  fill: url(#spotMetricAreaGradient);
}

.spot-metric-trend-chart__line {
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.spot-metric-trend-chart__point {
  fill: #ffffff;
  stroke: currentColor;
  stroke-width: 3;
}

.spot-metric-trend-chart__crosshair-line {
  stroke: rgba(15, 23, 42, 0.14);
  stroke-width: 1.2;
  stroke-dasharray: 4 5;
}

.spot-metric-trend-chart__crosshair-line--horizontal {
  stroke: currentColor;
  opacity: 0.4;
}

.spot-metric-trend-chart__last-line {
  stroke: currentColor;
  stroke-width: 1.2;
  stroke-dasharray: 5 6;
  opacity: 0.5;
}

.spot-metric-trend-chart__last-badge {
  fill: currentColor;
}

.spot-metric-trend-chart__last-badge-text {
  fill: #ffffff;
  font-size: 11px;
  font-weight: 700;
}

.spot-metric-trend-chart__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 240px;
  border: 1px dashed rgba(148, 163, 184, 0.34);
  border-radius: 24px;
  color: rgba(71, 85, 105, 0.86);
  background: rgba(248, 250, 252, 0.82);
}

.spot-metric-trend-chart__tooltip {
  position: absolute;
  min-width: 148px;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 18px;
  background: rgba(15, 23, 42, 0.92);
  color: #f8fafc;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.18);
  pointer-events: none;
  transform: translate(-50%, calc(-100% - 12px));
}

.spot-metric-trend-chart__tooltip--left {
  transform: translate(calc(-100% - 14px), calc(-100% - 12px));
}

.spot-metric-trend-chart__tooltip--right {
  transform: translate(14px, calc(-100% - 12px));
}

.spot-metric-trend-chart__tooltip-time {
  margin-bottom: 10px;
  color: rgba(226, 232, 240, 0.82);
  font-size: 11px;
}

.spot-metric-trend-chart__tooltip-grid {
  display: grid;
  grid-template-columns: auto auto;
  gap: 6px 12px;
  align-items: center;
}

.spot-metric-trend-chart__tooltip-grid span {
  color: rgba(203, 213, 225, 0.82);
  font-size: 11px;
}

.spot-metric-trend-chart__tooltip-grid strong {
  color: #ffffff;
  font-size: 12px;
  text-align: right;
}
</style>
