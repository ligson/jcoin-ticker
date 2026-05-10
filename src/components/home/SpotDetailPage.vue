<script setup lang="ts">
import {computed, onMounted, ref, watch} from "vue";
import {useRoute, useRouter} from "vue-router";
import {ArrowLeftOutlined, ReloadOutlined} from "@ant-design/icons-vue";
import SpotCandleChart from "./SpotCandleChart.vue";
import SpotMetricTrendChart from "./SpotMetricTrendChart.vue";
import {
  fetchSpotCandles,
  getSpotCandleIntervalLabel,
  marketDataSourceLabelMap,
  SpotCandle,
  spotCandleIntervalOptions,
  SpotCandleInterval,
  summarizeSpotCandles
} from "./spotMarketDataSources.ts";
import {
  fetchSpotAssetMetricsSnapshot,
  fetchSpotMarketCapHistory,
  SpotAssetMetricHistoryInterval,
  SpotAssetMetricsSnapshot,
  SpotMetricPoint
} from "./spotAssetMetrics.ts";
import {ensureSpotTickerRuntime, runtimeCoinPrices, runtimeMarketDataSource} from "./spotTickerRuntime.ts";

const route = useRoute()
const router = useRouter()

const selectedInterval = ref<SpotCandleInterval>('1d')
const selectedMetricKind = ref<'market_cap' | 'volume' | 'quote_volume'>('market_cap')
const selectedMarketCapInterval = ref<SpotAssetMetricHistoryInterval>('30d')
const loading = ref(false)
const errorMessage = ref('')
const candles = ref<SpotCandle[]>([])
const refreshedAt = ref<number | null>(null)
const metricsLoading = ref(false)
const metricsErrorMessage = ref('')
const marketCapTrendLoading = ref(false)
const marketCapTrendErrorMessage = ref('')
const marketSnapshot = ref<SpotAssetMetricsSnapshot | null>(null)
const marketCapTrend = ref<SpotMetricPoint[]>([])

const marketCapIntervalOptions = [
  {label: '24H', value: '24h' as SpotAssetMetricHistoryInterval},
  {label: '7D', value: '7d' as SpotAssetMetricHistoryInterval},
  {label: '30D', value: '30d' as SpotAssetMetricHistoryInterval},
  {label: '90D', value: '90d' as SpotAssetMetricHistoryInterval},
  {label: '1Y', value: '1y' as SpotAssetMetricHistoryInterval}
]

const coin = computed(() => String(route.params.coin ?? '').toUpperCase())
const source = computed(() => runtimeMarketDataSource.value)
const sourceLabel = computed(() => marketDataSourceLabelMap[source.value])
const currentTicker = computed(() => runtimeCoinPrices.value.find((item) => item.coin === coin.value) ?? null)
const candleSummary = computed(() => summarizeSpotCandles(candles.value))
const intervalLabel = computed(() => getSpotCandleIntervalLabel(selectedInterval.value))
const intervalDescription = computed(() => selectedInterval.value === 'all' ? '全部（按月聚合）' : intervalLabel.value)
const headlinePrice = computed(() => {
  const runtimePrice = Number(currentTicker.value?.price ?? NaN)
  if (Number.isFinite(runtimePrice) && runtimePrice > 0) {
    return runtimePrice
  }
  return candleSummary.value?.close ?? 0
})
const trendIsPositive = computed(() => Number(currentTicker.value?.priceChangePercentage ?? candleSummary.value?.changePercentage ?? 0) >= 0)

