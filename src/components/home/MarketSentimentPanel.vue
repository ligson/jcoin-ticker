<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import {ReloadOutlined} from "@ant-design/icons-vue";
import SpotMetricTrendChart from "./SpotMetricTrendChart.vue";
import {
  fetchMarketSentimentHistory,
  MarketSentimentPoint,
  MarketSentimentRange,
  resolveMarketSentimentAccent,
  sliceMarketSentimentHistory
} from "./marketSentiment.ts";

const loading = ref(false)
const errorMessage = ref('')
const selectedRange = ref<MarketSentimentRange>('30d')
const historyPoints = ref<MarketSentimentPoint[]>([])
const rangeOptions = [
  {label: '7D', value: '7d' as MarketSentimentRange},
  {label: '30D', value: '30d' as MarketSentimentRange},
  {label: '90D', value: '90d' as MarketSentimentRange},
  {label: '1Y', value: '1y' as MarketSentimentRange},
  {label: 'MAX', value: 'max' as MarketSentimentRange}
]

const currentPoint = computed(() => {
  return historyPoints.value.length > 0 ? historyPoints.value[historyPoints.value.length - 1] : null
})

const selectedPoints = computed(() => {
  return sliceMarketSentimentHistory(historyPoints.value, selectedRange.value)
})

const accent = computed(() => resolveMarketSentimentAccent(currentPoint.value?.value ?? 50))

const subtitle = computed(() => {
  const point = currentPoint.value
  if (!point) {
    return '公开市场情绪数据，默认展示最近一段时间的日度变化。'
  }
  return `当前状态：${point.classification}。这个指数反映的是整体加密市场的情绪，不是单个币的独立指标。`
})

const scoreLabel = computed(() => {
  const point = currentPoint.value
  if (!point) {
    return '--'
  }
  return `${Math.round(point.value)}`
})

const classificationLabel = computed(() => {
  return currentPoint.value?.classification || '暂无'
})

const updateTimeLabel = computed(() => {
  const point = currentPoint.value
  if (!point) {
    return '暂无'
  }
  return new Date(point.timestamp).toLocaleDateString()
})

async function loadSentiment(forceRefresh = false) {
  loading.value = true
  errorMessage.value = ''

  try {
    historyPoints.value = await fetchMarketSentimentHistory(forceRefresh)
  } catch (error: any) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
    historyPoints.value = []
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadSentiment(false)
})
</script>

<template>
  <section class="market-sentiment-panel">
    <div class="market-sentiment-panel__header">
      <div>
        <span class="market-sentiment-panel__eyebrow">全局市场</span>
        <h2>情绪指数</h2>
        <p>{{ subtitle }}</p>
      </div>

      <div class="market-sentiment-panel__summary">
        <span class="market-sentiment-panel__summary-label">当前分数</span>
        <strong>{{ scoreLabel }}</strong>
        <span class="market-sentiment-panel__summary-state" :class="`market-sentiment-panel__summary-state--${accent}`">
          {{ classificationLabel }}
        </span>
      </div>
    </div>

    <div class="market-sentiment-panel__toolbar">
      <div class="market-sentiment-panel__meta">
        <span>最近数据日期：{{ updateTimeLabel }}</span>
        <span>数据来源：Alternative.me</span>
      </div>

      <div class="market-sentiment-panel__actions">
        <a-segmented
            v-model:value="selectedRange"
            :options="rangeOptions"
        />
        <a-button :loading="loading" @click="loadSentiment(true)">
          <template #icon>
            <ReloadOutlined />
          </template>
          刷新
        </a-button>
      </div>
    </div>

    <a-alert
        v-if="errorMessage"
        :message="errorMessage"
        type="warning"
        show-icon
        class="market-sentiment-panel__alert"
    />

    <a-spin :spinning="loading">
      <SpotMetricTrendChart
          coin="市场情绪"
          title="加密市场情绪曲线"
          :subtitle="`当前观察区间：${selectedRange.toUpperCase()}。数值范围 0 到 100，越低代表越恐惧，越高代表越贪婪。`"
          :points="selectedPoints"
          :accent="accent"
          value-mode="score"
          :fixed-min="0"
          :fixed-max="100"
          :last-value-label="scoreLabel"
      />
    </a-spin>
  </section>
</template>

<style scoped>
.market-sentiment-panel {
  margin-bottom: 22px;
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  background:
      radial-gradient(circle at top left, rgba(14, 165, 233, 0.1), transparent 22%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 250, 252, 0.86));
  box-shadow: 0 22px 56px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(10px);
}

.market-sentiment-panel__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 18px;
}

.market-sentiment-panel__eyebrow {
  color: rgba(71, 85, 105, 0.75);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.market-sentiment-panel h2 {
  margin: 8px 0 10px;
  color: #0f172a;
  font-size: 32px;
  line-height: 1.05;
}

.market-sentiment-panel p {
  max-width: 720px;
  color: rgba(71, 85, 105, 0.82);
  font-size: 14px;
}

.market-sentiment-panel__summary {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
  min-width: 160px;
}

.market-sentiment-panel__summary-label {
  color: rgba(71, 85, 105, 0.72);
  font-size: 12px;
}

.market-sentiment-panel__summary strong {
  color: #0f172a;
  font-size: 44px;
  line-height: 1;
}

.market-sentiment-panel__summary-state {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.market-sentiment-panel__summary-state--emerald {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.market-sentiment-panel__summary-state--amber {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.market-sentiment-panel__summary-state--sky {
  background: rgba(14, 165, 233, 0.12);
  color: #0369a1;
}

.market-sentiment-panel__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
}

.market-sentiment-panel__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  color: rgba(71, 85, 105, 0.78);
  font-size: 13px;
}

.market-sentiment-panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: flex-end;
}

.market-sentiment-panel__alert {
  margin-bottom: 16px;
}

@media (max-width: 768px) {
  .market-sentiment-panel {
    padding: 18px;
    border-radius: 24px;
  }

  .market-sentiment-panel__header,
  .market-sentiment-panel__toolbar {
    flex-direction: column;
    align-items: flex-start;
  }

  .market-sentiment-panel__summary {
    align-items: flex-start;
  }

  .market-sentiment-panel__actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
