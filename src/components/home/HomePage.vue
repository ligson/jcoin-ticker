<script setup lang="ts">
import {getCurrentInstance, ref} from "vue";
import {useRouter} from "vue-router";
import {HolderOutlined} from "@ant-design/icons-vue";
import MarketSentimentPanel from "./MarketSentimentPanel.vue";
import store from "../../config/store.ts";
import {normalizeAppConfig} from "../config/config.ts";
import {applySpotTickerRuntimeConfig, runtimeCoinPrices} from "./spotTickerRuntime.ts";

const coinPrices = runtimeCoinPrices
const router = useRouter()
const instance = getCurrentInstance();
const $message = instance?.appContext.config.globalProperties.$message;
const draggingCoin = ref('')
const dragOverCoin = ref('')
const dragInsertMode = ref<'before' | 'after'>('before')
const suppressClick = ref(false)

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

</script>

<template>
  <div class="home-page">
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
          <a-list-item-meta>
            <template #description>
              <template v-if="item.priceChangePercentage>0">
                <a-avatar :style="{backgroundColor: 'green'}" shape="square" size="small">涨</a-avatar>
              </template>
              <template v-else>
                <a-avatar :style="{backgroundColor: 'red'}" shape="square" size="small">跌</a-avatar>
              </template>
              <a-tag color="green" style="margin-left: 5px;">{{ item.priceChangePercentage }}%</a-tag>
              <a-tag color="red">24h最高价: {{ item.high }}</a-tag>
              <a-tag color="orange">24h最低价: {{ item.low }}</a-tag>
              <a-tag color="yellow">24h成交量: {{ formatCompactNumber(item.volume) }}</a-tag>
              <a-tag color="cyan">24h成交额: {{ formatCompactNumber(item.volumeInUSDT) }}</a-tag>
            </template>
            <template #title>
              <div class="ticker-list-item__title-row">
                <span>{{ item.price }}</span>
                <span class="ticker-list-item__drag-hint" title="拖拽调整顺序">
                  <HolderOutlined />
                  <HolderOutlined />
                </span>
              </div>
            </template>
            <template #avatar>
              <a-avatar :style="{backgroundColor: getAvatarColor(item.coin)}" size="large">{{ item.coin }}</a-avatar>
            </template>
          </a-list-item-meta>
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
  padding: 16px 18px !important;
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 18px;
  background:
      linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92));
  transition:
      border-color 0.22s ease,
      background 0.22s ease,
      box-shadow 0.22s ease,
      opacity 0.18s ease;
  cursor: pointer;
}

.ticker-list-item[data-dragging='true'] {
  opacity: 0.56;
  cursor: grabbing;
}

.ticker-list-item[data-dragging='true'] .ticker-list-item__drag-hint {
  opacity: 1;
  transform: scale(1.02);
}

.ticker-list-item[data-drag-over='before'] {
  box-shadow: inset 0 4px 0 #0ea5e9;
}

.ticker-list-item[data-drag-over='after'] {
  box-shadow: inset 0 -4px 0 #0ea5e9;
}

.ticker-list-item--up:hover {
  border-color: rgba(34, 197, 94, 0.24);
  background:
      linear-gradient(135deg, rgba(240, 253, 244, 0.98), rgba(220, 252, 231, 0.94));
}

.ticker-list-item--down:hover {
  border-color: rgba(248, 113, 113, 0.24);
  background:
      linear-gradient(135deg, rgba(255, 241, 242, 0.98), rgba(255, 228, 230, 0.94));
}

.ticker-list-item :deep(.ant-list-item-meta) {
  align-items: center;
}

.ticker-list-item :deep(.ant-list-item-meta-title) {
  margin-bottom: 10px;
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
}

.ticker-list-item__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
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

.ticker-list-item :deep(.ant-list-item-meta-description) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.ticker-list-item :deep(.ant-tag) {
  margin-inline-end: 0;
  border-radius: 999px;
}
</style>