const marketInfoCards = computed(() => {
  const ticker = currentTicker.value
  const summary = candleSummary.value
  const dayChange = ticker ? Number(ticker.priceChangePercentage) : null

  return [
    {
      label: '当前价格',
      value: formatPrice(headlinePrice.value),
      accent: trendIsPositive.value ? 'up' : 'down'
    },
    {
      label: '24 小时涨跌',
      value: dayChange === null ? '--' : formatSignedPercent(dayChange),
      accent: dayChange === null ? 'neutral' : (dayChange >= 0 ? 'up' : 'down')
    },
    {
      label: `${intervalLabel.value}区间涨跌`,
      value: summary ? formatSignedPercent(summary.changePercentage) : '--',
      accent: (summary?.changePercentage ?? 0) >= 0 ? 'up' : 'down'
    },
    {
      label: `${intervalLabel.value}振幅`,
      value: summary ? formatPercent(summary.amplitudePercentage) : '--',
      accent: 'neutral'
    }
  ]
})

const infoRows = computed(() => {
  const ticker = currentTicker.value
  const summary = candleSummary.value
  const snapshot = marketSnapshot.value

  return [
    {label: '交易对', value: `${coin.value} / USDT`},
    {label: '数据源', value: sourceLabel.value},
    {label: '流通市值', value: formatCompactNumber(snapshot?.marketCap ?? 0), metricKind: 'market_cap' as const},
    {label: '市值排名', value: snapshot?.rank ? `#${snapshot.rank}` : '--'},
    {label: '24h 成交量', value: formatCompactNumber(Number(ticker?.volume ?? 0)), metricKind: 'volume' as const},
    {label: '24h 成交额', value: formatCompactNumber(Number(ticker?.volumeInUSDT ?? 0)), metricKind: 'quote_volume' as const},
    {label: '24h 开盘价', value: formatPrice(Number(ticker?.open ?? 0))},
    {label: '24h 最高价', value: formatPrice(Number(ticker?.high ?? 0))},
    {label: '24h 最低价', value: formatPrice(Number(ticker?.low ?? 0))},
    {label: '流通量', value: formatCompactNumber(snapshot?.circulatingSupply ?? 0)},
    {label: `${intervalLabel.value}区间最高`, value: summary ? formatPrice(summary.high) : '--'},
    {label: `${intervalLabel.value}区间最低`, value: summary ? formatPrice(summary.low) : '--'},
    {label: `${intervalLabel.value}均价`, value: summary ? formatPrice(summary.averageClose) : '--'},
    {label: `${intervalLabel.value}成交量`, value: summary ? formatCompactNumber(summary.volume) : '--'},
    {label: `${intervalLabel.value}成交额`, value: summary ? formatCompactNumber(summary.quoteVolume) : '--'},
    {label: '最大供应量', value: formatCompactNumber(snapshot?.maxSupply ?? 0)}
  ]
})

const metricActionCards = computed(() => {
  const ticker = currentTicker.value
  const snapshot = marketSnapshot.value

  return [
    {
      key: 'market_cap' as const,
      label: '市值走势',
      value: formatCompactNumber(snapshot?.marketCap ?? 0),
      description: '来自公开市值数据'
    },
    {
      key: 'volume' as const,
      label: '成交量走势',
      value: formatCompactNumber(Number(ticker?.volume ?? 0)),
      description: '基于当前 K 线周期聚合'
    },
    {
      key: 'quote_volume' as const,
      label: '成交额走势',
      value: formatCompactNumber(Number(ticker?.volumeInUSDT ?? 0)),
      description: '基于当前 K 线周期聚合'
    }
  ]
})

