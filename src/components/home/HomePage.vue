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

</script>

<template>
  <a-list item-layout="horizontal" :data-source="coinPrices">
    <template #renderItem="{ item }">
      <a-list-item :key="item.coin">
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

</style>
