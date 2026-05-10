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
const dayChangePercent = computed(() => Number(currentTicker.value?.priceChangePercentage ?? candleSummary.value?.changePercentage ?? 0))
const heroTrendLabel = computed(() => trendIsPositive.value ? '结构偏强' : '结构承压')
const heroTrendDescription = computed(() => trendIsPositive.value
    ? '先看区间位置，再看振幅与成交量是否继续确认。'
    : '先看回撤结构，再看低点支撑与成交量是否出现修复。'
)
const headlinePriceLabel = computed(() => formatPrice(headlinePrice.value))
const dayChangeLabel = computed(() => formatSignedPercent(dayChangePercent.value))

const marketInfoCards = computed(() => {
  const ticker = currentTicker.value
  const summary = candleSummary.value

  return [
    {
      label: '24H 最高价',
      value: formatPrice(Number(ticker?.high ?? 0)),
      accent: 'neutral'
    },
    {
      label: '24H 最低价',
      value: formatPrice(Number(ticker?.low ?? 0)),
      accent: 'neutral'
    },
    {
      label: `${intervalLabel.value}涨跌`,
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
    {label: '24H 成交量', value: formatCompactNumber(Number(ticker?.volume ?? 0)), metricKind: 'volume' as const},
    {label: '24H 成交额', value: formatCompactNumber(Number(ticker?.volumeInUSDT ?? 0)), metricKind: 'quote_volume' as const},
    {label: '24H 开盘价', value: formatPrice(Number(ticker?.open ?? 0))},
    {label: '24H 最高价', value: formatPrice(Number(ticker?.high ?? 0))},
    {label: '24H 最低价', value: formatPrice(Number(ticker?.low ?? 0))},
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
const summaryInfoCards = computed(() => {
  const ticker = currentTicker.value
  const snapshot = marketSnapshot.value

  return [
    {
      key: 'market_cap' as const,
      label: '流通市值',
      value: formatCompactNumber(snapshot?.marketCap ?? 0),
      detail: snapshot?.rank ? `排名 #${snapshot.rank}` : '公开指标快照'
    },
    {
      key: 'volume' as const,
      label: '24H 成交量',
      value: formatCompactNumber(Number(ticker?.volume ?? 0)),
      detail: '点击切到成交量曲线'
    },
    {
      key: 'quote_volume' as const,
      label: '24H 成交额',
      value: formatCompactNumber(Number(ticker?.volumeInUSDT ?? 0)),
      detail: '点击切到成交额曲线'
    }
  ]
})
const detailInfoRows = computed(() => {
  const hiddenLabels = new Set(['流通市值', '市值排名', '24H 成交量', '24H 成交额'])
  return infoRows.value.filter((item) => !hiddenLabels.has(item.label))
})
const heroMetaCards = computed(() => {
  return [
    {
      label: '数据源',
      value: sourceLabel.value,
      note: '实时行情口径'
    },
    {
      label: '观察周期',
      value: intervalDescription.value,
      note: '主图与成交统计口径'
    },
    {
      label: '最近刷新',
      value: updateTimeLabel.value,
      note: '本次 K 线更新时间'
    }
  ]
})

const chartTitle = computed(() => selectedInterval.value === 'all'
    ? `${coin.value} / USDT 全部走势（月线聚合）`
    : `${coin.value} / USDT ${intervalLabel.value} K 线`
)
const headerTagLabel = computed(() => trendIsPositive.value ? '方向偏多' : '方向偏空')
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
const selectedMetricValueLabel = computed(() => formatCompactNumber(selectedMetricValue.value))
const candleChartRenderKey = computed(() => {
  const lastCandle = candles.value[candles.value.length - 1]
  return `${coin.value}-${selectedInterval.value}-${candles.value.length}-${lastCandle?.closeTime ?? 0}`
})
const metricChartRenderKey = computed(() => {
  const lastPoint = selectedMetricPoints.value[selectedMetricPoints.value.length - 1]
  return `${coin.value}-${selectedMetricKind.value}-${selectedMarketCapInterval.value}-${selectedMetricPoints.value.length}-${lastPoint?.timestamp ?? 0}`
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
            <span class="spot-detail-page__source-pill spot-detail-page__source-pill--soft">{{ heroTrendLabel }}</span>
          </div>
          <h1>{{ coin }} / USDT</h1>
          <p>实时行情复用首页后台连接，详情页单独拉取常见周期 K 线，并补充市值、成交量和成交额走势。</p>

          <div class="spot-detail-page__hero-price-row">
            <div class="spot-detail-page__hero-price-block">
              <span class="spot-detail-page__eyebrow spot-detail-page__eyebrow--hero">最新价格</span>
              <strong>{{ headlinePriceLabel }}</strong>
            </div>

            <div
                class="spot-detail-page__hero-change-pill"
                :class="trendIsPositive ? 'spot-detail-page__hero-change-pill--up' : 'spot-detail-page__hero-change-pill--down'"
            >
              <span>24H 涨跌</span>
              <strong>{{ dayChangeLabel }}</strong>
            </div>
          </div>

          <div class="spot-detail-page__hero-meta-grid">
            <article
                v-for="item in heroMetaCards"
                :key="item.label"
                class="spot-detail-page__hero-meta-card"
            >
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
              <small>{{ item.note }}</small>
            </article>
          </div>
        </div>
      </div>

      <div class="spot-detail-page__hero-side">
        <div class="spot-detail-page__hero-side-header">
          <span class="spot-detail-page__eyebrow spot-detail-page__eyebrow--hero">关键观察</span>
          <p>{{ heroTrendDescription }}</p>
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
      </div>
    </section>

    <section class="spot-detail-page__content">
      <div class="spot-detail-page__chart-column">
        <div
            class="spot-detail-page__chart-panel"
            :class="{'spot-detail-page__panel--updating': loading}"
        >
          <div class="spot-detail-page__chart-toolbar">
            <div class="spot-detail-page__section-copy">
              <span class="spot-detail-page__eyebrow">价格主图</span>
              <h2>价格结构</h2>
              <p>先看位置与方向，再看区间振幅和收盘位置，判断当前节奏。</p>
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
            <transition name="detail-chart-fade" mode="out-in">
              <SpotCandleChart
                  :key="candleChartRenderKey"
                  :candles="candles"
                  :title="chartTitle"
                  :coin="coin"
              />
            </transition>
          </a-spin>

          <div class="spot-detail-page__footer-meta">
            <span>最近刷新：{{ updateTimeLabel }}</span>
            <span>展示周期：{{ intervalDescription }}</span>
          </div>
        </div>

        <div
            class="spot-detail-page__metric-panel"
            :class="{'spot-detail-page__panel--updating': marketCapTrendLoading || metricsLoading}"
        >
          <div class="spot-detail-page__metric-header">
            <div class="spot-detail-page__section-copy">
              <span class="spot-detail-page__eyebrow">扩展指标</span>
              <h2>成交与市值</h2>
              <p>切换不同观察维度，确认价格背后的成交变化与估值变化。</p>
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
            <div class="spot-detail-page__metric-current">
              <span class="spot-detail-page__metric-toolbar-note">
                当前指标：{{ selectedMetricConfig.title }}
              </span>
              <strong>{{ selectedMetricValueLabel }}</strong>
            </div>

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
            <transition name="detail-chart-fade" mode="out-in">
              <SpotMetricTrendChart
                  :key="metricChartRenderKey"
                  :coin="coin"
                  :title="selectedMetricConfig.title"
                  :subtitle="selectedMetricConfig.subtitle"
                  :points="selectedMetricPoints"
                  :accent="selectedMetricConfig.accent"
              />
            </transition>
          </a-spin>

          <div class="spot-detail-page__footer-meta">
            <span>当前值：{{ formatCompactNumber(selectedMetricValue) }}</span>
            <span v-if="selectedMetricKind === 'market_cap'">
              观察区间：{{ selectedMarketCapInterval.toUpperCase() }}
            </span>
            <span v-else>
              成交曲线跟随上方 K 线周期切换
            </span>
          </div>
        </div>
      </div>

      <div class="spot-detail-page__info-panel">
        <div class="spot-detail-page__info-header">
          <div class="spot-detail-page__section-copy">
            <span class="spot-detail-page__eyebrow">市场摘要</span>
            <h2>终端摘要</h2>
            <p>先看关键快照，再按交易、区间和供给信息继续展开。</p>
          </div>
        </div>

        <div class="spot-detail-page__summary-grid">
          <button
              v-for="item in summaryInfoCards"
              :key="item.label"
              type="button"
              class="spot-detail-page__summary-card"
              @click="handleSelectMetric(item.key)"
          >
            <span>{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
            <small>{{ item.detail }}</small>
          </button>
        </div>

        <div class="spot-detail-page__info-grid">
          <article
              v-for="item in detailInfoRows"
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

.spot-detail-page__hero-side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.spot-detail-page__hero-side-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px 18px 0;
}

.spot-detail-page__hero-side-header p {
  color: rgba(226, 232, 240, 0.82);
  font-size: 13px;
  line-height: 1.6;
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

.spot-detail-page__source-pill--soft {
  background: rgba(125, 211, 252, 0.16);
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

.spot-detail-page__hero-price-row {
  display: flex;
  align-items: stretch;
  gap: 16px;
  margin-top: 24px;
  margin-bottom: 18px;
}

.spot-detail-page__hero-price-block,
.spot-detail-page__hero-change-pill {
  min-height: 118px;
}

.spot-detail-page__hero-price-block {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  padding: 20px 22px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(14px);
}

.spot-detail-page__eyebrow.spot-detail-page__eyebrow--hero {
  display: inline-flex;
  align-items: center;
  align-self: flex-start;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.28);
  color: #ffffff;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-shadow: 0 1px 2px rgba(15, 23, 42, 0.3);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.spot-detail-page__hero-price-block strong {
  color: #ffffff;
  font-size: 42px;
  line-height: 1;
  letter-spacing: -0.05em;
}

.spot-detail-page__hero-change-pill {
  min-width: 180px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
  padding: 20px 22px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(14px);
}

.spot-detail-page__hero-change-pill span {
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.spot-detail-page__hero-change-pill strong {
  font-size: 32px;
  line-height: 1;
}

.spot-detail-page__hero-change-pill--up {
  background: linear-gradient(180deg, rgba(22, 163, 74, 0.2), rgba(15, 23, 42, 0.08));
}

.spot-detail-page__hero-change-pill--up strong {
  color: #86efac;
}

.spot-detail-page__hero-change-pill--down {
  background: linear-gradient(180deg, rgba(220, 38, 38, 0.18), rgba(15, 23, 42, 0.08));
}

.spot-detail-page__hero-change-pill--down strong {
  color: #fda4af;
}

.spot-detail-page__hero-meta-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.spot-detail-page__hero-meta-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 18px 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 22px;
  background: rgba(15, 23, 42, 0.14);
}

.spot-detail-page__hero-meta-card span {
  color: rgba(226, 232, 240, 0.74);
  font-size: 12px;
}

.spot-detail-page__hero-meta-card strong {
  color: #ffffff;
  font-size: 18px;
  line-height: 1.2;
}

.spot-detail-page__hero-meta-card small {
  color: rgba(203, 213, 225, 0.76);
  font-size: 12px;
  line-height: 1.5;
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
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
  backdrop-filter: blur(14px);
}

.spot-detail-page__hero-card span {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.82);
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

.spot-detail-page__info-panel {
  position: sticky;
  top: 24px;
  align-self: start;
}

.spot-detail-page__chart-panel,
.spot-detail-page__metric-panel,
.spot-detail-page__info-panel {
  position: relative;
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.78);
  box-shadow: 0 22px 56px rgba(15, 23, 42, 0.08);
  backdrop-filter: blur(10px);
}

.spot-detail-page__chart-panel::before,
.spot-detail-page__metric-panel::before,
.spot-detail-page__info-panel::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.38), rgba(255, 255, 255, 0));
}

.spot-detail-page__panel--updating {
  transition:
      box-shadow 0.22s ease,
      transform 0.22s ease,
      border-color 0.22s ease,
      background 0.22s ease;
  border-color: rgba(14, 165, 233, 0.18);
  box-shadow: 0 24px 60px rgba(14, 165, 233, 0.08);
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

.spot-detail-page__section-copy {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.spot-detail-page__section-copy h2 {
  color: #0f172a;
  font-size: 30px;
  line-height: 1.05;
}

.spot-detail-page__section-copy p {
  color: rgba(71, 85, 105, 0.8);
  font-size: 14px;
  line-height: 1.6;
}

.spot-detail-page__metric-current {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.spot-detail-page__metric-current strong {
  color: #0f172a;
  font-size: 24px;
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
  transform: translateY(-1px) scale(1.01);
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

.spot-detail-page__summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.spot-detail-page__summary-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px;
  border: 1px solid rgba(191, 219, 254, 0.7);
  border-radius: 22px;
  background:
      linear-gradient(180deg, rgba(239, 246, 255, 0.9), rgba(255, 255, 255, 0.82));
  text-align: left;
  transition:
      border-color 0.2s ease,
      transform 0.2s ease,
      box-shadow 0.2s ease;
  cursor: pointer;
}

.spot-detail-page__summary-card:hover {
  border-color: rgba(59, 130, 246, 0.26);
  transform: translateY(-1px);
  box-shadow: 0 16px 36px rgba(59, 130, 246, 0.1);
}

.spot-detail-page__summary-card span {
  color: rgba(71, 85, 105, 0.82);
  font-size: 13px;
}

.spot-detail-page__summary-card strong {
  color: #0f172a;
  font-size: 24px;
  line-height: 1.05;
}

.spot-detail-page__summary-card small {
  color: rgba(71, 85, 105, 0.72);
  font-size: 12px;
}

.detail-chart-fade-enter-active,
.detail-chart-fade-leave-active {
  transition:
      opacity 0.18s ease,
      transform 0.18s ease;
}

.detail-chart-fade-enter-from,
.detail-chart-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
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

  .spot-detail-page__info-panel {
    position: relative;
    top: auto;
  }

  .spot-detail-page__hero-meta-grid,
  .spot-detail-page__summary-grid,
  .spot-detail-page__metric-card-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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
  .spot-detail-page__hero-meta-grid,
  .spot-detail-page__summary-grid,
  .spot-detail-page__info-grid {
    grid-template-columns: 1fr;
  }

  .spot-detail-page__hero-price-row {
    flex-direction: column;
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

  .spot-detail-page__metric-card-grid {
    grid-template-columns: 1fr;
  }
}
</style>