const chartTitle = computed(() => selectedInterval.value === 'all'
    ? `${coin.value} / USDT 全部走势（月线聚合）`
    : `${coin.value} / USDT ${intervalLabel.value} K 线`
)
const headerTagLabel = computed(() => trendIsPositive.value ? '多头偏强' : '空头偏强')
const updateTimeLabel = computed(() => refreshedAt.value ? formatDateTime(refreshedAt.value) : '暂未更新')
const selectedMetricConfig = computed(() => {
  if (selectedMetricKind.value === 'market_cap') {
    return {
      title: `${coin.value} 市值走势`,
      subtitle: '按公开市值数据展示不同时间周期下的变化曲线。',
      accent: 'sky' as const
    }
  }

  if (selectedMetricKind.value === 'quote_volume') {
    return {
      title: `${coin.value} 成交额走势`,
      subtitle: `基于当前 ${intervalDescription.value} K 线数据，展示每个区间的 USDT 成交额变化。`,
      accent: 'amber' as const
    }
  }

  return {
    title: `${coin.value} 成交量走势`,
    subtitle: `基于当前 ${intervalDescription.value} K 线数据，展示每个区间的基础币成交量变化。`,
    accent: 'emerald' as const
  }
})
const selectedMetricPoints = computed(() => {
  if (selectedMetricKind.value === 'market_cap') {
    return marketCapTrend.value
  }

  return candles.value.map((item) => ({
    timestamp: item.openTime,
    value: selectedMetricKind.value === 'quote_volume' ? item.quoteVolume : item.volume
  }))
})
const selectedMetricValue = computed(() => {
  if (selectedMetricKind.value === 'market_cap') {
    return marketSnapshot.value?.marketCap ?? 0
  }
  if (selectedMetricKind.value === 'quote_volume') {
    return Number(currentTicker.value?.volumeInUSDT ?? 0)
  }
  return Number(currentTicker.value?.volume ?? 0)
})

async function loadCandles(forceRefresh = false) {
  if (!coin.value) {
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    candles.value = await fetchSpotCandles(source.value, coin.value, selectedInterval.value, forceRefresh)
    refreshedAt.value = Date.now()
  } catch (error: any) {
    errorMessage.value = error instanceof Error ? error.message : String(error)
  } finally {
    loading.value = false
  }
}

async function loadMarketSnapshot(forceRefresh = false) {
  if (!coin.value) {
    return
  }

  metricsLoading.value = true
  metricsErrorMessage.value = ''

  try {
    marketSnapshot.value = await fetchSpotAssetMetricsSnapshot(coin.value, forceRefresh)
  } catch (error: any) {
    metricsErrorMessage.value = error instanceof Error ? error.message : String(error)
    marketSnapshot.value = null
  } finally {
    metricsLoading.value = false
  }
}

async function loadMarketCapTrend(forceRefresh = false) {
  if (!coin.value || selectedMetricKind.value !== 'market_cap') {
    return
  }

  marketCapTrendLoading.value = true
  marketCapTrendErrorMessage.value = ''

  try {
    marketCapTrend.value = await fetchSpotMarketCapHistory(coin.value, selectedMarketCapInterval.value, forceRefresh)
  } catch (error: any) {
    marketCapTrendErrorMessage.value = error instanceof Error ? error.message : String(error)
    marketCapTrend.value = []
  } finally {
    marketCapTrendLoading.value = false
  }
}

function handleSelectMetric(metricKind: 'market_cap' | 'volume' | 'quote_volume') {
  selectedMetricKind.value = metricKind
}

function handleBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }
  void router.push('/home')
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

function formatPercent(value: number) {
  if (!Number.isFinite(value)) {
    return '--'
  }
  return `${value.toFixed(2)}%`
}

