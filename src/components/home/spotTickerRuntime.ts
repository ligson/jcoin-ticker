import {ref} from "vue";
import store from "../../config/store.ts";
import {AppConfig, MarketDataSource, normalizeAppConfig} from "../config/config.ts";
import {CoinPrice, createSpotTickerClient, SpotTickerClient} from "./spotMarketDataSources.ts";

export const runtimeCoinPrices = ref<CoinPrice[]>([])
export const runtimeCoins = ref<string[]>([])
export const runtimeMarketDataSource = ref<MarketDataSource>('binance_spot')
export const runtimeReady = ref(false)

let tickerClient: SpotTickerClient | null = null
let lastRuntimeSignature = ''
let initializingPromise: Promise<void> | null = null

const createEmptyCoinPrices = (coins: string[]) => {
    return coins.map((coin) => ({
        coin,
        price: "0.00",
        open: "0.00",
        high: "0.00",
        low: "0.00",
        priceChangePercentage: "0.00",
        volume: "0.00",
        volumeInUSDT: "0.00"
    }))
}

const hasSameCoins = (currentCoins: string[], nextCoins: string[]) => {
    if (currentCoins.length !== nextCoins.length) {
        return false
    }

    const currentSet = new Set(currentCoins)
    return nextCoins.every((coin) => currentSet.has(coin))
}

const reorderCoinPrices = (coins: string[], currentPrices: CoinPrice[]) => {
    return coins.map((coin) => {
        const existing = currentPrices.find((item) => item.coin === coin)
        return existing ?? {
            coin,
            price: "0.00",
            open: "0.00",
            high: "0.00",
            low: "0.00",
            priceChangePercentage: "0.00",
            volume: "0.00",
            volumeInUSDT: "0.00"
        }
    })
}

const buildRuntimeSignature = (appConfig: AppConfig) => {
    return `${appConfig.marketDataSource}::${appConfig.coins.join(',')}`
}

const bindTickerMessages = (coins: string[]) => {
    tickerClient?.setMessageCallback((coinPrice: CoinPrice) => {
        const existingIndex = runtimeCoinPrices.value.findIndex(item => item.coin === coinPrice.coin);
        if (existingIndex >= 0) {
            const nextCoinPrices = [...runtimeCoinPrices.value]
            nextCoinPrices[existingIndex] = {
                ...nextCoinPrices[existingIndex],
                ...coinPrice
            }
            runtimeCoinPrices.value = nextCoinPrices
        } else {
            const coinIndex = coins.indexOf(coinPrice.coin);
            if (coinIndex >= 0) {
                const nextCoinPrices = [...runtimeCoinPrices.value]
                let insertPosition = 0;
                for (let i = 0; i < coinIndex; i++) {
                    if (nextCoinPrices.some(item => item.coin === coins[i])) {
                        insertPosition++;
                    }
                }
                nextCoinPrices.splice(insertPosition, 0, coinPrice)
                runtimeCoinPrices.value = nextCoinPrices
            }
        }
    })
}

export const applySpotTickerRuntimeConfig = async (config: AppConfig) => {
    const appConfig = normalizeAppConfig(config)
    const nextSignature = buildRuntimeSignature(appConfig)
    const orderOnlyChanged = runtimeReady.value
        && runtimeMarketDataSource.value === appConfig.marketDataSource
        && lastRuntimeSignature !== nextSignature
        && hasSameCoins(runtimeCoins.value, appConfig.coins)

    runtimeCoins.value = [...appConfig.coins]
    runtimeMarketDataSource.value = appConfig.marketDataSource

    if (orderOnlyChanged) {
        runtimeCoinPrices.value = reorderCoinPrices(appConfig.coins, runtimeCoinPrices.value)
        lastRuntimeSignature = nextSignature
        runtimeReady.value = true
        return
    }

    if (lastRuntimeSignature !== nextSignature) {
        runtimeCoinPrices.value = createEmptyCoinPrices(appConfig.coins)
        tickerClient?.close()
        tickerClient = appConfig.coins.length > 0
            ? createSpotTickerClient(appConfig.marketDataSource, appConfig.coins)
            : null
        bindTickerMessages(appConfig.coins)
        lastRuntimeSignature = nextSignature
    }

    runtimeReady.value = true
}

export const syncSpotTickerRuntimeFromStore = async () => {
    const value = await store.get("appConfig") as AppConfig | null
    const appConfig = normalizeAppConfig(value)
    await applySpotTickerRuntimeConfig(appConfig)
}

export const ensureSpotTickerRuntime = async () => {
    if (runtimeReady.value) {
        return
    }

    if (!initializingPromise) {
        initializingPromise = (async () => {
            await syncSpotTickerRuntimeFromStore()
        })().finally(() => {
            initializingPromise = null
        })
    }

    await initializingPromise
}

export const reconnectSpotTickerRuntime = async () => {
    lastRuntimeSignature = ''
    await syncSpotTickerRuntimeFromStore()
}
