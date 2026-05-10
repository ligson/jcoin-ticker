<script setup lang="ts">
import {computed, onMounted, ref} from "vue";
import type {CoinPrice} from "./spotMarketDataSources.ts";
import {
  fetchMarketSentimentHistory,
  resolveMarketSentimentAccent
} from "./marketSentiment.ts";

const props = defineProps<{
  coinPrices: CoinPrice[];
}>()

const loading = ref(false)
const sentimentScore = ref<number | null>(null)
const sentimentClassification = ref('暂无')
const sentimentTimestamp = ref<number | null>(null)
const sentimentError = ref('')

const findCoin = (coin: string) => {
  return props.coinPrices.find((item) => item.coin === coin) ?? null
}

const btcTicker = computed(() => findCoin('BTC'))
const ethTicker = computed(() => findCoin('ETH'))

const sentimentAccent = computed(() => {
  return resolveMarketSentimentAccent(sentimentScore.value ?? 50)
})

const monitoredSummary = computed(() => {
  const changes = props.coinPrices
      .map((item) => Number(item.priceChangePercentage))
      .filter((value) => Number.isFinite(value))

  const upCount = changes.filter((value) => value > 0).length
  const downCount = changes.filter((value) => value < 0).length
  const flatCount = Math.max(0, changes.length - upCount - downCount)
  const averageChange = changes.length > 0
      ? changes.reduce((sum, value) => sum + value, 0) / changes.length
      : 0

  return {
    total: changes.length,
    upCount,
    downCount,
    flatCount,
    averageChange
  }
})

const marketState = computed(() => {
  const {total, upCount, downCount, averageChange} = monitoredSummary.value
  if (total === 0) {
    return {
      label: '暂无数据',
      description: '当前还没有可用的监控行情。',
      tone: 'neutral'
    } as const
  }

  const upRatio = upCount / total
  const downRatio = downCount / total
  if (upRatio >= 0.65 && averageChange >= 1) {
    return {
      label: '整体偏强',
      description: `上涨 ${upCount} 个，下跌 ${downCount} 个，平均涨跌 ${formatSignedPercent(averageChange)}。`,
      tone: 'up'
    } as const
  }

  if (downRatio >= 0.65 && averageChange <= -1) {
    return {
      label: '整体偏弱',
      description: `下跌 ${downCount} 个，上涨 ${upCount} 个，平均涨跌 ${formatSignedPercent(averageChange)}。`,
      tone: 'down'
    } as const
  }

  if (upCount > downCount) {
    return {
      label: '多头略优',
      description: `上涨 ${upCount} 个，下跌 ${downCount} 个，市场仍有分化。`,
      tone: 'up'
    } as const
  }

  if (downCount > upCount) {
    return {
      label: '空头略优',
      description: `下跌 ${downCount} 个，上涨 ${upCount} 个，市场仍有分化。`,
      tone: 'down'
    } as const
  }

  return {
    label: '震荡整理',
    description: `上涨 ${upCount} 个，持平 ${monitoredSummary.value.flatCount} 个，下跌 ${downCount} 个。`,
    tone: 'neutral'
  } as const
})

const sentimentUpdateLabel = computed(() => {
  if (!sentimentTimestamp.value) {
    return '暂无'
  }
  return new Date(sentimentTimestamp.value).toLocaleDateString()
})

const averageChangeLabel = computed(() => {
  return monitoredSummary.value.total > 0
      ? formatSignedPercent(monitoredSummary.value.averageChange)
      : '--'
})

const getTickerToneClass = (ticker: CoinPrice | null) => {
  if (!ticker) {
    return 'overview-card--coin-neutral'
  }
  return Number(ticker.priceChangePercentage) >= 0
      ? 'overview-card--coin-up'
      : 'overview-card--coin-down'
}

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