function formatSignedPercent(value: number) {
  if (!Number.isFinite(value)) {
    return '--'
  }
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
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

function formatDateTime(timestamp: number) {
  const date = new Date(timestamp)
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
}

watch([coin, selectedInterval, source], () => {
  void loadCandles(false)
}, {immediate: true})

watch(coin, () => {
  void loadMarketSnapshot(false)
  if (selectedMetricKind.value === 'market_cap') {
    void loadMarketCapTrend(false)
  }
}, {immediate: true})

watch([selectedMetricKind, selectedMarketCapInterval], () => {
  if (selectedMetricKind.value === 'market_cap') {
    void loadMarketCapTrend(false)
  }
})

onMounted(() => {
  void ensureSpotTickerRuntime()
})
</script>

<template>
  <div class="spot-detail-page">
    <section class="spot-detail-page__hero">
      <div class="spot-detail-page__hero-main">
        <a-button class="spot-detail-page__back-button" type="text" @click="handleBack">
          <template #icon>
            <ArrowLeftOutlined />
          </template>
          返回主页
        </a-button>

        <div class="spot-detail-page__headline">
          <div class="spot-detail-page__headline-top">
            <span class="spot-detail-page__source-pill">{{ sourceLabel }}</span>
            <span class="spot-detail-page__source-pill spot-detail-page__source-pill--muted">{{ headerTagLabel }}</span>
          </div>
          <h1>{{ coin }} / USDT</h1>
          <p>实时行情复用首页后台连接，详情页单独拉取常见周期 K 线，并补充市值、成交量和成交额的扩展走势。</p>
        </div>
      </div>

      <div class="spot-detail-page__hero-stats">
        <article
            v-for="card in marketInfoCards"
            :key="card.label"
            class="spot-detail-page__hero-card"
            :class="`spot-detail-page__hero-card--${card.accent}`"
        >
          <span>{{ card.label }}</span>
          <strong>{{ card.value }}</strong>
        </article>
      </div>
    </section>

    <section class="spot-detail-page__content">
      <div class="spot-detail-page__chart-column">
        <div class="spot-detail-page__chart-panel">
          <div class="spot-detail-page__chart-toolbar">
            <div class="spot-detail-page__price-block">
              <span class="spot-detail-page__eyebrow">最新价</span>
              <strong>{{ formatPrice(headlinePrice) }}</strong>
            </div>

            <div class="spot-detail-page__intervals">
              <a-segmented
                  v-model:value="selectedInterval"
                  :options="spotCandleIntervalOptions"
              />
              <a-button :loading="loading" @click="loadCandles(true)">
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
              class="spot-detail-page__alert"
          />

          <a-spin :spinning="loading">
            <SpotCandleChart
                :candles="candles"
                :title="chartTitle"
                :coin="coin"
            />
          </a-spin>

          <div class="spot-detail-page__footer-meta">
            <span>最近刷新：{{ updateTimeLabel }}</span>
            <span>展示周期：{{ intervalDescription }}</span>
          </div>
        </div>

        <div class="spot-detail-page__metric-panel">
          <div class="spot-detail-page__metric-header">
            <div>
              <span class="spot-detail-page__eyebrow">扩展指标</span>
              <h2>点一下，就能看走势</h2>
            </div>
            <a-button
                v-if="selectedMetricKind === 'market_cap'"
                :loading="marketCapTrendLoading || metricsLoading"
                @click="loadMarketSnapshot(true); loadMarketCapTrend(true)"
            >
              <template #icon>
                <ReloadOutlined />
              </template>
              刷新指标
            </a-button>
          </div>

          <div class="spot-detail-page__metric-card-grid">
            <button
                v-for="card in metricActionCards"
                :key="card.key"
                type="button"
                class="spot-detail-page__metric-card"
                :class="{'spot-detail-page__metric-card--active': selectedMetricKind === card.key}"
                @click="handleSelectMetric(card.key)"
            >
              <span>{{ card.label }}</span>
              <strong>{{ card.value }}</strong>
              <small>{{ card.description }}</small>
            </button>
          </div>

          <div class="spot-detail-page__metric-toolbar">
            <span class="spot-detail-page__metric-toolbar-note">
              当前指标：{{ selectedMetricConfig.title }}
            </span>

            <a-segmented
                v-if="selectedMetricKind === 'market_cap'"
                v-model:value="selectedMarketCapInterval"
                :options="marketCapIntervalOptions"
            />
          </div>

          <a-alert
              v-if="metricsErrorMessage"
              :message="metricsErrorMessage"
              type="warning"
              show-icon
              class="spot-detail-page__alert"
          />

          <a-alert
              v-if="marketCapTrendErrorMessage"
              :message="marketCapTrendErrorMessage"
              type="warning"
              show-icon
              class="spot-detail-page__alert"
          />

          <a-spin :spinning="marketCapTrendLoading || metricsLoading">
            <SpotMetricTrendChart
                :coin="coin"
                :title="selectedMetricConfig.title"
                :subtitle="selectedMetricConfig.subtitle"
                :points="selectedMetricPoints"
                :accent="selectedMetricConfig.accent"
            />
          </a-spin>

          <div class="spot-detail-page__footer-meta">
            <span>当前值：{{ formatCompactNumber(selectedMetricValue) }}</span>
            <span v-if="selectedMetricKind === 'market_cap'">
              观察区间：{{ selectedMarketCapInterval.toUpperCase() }}
            </span>
            <span v-else>
              量能曲线跟随上方 K 线周期切换
            </span>
          </div>
        </div>
      </div>

      <div class="spot-detail-page__info-panel">
        <div class="spot-detail-page__info-header">
          <div>
            <span class="spot-detail-page__eyebrow">市场摘要</span>
            <h2>这个币当前最常看的信息</h2>
          </div>
        </div>

        <div class="spot-detail-page__info-grid">
          <article
              v-for="item in infoRows"
              :key="item.label"
              class="spot-detail-page__info-card"
              :class="{'spot-detail-page__info-card--interactive': item.metricKind}"
              @click="item.metricKind ? handleSelectMetric(item.metricKind) : undefined"
          >
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
            <small v-if="item.metricKind">点击查看走势</small>
          </article>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.spot-detail-page {
  min-height: 100%;
  padding: 28px;
  background:
      radial-gradient(circle at top left, rgba(14, 165, 233, 0.14), transparent 26%),
      radial-gradient(circle at top right, rgba(16, 185, 129, 0.12), transparent 24%),
      linear-gradient(180deg, #f8fbff 0%, #eef4fb 52%, #f8fafc 100%);
}

.spot-detail-page__hero {
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(320px, 0.95fr);
  gap: 22px;
  margin-bottom: 22px;
  padding: 28px;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 30px;
  background:
      linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(15, 118, 110, 0.88));
  box-shadow: 0 26px 70px rgba(15, 23, 42, 0.14);
}

.spot-detail-page__hero-main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.spot-detail-page__back-button {
  width: fit-content;
  color: rgba(241, 245, 249, 0.92);
}

.spot-detail-page__back-button:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
}

