<script setup lang="ts">
import {ref} from "vue";
import {runtimeCoinPrices} from "./spotTickerRuntime.ts";

const coinPrices = runtimeCoinPrices

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

</script>

<template>
  <a-list class="ticker-price-list" item-layout="horizontal" :data-source="coinPrices">
    <template #renderItem="{ item }">
      <a-list-item :key="item.coin" class="ticker-list-item" :class="getTrendClass(item.priceChangePercentage)">
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
            <a-tag color="yellow">24h成交量: {{ item.volume }}</a-tag>
            <a-tag color="cyan">24h成交额(亿): {{ (item.volumeInUSDT / 100000000).toFixed(2) }}</a-tag>
          </template>
          <template #title>
            {{ item.price }}
          </template>
          <template #avatar>
            <a-avatar :style="{backgroundColor: getAvatarColor(item.coin)}" size="large">{{ item.coin }}</a-avatar>
          </template>
        </a-list-item-meta>
      </a-list-item>
    </template>
  </a-list>
</template>

<style scoped>
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
      background 0.22s ease;
  cursor: pointer;
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