async function loadSentiment() {
  loading.value = true
  sentimentError.value = ''

  try {
    const points = await fetchMarketSentimentHistory(false)
    const currentPoint = points.length > 0 ? points[points.length - 1] : null
    sentimentScore.value = currentPoint?.value ?? null
    sentimentClassification.value = currentPoint?.classification || '暂无'
    sentimentTimestamp.value = currentPoint?.timestamp ?? null
  } catch (error: any) {
    sentimentError.value = error instanceof Error ? error.message : String(error)
    sentimentScore.value = null
    sentimentClassification.value = '暂无'
    sentimentTimestamp.value = null
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadSentiment()
})
</script>

<template>
  <section class="home-market-overview">
    <div class="home-market-overview__heading">
      <div>
        <span class="home-market-overview__eyebrow">市场总览</span>
        <h2>仪表盘</h2>
        <p>把情绪、大盘和当前监控列表的整体状态先放到最上面，打开首页就能先看方向。</p>
      </div>

      <div class="home-market-overview__meta">
        <span>情绪更新：{{ sentimentUpdateLabel }}</span>
        <span>监控币种：{{ monitoredSummary.total }}</span>
      </div>
    </div>

    <div class="home-market-overview__grid">
      <article class="overview-card overview-card--sentiment" :class="`overview-card--${sentimentAccent}`">
        <div class="overview-card__label">市场情绪</div>
        <div class="overview-card__value-row">
          <strong>{{ sentimentScore === null ? '--' : Math.round(sentimentScore) }}</strong>
          <span class="overview-card__badge">{{ sentimentClassification }}</span>
        </div>
        <p class="overview-card__description">
          {{ sentimentError || (loading ? '正在读取最新市场情绪。' : 'Fear & Greed Index，越低越偏恐惧，越高越偏贪婪。') }}
        </p>
      </article>

      <article class="overview-card overview-card--coin" :class="getTickerToneClass(btcTicker)">
        <div class="overview-card__label">BTC 大盘</div>
        <div class="overview-card__value-row">
          <strong>{{ btcTicker ? formatPrice(btcTicker.price) : '--' }}</strong>
          <span class="overview-card__delta">{{ btcTicker ? formatSignedPercent(btcTicker.priceChangePercentage) : '未监控' }}</span>
        </div>
        <p class="overview-card__description">
          {{ btcTicker ? `24H 高 ${formatPrice(btcTicker.high)} / 低 ${formatPrice(btcTicker.low)}` : '把 BTC 加入监控后，这里会显示实时大盘状态。' }}
        </p>
      </article>

      <article class="overview-card overview-card--coin" :class="getTickerToneClass(ethTicker)">
        <div class="overview-card__label">ETH 大盘</div>
        <div class="overview-card__value-row">
          <strong>{{ ethTicker ? formatPrice(ethTicker.price) : '--' }}</strong>
          <span class="overview-card__delta">{{ ethTicker ? formatSignedPercent(ethTicker.priceChangePercentage) : '未监控' }}</span>
        </div>
        <p class="overview-card__description">
          {{ ethTicker ? `24H 高 ${formatPrice(ethTicker.high)} / 低 ${formatPrice(ethTicker.low)}` : '把 ETH 加入监控后，这里会显示实时大盘状态。' }}
        </p>
      </article>

      <article class="overview-card overview-card--market" :class="`overview-card--market-${marketState.tone}`">
        <div class="overview-card__label">整体状态</div>
        <div class="overview-card__value-row">
          <strong>{{ marketState.label }}</strong>
          <span class="overview-card__badge">{{ averageChangeLabel }}</span>
        </div>
        <p class="overview-card__description">
          {{ marketState.description }}
        </p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.home-market-overview {
  margin-bottom: 22px;
  padding: 24px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 30px;
  background:
      radial-gradient(circle at top left, rgba(56, 189, 248, 0.14), transparent 22%),
      radial-gradient(circle at top right, rgba(59, 130, 246, 0.12), transparent 18%),
      linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.92));
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.09);
}

.home-market-overview__heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 20px;
}