.spot-detail-page__headline-top {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
}

.spot-detail-page__source-pill {
  padding: 8px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  color: #f8fafc;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.spot-detail-page__source-pill--muted {
  background: rgba(15, 23, 42, 0.2);
}

.spot-detail-page__headline h1 {
  margin-bottom: 10px;
  color: #f8fafc;
  font-size: 44px;
  line-height: 1;
  letter-spacing: -0.04em;
}

.spot-detail-page__headline p {
  max-width: 640px;
  color: rgba(226, 232, 240, 0.84);
  font-size: 15px;
}

.spot-detail-page__hero-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.spot-detail-page__hero-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 18px 20px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  backdrop-filter: blur(14px);
}

.spot-detail-page__hero-card span {
  font-size: 13px;
  color: rgba(226, 232, 240, 0.82);
}

.spot-detail-page__hero-card strong {
  font-size: 28px;
  line-height: 1.05;
}

.spot-detail-page__hero-card--up strong {
  color: #86efac;
}

.spot-detail-page__hero-card--down strong {
  color: #fda4af;
}

.spot-detail-page__hero-card--neutral strong {
  color: #f8fafc;
}

.spot-detail-page__content {
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(320px, 1fr);
  gap: 22px;
}

.spot-detail-page__chart-column {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.spot-detail-page__chart-panel,
.spot-detail-page__metric-panel,
.spot-detail-page__info-panel {
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 22px 56px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(10px);
}

.spot-detail-page__chart-toolbar,
.spot-detail-page__metric-header,
.spot-detail-page__metric-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.spot-detail-page__price-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.spot-detail-page__price-block strong {
  color: #0f172a;
  font-size: 34px;
  line-height: 1;
}

.spot-detail-page__intervals {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.spot-detail-page__alert {
  margin-bottom: 16px;
}

.spot-detail-page__footer-meta {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  color: rgba(71, 85, 105, 0.82);
  font-size: 13px;
}

.spot-detail-page__metric-header h2,
.spot-detail-page__info-header h2 {
  margin-top: 8px;
  color: #0f172a;
  font-size: 28px;
  line-height: 1.1;
}

.spot-detail-page__metric-card-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.spot-detail-page__metric-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px;
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 22px;
  background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.84));
  text-align: left;
  transition:
      border-color 0.2s ease,
      transform 0.2s ease,
      box-shadow 0.2s ease;
  cursor: pointer;
}

