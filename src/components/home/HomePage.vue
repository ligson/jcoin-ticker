<script setup lang="ts">
import {getCurrentInstance, onMounted, ref} from "vue";
import BinanceWebSocket, {CoinPrice} from "./BinanceWebSocket.ts";


const coins = ref(["BTC", "ETH", "CRV", "S"])
const coinPrices = ref<CoinPrice[]>([])
const instance = getCurrentInstance();
const $message = instance?.appContext.config.globalProperties.$message;
const $store = instance?.appContext.config.globalProperties.$store;
const loadingCoinInfo = () => {
  const binanceWebSocket = new BinanceWebSocket(coins.value)
  binanceWebSocket.setMessageCallback((coinPrice: CoinPrice) => {
    const existingIndex = coinPrices.value.findIndex(item => item.coin === coinPrice.coin);
    if (existingIndex >= 0) {
      // 如果已存在该coin，更新价格
      coinPrices.value[existingIndex].price = coinPrice.price;
      coinPrices.value[existingIndex].open = coinPrice.open;
      coinPrices.value[existingIndex].high = coinPrice.high;
      coinPrices.value[existingIndex].low = coinPrice.low;
      coinPrices.value[existingIndex].priceChangePercentage = coinPrice.priceChangePercentage;
      coinPrices.value[existingIndex].volume = coinPrice.volume;
      coinPrices.value[existingIndex].volumeInUSDT = coinPrice.volumeInUSDT;
      //$message.success(`${coinPrice.coin}价格已更新`)
    } else {
      // 按照coins数组中的顺序插入
      const coinIndex = coins.value.indexOf(coinPrice.coin);
      if (coinIndex >= 0) {
        // 根据在coins中的位置确定插入点
        let insertPosition = 0;
        for (let i = 0; i < coinIndex; i++) {
          if (coinPrices.value.some(item => item.coin === coins.value[i])) {
            insertPosition++;
          }
        }
        coinPrices.value.splice(insertPosition, 0, coinPrice);
      }
    }
  })
}
const loadSettings = () => {

  $store.get("appConfig").then((value: any) => {
    if (value) {
      coins.value = value.coins
      coinPrices.value = []
      value.coins.forEach((coin: string) => {
        coinPrices.value.push({
          coin: coin,
          price: "0.00",
          open: "0.00",
          high: "0.00",
          low: "0.00",
          priceChangePercentage: "0.00",
          volume: "0.00",
          volumeInUSDT: "0.00"
        })
      })
      loadingCoinInfo()
    }
  }).catch((e: Error) => {
    $message.error(e.message)
  })
}

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

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <a-list item-layout="horizontal" :data-source="coinPrices">
    <template #renderItem="{ item }">
      <a-list-item>
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