.home-market-overview__eyebrow {
  color: rgba(71, 85, 105, 0.74);
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.home-market-overview h2 {
  margin: 8px 0 8px;
  color: #0f172a;
  font-size: 30px;
  line-height: 1;
}

.home-market-overview p {
  max-width: 760px;
  color: rgba(71, 85, 105, 0.82);
  font-size: 14px;
}

.home-market-overview__meta {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 10px;
}

.home-market-overview__meta span {
  display: inline-flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.72);
  color: rgba(51, 65, 85, 0.84);
  font-size: 12px;
}

.home-market-overview__grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.overview-card {
  min-height: 154px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  border: 1px solid rgba(226, 232, 240, 0.92);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.8);
}

.overview-card__label {
  color: rgba(71, 85, 105, 0.76);
  font-size: 12px;
}

.overview-card__value-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.overview-card__value-row strong {
  color: #0f172a;
  font-size: 30px;
  line-height: 1.05;
}

.overview-card__badge,
.overview-card__delta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
}

.overview-card__description {
  margin: 0;
  color: rgba(71, 85, 105, 0.82);
  font-size: 13px;
  line-height: 1.6;
}

.overview-card--emerald {
  background: linear-gradient(180deg, rgba(236, 253, 245, 0.94), rgba(255, 255, 255, 0.82));
}

.overview-card--emerald .overview-card__badge {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.overview-card--amber {
  background: linear-gradient(180deg, rgba(255, 251, 235, 0.94), rgba(255, 255, 255, 0.82));
}

.overview-card--amber .overview-card__badge {
  background: rgba(245, 158, 11, 0.14);
  color: #b45309;
}

.overview-card--sky {
  background: linear-gradient(180deg, rgba(240, 249, 255, 0.94), rgba(255, 255, 255, 0.82));
}

.overview-card--sky .overview-card__badge {
  background: rgba(14, 165, 233, 0.12);
  color: #0369a1;
}

.overview-card--coin-up {
  background: linear-gradient(180deg, rgba(240, 253, 244, 0.88), rgba(255, 255, 255, 0.82));
}

.overview-card--coin-up .overview-card__delta {
  background: rgba(22, 163, 74, 0.12);
  color: #15803d;
}

.overview-card--coin-down {
  background: linear-gradient(180deg, rgba(255, 241, 242, 0.9), rgba(255, 255, 255, 0.82));
}

.overview-card--coin-down .overview-card__delta {
  background: rgba(220, 38, 38, 0.12);
  color: #b91c1c;
}

.overview-card--coin-neutral {
  background: linear-gradient(180deg, rgba(248, 250, 252, 0.94), rgba(255, 255, 255, 0.82));
}

.overview-card--coin-neutral .overview-card__delta {
  background: rgba(100, 116, 139, 0.12);
  color: #475569;
}

.overview-card--market-up {
  background:
      linear-gradient(180deg, rgba(236, 253, 245, 0.92), rgba(255, 255, 255, 0.82));
}

.overview-card--market-up .overview-card__badge {
  background: rgba(22, 163, 74, 0.12);
  color: #15803d;
}

.overview-card--market-down {
  background:
      linear-gradient(180deg, rgba(255, 241, 242, 0.92), rgba(255, 255, 255, 0.82));
}

.overview-card--market-down .overview-card__badge {
  background: rgba(220, 38, 38, 0.12);
  color: #b91c1c;
}

.overview-card--market-neutral {
  background:
      linear-gradient(180deg, rgba(248, 250, 252, 0.94), rgba(255, 255, 255, 0.82));
}

.overview-card--market-neutral .overview-card__badge {
  background: rgba(100, 116, 139, 0.12);
  color: #475569;
}

@media (max-width: 1080px) {
  .home-market-overview__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .home-market-overview {
    padding: 18px;
    border-radius: 24px;
  }

  .home-market-overview__heading {
    flex-direction: column;
  }

  .home-market-overview__meta {
    justify-content: flex-start;
  }

  .home-market-overview__grid {
    grid-template-columns: 1fr;
  }

  .overview-card {
    min-height: auto;
  }

  .overview-card__value-row {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