.spot-detail-page__metric-card:hover,
.spot-detail-page__metric-card--active {
  border-color: rgba(14, 165, 233, 0.24);
  transform: translateY(-1px);
  box-shadow: 0 16px 36px rgba(14, 165, 233, 0.1);
}

.spot-detail-page__metric-card span {
  color: rgba(71, 85, 105, 0.82);
  font-size: 13px;
}

.spot-detail-page__metric-card strong {
  color: #0f172a;
  font-size: 24px;
  line-height: 1.05;
}

.spot-detail-page__metric-card small,
.spot-detail-page__metric-toolbar-note {
  color: rgba(71, 85, 105, 0.74);
  font-size: 12px;
}

.spot-detail-page__metric-toolbar {
  flex-wrap: wrap;
}

.spot-detail-page__info-header {
  margin-bottom: 20px;
}

.spot-detail-page__eyebrow {
  color: rgba(71, 85, 105, 0.75);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.spot-detail-page__info-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.spot-detail-page__info-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 18px 20px;
  border: 1px solid rgba(226, 232, 240, 0.96);
  border-radius: 22px;
  background:
      linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.84));
}

.spot-detail-page__info-card--interactive {
  cursor: pointer;
  transition:
      border-color 0.2s ease,
      transform 0.2s ease,
      box-shadow 0.2s ease;
}

.spot-detail-page__info-card--interactive:hover {
  border-color: rgba(14, 165, 233, 0.24);
  transform: translateY(-1px);
  box-shadow: 0 16px 36px rgba(14, 165, 233, 0.08);
}

.spot-detail-page__info-card span {
  color: rgba(71, 85, 105, 0.86);
  font-size: 13px;
}

.spot-detail-page__info-card strong {
  color: #0f172a;
  font-size: 18px;
  line-height: 1.25;
}

.spot-detail-page__info-card small {
  color: rgba(71, 85, 105, 0.72);
  font-size: 12px;
}

@media (max-width: 1100px) {
  .spot-detail-page__hero,
  .spot-detail-page__content {
    grid-template-columns: 1fr;
  }

  .spot-detail-page__metric-card-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .spot-detail-page {
    padding: 16px;
  }

  .spot-detail-page__hero,
  .spot-detail-page__chart-panel,
  .spot-detail-page__metric-panel,
  .spot-detail-page__info-panel {
    padding: 18px;
    border-radius: 24px;
  }

  .spot-detail-page__headline h1 {
    font-size: 34px;
  }

  .spot-detail-page__hero-stats,
  .spot-detail-page__info-grid {
    grid-template-columns: 1fr;
  }

  .spot-detail-page__chart-toolbar,
  .spot-detail-page__metric-header,
  .spot-detail-page__metric-toolbar,
  .spot-detail-page__footer-meta {
    flex-direction: column;
    align-items: flex-start;
  }

  .spot-detail-page__intervals {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
