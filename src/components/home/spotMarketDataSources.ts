import type {MarketDataSource} from "../config/config.ts";

export interface CoinPrice {
    coin: string,
    price: string,
    open: string,
    high: string,
    low: string,
    priceChangePercentage: string,
    volume: string,
    volumeInUSDT: string,
}

export interface TickerSymbolOption {
    value: string;
    label: string;
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
}

export type SpotCandleInterval = '15m' | '1h' | '1d' | '1w' | '1M' | 'all'

export interface SpotCandle {
    openTime: number;
    closeTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    quoteVolume: number;
}

export interface SpotCandleSummary {
    open: number;
    close: number;
    high: number;
    low: number;
    volume: number;
    quoteVolume: number;
    changePercentage: number;
    amplitudePercentage: number;
    averageClose: number;
}

export interface SpotTickerClient {
    setMessageCallback(callback: (coinPrice: CoinPrice) => void): void;
    close(): void;
}

const RECONNECT_INTERVAL = 5000
const REST_POLL_INTERVAL = 5000
const BINANCE_SPOT_WS_PREFIX = 'wss://data-stream.binance.vision/stream?streams='
const BINANCE_SPOT_REST_URL = 'https://data-api.binance.vision/api/v3'
const OKX_SPOT_WS_URL = 'wss://ws.okx.com:8443/ws/v5/public'
const OKX_SPOT_REST_URL = 'https://www.okx.com/api/v5'
const KRAKEN_SPOT_WS_URL = 'wss://ws.kraken.com/v2'
const KRAKEN_SPOT_REST_URL = 'https://api.kraken.com/0/public'
const COINBASE_SPOT_WS_URL = 'wss://ws-feed.exchange.coinbase.com'
const COINBASE_SPOT_REST_URL = 'https://api.exchange.coinbase.com'
const BYBIT_SPOT_REST_URL = 'https://api.bybit.com/v5/market'
const BITGET_SPOT_REST_URL = 'https://api.bitget.com/api/v2/spot'
const KUCOIN_SPOT_REST_URL = 'https://api.kucoin.com/api/v1'
const KUCOIN_SPOT_REST_V2_URL = 'https://api.kucoin.com/api/v2'
const SPOT_CANDLE_CACHE_TTL_MS = 2 * 60 * 1000
const SPOT_CANDLE_TARGET_COUNTS: Record<SpotCandleInterval, number> = {
    '15m': 96,
    '1h': 120,
    '1d': 90,
    '1w': 52,
    '1M': 12,
    all: 240
}

const spotCandleCache = new Map<string, {updatedAt: number; candles: SpotCandle[]}>()

export const spotCandleIntervalOptions: Array<{label: string; value: SpotCandleInterval}> = [
    {label: '15 分钟', value: '15m'},
    {label: '1 小时', value: '1h'},
    {label: '日线', value: '1d'},
    {label: '周线', value: '1w'},
    {label: '月线', value: '1M'},
    {label: '全部', value: 'all'}
]

const spotCandleIntervalLabelMap: Record<SpotCandleInterval, string> = {
    '15m': '15 分钟',
    '1h': '1 小时',
    '1d': '日线',
    '1w': '周线',
    '1M': '月线',
    all: '全部'
}

export const getSpotCandleIntervalLabel = (interval: SpotCandleInterval) => {
    return spotCandleIntervalLabelMap[interval]
}

export const marketDataSourceOptions = [
    {
        label: 'Binance 现货',
        value: 'binance_spot' as MarketDataSource
    },
    {
        label: 'OKX 现货',
        value: 'okx_spot' as MarketDataSource
    },
    {
        label: 'Kraken 现货',
        value: 'kraken_spot' as MarketDataSource
    },
    {
        label: 'Coinbase 现货',
        value: 'coinbase_spot' as MarketDataSource
    },
    {
        label: 'Bybit 现货',
        value: 'bybit_spot' as MarketDataSource
    },
    {
        label: 'Bitget 现货',
        value: 'bitget_spot' as MarketDataSource
    },
    {
        label: 'KuCoin 现货',
        value: 'kucoin_spot' as MarketDataSource
    }
]

export const marketDataSourceLabelMap: Record<MarketDataSource, string> = {
    binance_spot: 'Binance 现货',
    okx_spot: 'OKX 现货',
    kraken_spot: 'Kraken 现货',
    coinbase_spot: 'Coinbase 现货',
    bybit_spot: 'Bybit 现货',
    bitget_spot: 'Bitget 现货',
    kucoin_spot: 'KuCoin 现货'
}

class BinanceSpotTickerClient implements SpotTickerClient {
    private messageCallback: ((coinPrice: CoinPrice) => void) | null = null
    private ws: WebSocket | null = null
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null
    private closed = false

    constructor(private readonly coins: string[]) {
        this.connect()
    }

    setMessageCallback(callback: (coinPrice: CoinPrice) => void) {
        this.messageCallback = callback
    }

    private connect() {
        if (this.closed) {
            return
        }

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }

        const wsUrl = this.coins.map(coin => `${coin.toLowerCase()}usdt@ticker`).join('/')
        this.ws = new WebSocket(BINANCE_SPOT_WS_PREFIX + wsUrl)

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            const coinPrice: CoinPrice = {
                coin: data.data.s.replace('USDT', ''),
                price: data.data.c,
                open: data.data.o,
                high: data.data.h,
                low: data.data.l,
                priceChangePercentage: data.data.P,
                volume: data.data.v,
                volumeInUSDT: (parseFloat(data.data.v) * parseFloat(data.data.c)).toString(),
            }

            this.messageCallback?.(coinPrice)
        }

        this.ws.onclose = () => {
            if (this.closed) {
                return
            }
            this.reconnectTimer = setTimeout(() => {
                this.connect()
            }, RECONNECT_INTERVAL)
        }

        this.ws.onerror = () => {
            if (!this.closed) {
                this.ws?.close()
            }
        }
    }

    close() {
        this.closed = true
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
        const currentWs = this.ws
        this.ws = null
        currentWs?.close()
    }
}

class OkxSpotTickerClient implements SpotTickerClient {
    private messageCallback: ((coinPrice: CoinPrice) => void) | null = null
    private ws: WebSocket | null = null
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null
    private closed = false

    constructor(private readonly coins: string[]) {
        this.connect()
    }

    setMessageCallback(callback: (coinPrice: CoinPrice) => void) {
        this.messageCallback = callback
    }

    private connect() {
        if (this.closed) {
            return
        }

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }

        this.ws = new WebSocket(OKX_SPOT_WS_URL)

        this.ws.onopen = () => {
            const args = this.coins.map((coin) => ({
                channel: 'tickers',
                instId: `${coin.toUpperCase()}-USDT`
            }))
            this.ws?.send(JSON.stringify({
                op: 'subscribe',
                args
            }))
        }

        this.ws.onmessage = (event) => {
            const payload = JSON.parse(String(event.data))
            if (!Array.isArray(payload?.data) || !payload.arg?.instId) {
                return
            }

            const item = payload.data[0]
            const instId = String(payload.arg.instId).toUpperCase()
            const coin = instId.replace('-USDT', '')
            const last = String(item.last ?? '0')
            const open24h = String(item.open24h ?? last)
            const high24h = String(item.high24h ?? last)
            const low24h = String(item.low24h ?? last)
            const volume24h = String(item.vol24h ?? '0')
            const volumeInUsdt = String(item.volCcy24h ?? '0')
            const openPrice = parseFloat(open24h || '0')
            const lastPrice = parseFloat(last || '0')
            const priceChangePercentage = openPrice > 0
                ? (((lastPrice - openPrice) / openPrice) * 100).toFixed(2)
                : '0.00'

            this.messageCallback?.({
                coin,
                price: last,
                open: open24h,
                high: high24h,
                low: low24h,
                priceChangePercentage,
                volume: volume24h,
                volumeInUSDT: volumeInUsdt
            })
        }

        this.ws.onclose = () => {
            if (this.closed) {
                return
            }
            this.reconnectTimer = setTimeout(() => {
                this.connect()
            }, RECONNECT_INTERVAL)
        }

        this.ws.onerror = () => {
            if (!this.closed) {
                this.ws?.close()
            }
        }
    }

    close() {
        this.closed = true
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
        const currentWs = this.ws
        this.ws = null
        currentWs?.close()
    }
}

class KrakenSpotTickerClient implements SpotTickerClient {
    private messageCallback: ((coinPrice: CoinPrice) => void) | null = null
    private ws: WebSocket | null = null
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null
    private closed = false

    constructor(private readonly coins: string[]) {
        this.connect()
    }

    setMessageCallback(callback: (coinPrice: CoinPrice) => void) {
        this.messageCallback = callback
    }

    private connect() {
        if (this.closed) {
            return
        }

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }

        this.ws = new WebSocket(KRAKEN_SPOT_WS_URL)

        this.ws.onopen = () => {
            this.ws?.send(JSON.stringify({
                method: 'subscribe',
                params: {
                    channel: 'ticker',
                    snapshot: true,
                    symbol: this.coins.map((coin) => `${coin.toUpperCase()}/USDT`)
                }
            }))
        }

        this.ws.onmessage = (event) => {
            const payload = JSON.parse(String(event.data))
            if (payload?.channel !== 'ticker' || !Array.isArray(payload?.data) || !payload.data[0]) {
                return
            }

            const item = payload.data[0]
            const symbol = String(item.symbol ?? '').toUpperCase()
            const coin = symbol.replace('/USDT', '')
            const last = String(item.last ?? '0')
            const high = String(item.high ?? last)
            const low = String(item.low ?? last)
            const volume = String(item.volume ?? '0')
            const vwap = parseFloat(String(item.vwap ?? '0'))
            const volumeInUsdt = vwap > 0 ? (parseFloat(volume || '0') * vwap).toString() : '0'
            const priceChangePercentage = typeof item.change_pct === 'number'
                ? item.change_pct.toFixed(2)
                : String(item.change_pct ?? '0.00')
            const change = parseFloat(String(item.change ?? '0'))
            const lastPrice = parseFloat(last || '0')
            const open = (lastPrice - change).toString()

            this.messageCallback?.({
                coin,
                price: last,
                open,
                high,
                low,
                priceChangePercentage,
                volume,
                volumeInUSDT: volumeInUsdt
            })
        }

        this.ws.onclose = () => {
            if (this.closed) {
                return
            }
            this.reconnectTimer = setTimeout(() => {
                this.connect()
            }, RECONNECT_INTERVAL)
        }

        this.ws.onerror = () => {
            if (!this.closed) {
                this.ws?.close()
            }
        }
    }

    close() {
        this.closed = true
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
        const currentWs = this.ws
        this.ws = null
        currentWs?.close()
    }
}

class CoinbaseSpotTickerClient implements SpotTickerClient {
    private messageCallback: ((coinPrice: CoinPrice) => void) | null = null
    private ws: WebSocket | null = null
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null
    private closed = false

    constructor(private readonly coins: string[]) {
        this.connect()
    }

    setMessageCallback(callback: (coinPrice: CoinPrice) => void) {
        this.messageCallback = callback
    }

    private connect() {
        if (this.closed) {
            return
        }

        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }

        this.ws = new WebSocket(COINBASE_SPOT_WS_URL)

        this.ws.onopen = () => {
            this.ws?.send(JSON.stringify({
                type: 'subscribe',
                product_ids: this.coins.map((coin) => `${coin.toUpperCase()}-USDT`),
                channels: ['ticker']
            }))
        }

        this.ws.onmessage = (event) => {
            const payload = JSON.parse(String(event.data))
            if (payload?.type !== 'ticker' || !payload.product_id) {
                return
            }

            const productId = String(payload.product_id).toUpperCase()
            const coin = productId.replace('-USDT', '')
            const price = String(payload.price ?? '0')
            const open24h = String(payload.open_24h ?? price)
            const high24h = String(payload.high_24h ?? price)
            const low24h = String(payload.low_24h ?? price)
            const volume24h = String(payload.volume_24h ?? '0')
            const priceValue = parseFloat(price || '0')
            const volumeInUsdt = (parseFloat(volume24h || '0') * priceValue).toString()
            const openPrice = parseFloat(open24h || '0')
            const priceChangePercentage = openPrice > 0
                ? (((priceValue - openPrice) / openPrice) * 100).toFixed(2)
                : '0.00'

            this.messageCallback?.({
                coin,
                price,
                open: open24h,
                high: high24h,
                low: low24h,
                priceChangePercentage,
                volume: volume24h,
                volumeInUSDT: volumeInUsdt
            })
        }

        this.ws.onclose = () => {
            if (this.closed) {
                return
            }
            this.reconnectTimer = setTimeout(() => {
                this.connect()
            }, RECONNECT_INTERVAL)
        }

        this.ws.onerror = () => {
            if (!this.closed) {
                this.ws?.close()
            }
        }
    }

    close() {
        this.closed = true
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
        const currentWs = this.ws
        this.ws = null
        currentWs?.close()
    }
}

class RestPollingSpotTickerClient implements SpotTickerClient {
    private messageCallback: ((coinPrice: CoinPrice) => void) | null = null
    private pollTimer: ReturnType<typeof setTimeout> | null = null
    private closed = false
    private started = false

    constructor(private readonly fetcher: () => Promise<CoinPrice[]>) {}

    setMessageCallback(callback: (coinPrice: CoinPrice) => void) {
        this.messageCallback = callback
        if (!this.started) {
            this.started = true
            this.connect()
        }
    }

    private connect() {
        if (this.closed) {
            return
        }

        const executePoll = async () => {
            if (this.closed) {
                return
            }

            try {
                const prices = await this.fetcher()
                prices.forEach((item) => {
                    this.messageCallback?.(item)
                })
            } finally {
                if (!this.closed) {
                    this.pollTimer = setTimeout(() => {
                        void executePoll()
                    }, REST_POLL_INTERVAL)
                }
            }
        }

        void executePoll()
    }

    close() {
        this.closed = true
        if (this.pollTimer) {
            clearTimeout(this.pollTimer)
            this.pollTimer = null
        }
    }
}

const buildSpotSymbolOptions = (symbols: string[], source: MarketDataSource) => {
    const optionsMap = new Map<string, TickerSymbolOption>()

    symbols.forEach((rawSymbol) => {
        const symbol = rawSymbol.toUpperCase()
        const normalizedSymbol = source === 'binance_spot'
            ? symbol
            : symbol.replace(/[-/]/g, '')
        if (!normalizedSymbol.endsWith('USDT') || normalizedSymbol.includes('_')) {
            return
        }

        const baseAsset = normalizedSymbol.slice(0, -4)
        if (!baseAsset) {
            return
        }

        if (!optionsMap.has(baseAsset)) {
            optionsMap.set(baseAsset, {
                value: baseAsset,
                label: `${baseAsset} / USDT`,
                symbol,
                baseAsset,
                quoteAsset: 'USDT'
            })
        }
    })

    return [...optionsMap.values()].sort((first, second) => first.value.localeCompare(second.value))
}

export const fetchSpotSymbolOptions = async (source: MarketDataSource) => {
    if (source === 'bybit_spot') {
        const payload = await fetchJson<{result?: {list?: Array<Record<string, any>>}}>(
            `${BYBIT_SPOT_REST_URL}/instruments-info?category=spot&limit=1000`,
            '获取 Bybit 现货币种列表失败'
        )

        const symbols = (Array.isArray(payload.result?.list) ? payload.result?.list : [])
            .filter((item) => String(item.status ?? '').toLowerCase() === 'trading')
            .filter((item) => String(item.quoteCoin ?? '').toUpperCase() === 'USDT')
            .map((item) => String(item.symbol ?? '').toUpperCase())
            .filter(Boolean)

        const options = buildSpotSymbolOptions(symbols, source)
        if (options.length === 0) {
            throw new Error('Bybit 返回的现货币种列表为空')
        }
        return options
    }

    if (source === 'bitget_spot') {
        const payload = await fetchJson<{data?: Array<Record<string, any>>}>(
            `${BITGET_SPOT_REST_URL}/public/symbols`,
            '获取 Bitget 现货币种列表失败'
        )

        const symbols = (Array.isArray(payload.data) ? payload.data : [])
            .filter((item) => String(item.status ?? '').toLowerCase() === 'online')
            .filter((item) => String(item.quoteCoin ?? '').toUpperCase() === 'USDT')
            .map((item) => String(item.symbol ?? '').toUpperCase())
            .filter(Boolean)

        const options = buildSpotSymbolOptions(symbols, source)
        if (options.length === 0) {
            throw new Error('Bitget 返回的现货币种列表为空')
        }
        return options
    }

    if (source === 'kucoin_spot') {
        const payload = await fetchJson<{data?: Array<Record<string, any>>}>(
            `${KUCOIN_SPOT_REST_V2_URL}/symbols`,
            '获取 KuCoin 现货币种列表失败'
        )

        const symbols = (Array.isArray(payload.data) ? payload.data : [])
            .filter((item) => Boolean(item.enableTrading))
            .filter((item) => String(item.quoteCurrency ?? '').toUpperCase() === 'USDT')
            .map((item) => String(item.symbol ?? '').toUpperCase())
            .filter(Boolean)

        const options = buildSpotSymbolOptions(symbols, source)
        if (options.length === 0) {
            throw new Error('KuCoin 返回的现货币种列表为空')
        }
        return options
    }

    if (source === 'kraken_spot') {
        return await new Promise<TickerSymbolOption[]>((resolve, reject) => {
            const webSocket = new WebSocket(KRAKEN_SPOT_WS_URL)
            const timer = window.setTimeout(() => {
                webSocket.close()
                reject(new Error('通过 Kraken 现货接口获取币种列表超时'))
            }, 8000)

            webSocket.onopen = () => {
                webSocket.send(JSON.stringify({
                    method: 'subscribe',
                    params: {
                        channel: 'instrument',
                        snapshot: true,
                        include_tokenized_assets: false
                    }
                }))
            }

            webSocket.onerror = () => {
                window.clearTimeout(timer)
                reject(new Error('通过 Kraken 现货接口获取币种列表失败'))
            }

            webSocket.onmessage = (event) => {
                const payload = JSON.parse(String(event.data))
                const pairs = payload?.channel === 'instrument' && payload?.type === 'snapshot'
                    ? payload?.data?.pairs
                    : null
                if (!Array.isArray(pairs)) {
                    return
                }

                const symbols = pairs
                    .filter((item: Record<string, any>) => String(item.status ?? '').toLowerCase() === 'online')
                    .map((item: Record<string, any>) => String(item.symbol ?? '').toUpperCase())
                    .filter(Boolean)

                const options = buildSpotSymbolOptions(symbols, source)
                window.clearTimeout(timer)
                webSocket.close()

                if (options.length === 0) {
                    reject(new Error('Kraken 返回的现货币种列表为空'))
                    return
                }

                resolve(options)
            }
        })
    }

    if (source === 'coinbase_spot') {
        return await new Promise<TickerSymbolOption[]>((resolve, reject) => {
            const webSocket = new WebSocket(COINBASE_SPOT_WS_URL)
            const timer = window.setTimeout(() => {
                webSocket.close()
                reject(new Error('通过 Coinbase 现货接口获取币种列表超时'))
            }, 8000)

            webSocket.onopen = () => {
                webSocket.send(JSON.stringify({
                    type: 'subscribe',
                    channels: [{name: 'status'}]
                }))
            }

            webSocket.onerror = () => {
                window.clearTimeout(timer)
                reject(new Error('通过 Coinbase 现货接口获取币种列表失败'))
            }

            webSocket.onmessage = (event) => {
                const payload = JSON.parse(String(event.data))
                const products = payload?.type === 'status' ? payload?.products : null
                if (!Array.isArray(products)) {
                    return
                }

                const symbols = products
                    .filter((item: Record<string, any>) => String(item.status ?? '').toLowerCase() === 'online')
                    .filter((item: Record<string, any>) => !Boolean(item.trading_disabled))
                    .map((item: Record<string, any>) => String(item.id ?? '').toUpperCase())
                    .filter(Boolean)

                const options = buildSpotSymbolOptions(symbols, source)
                window.clearTimeout(timer)
                webSocket.close()

                if (options.length === 0) {
                    reject(new Error('Coinbase 返回的现货币种列表为空'))
                    return
                }

                resolve(options)
            }
        })
    }

    if (source === 'okx_spot') {
        return await new Promise<TickerSymbolOption[]>((resolve, reject) => {
            const webSocket = new WebSocket(OKX_SPOT_WS_URL)
            const timer = window.setTimeout(() => {
                webSocket.close()
                reject(new Error('通过 OKX 现货接口获取币种列表超时'))
            }, 8000)

            webSocket.onopen = () => {
                webSocket.send(JSON.stringify({
                    op: 'subscribe',
                    args: [
                        {
                            channel: 'instruments',
                            instType: 'SPOT'
                        }
                    ]
                }))
            }

            webSocket.onerror = () => {
                window.clearTimeout(timer)
                reject(new Error('通过 OKX 现货接口获取币种列表失败'))
            }

            webSocket.onmessage = (event) => {
                const payload = JSON.parse(String(event.data))
                if (!Array.isArray(payload?.data)) {
                    return
                }

                const symbols = payload.data
                    .filter((item: Record<string, any>) => String(item.state ?? '').toLowerCase() === 'live')
                    .map((item: Record<string, any>) => String(item.instId ?? '').toUpperCase())
                    .filter(Boolean)

                const options = buildSpotSymbolOptions(symbols, source)
                window.clearTimeout(timer)
                webSocket.close()

                if (options.length === 0) {
                    reject(new Error('OKX 返回的现货币种列表为空'))
                    return
                }

                resolve(options)
            }
        })
    }

    return await new Promise<TickerSymbolOption[]>((resolve, reject) => {
        const webSocket = new WebSocket('wss://data-stream.binance.vision/ws/!ticker@arr')
        const timer = window.setTimeout(() => {
            webSocket.close()
            reject(new Error('通过 Binance 现货接口获取币种列表超时'))
        }, 8000)

        webSocket.onerror = () => {
            window.clearTimeout(timer)
            reject(new Error('通过 Binance 现货接口获取币种列表失败'))
        }

        webSocket.onmessage = (event) => {
            const payload = JSON.parse(String(event.data))
            const items = Array.isArray(payload) ? payload : []
            const symbols = items
                .map((item: Record<string, any>) => String(item.s ?? '').toUpperCase())
                .filter(Boolean)
            const options = buildSpotSymbolOptions(symbols, source)
            window.clearTimeout(timer)
            webSocket.close()

            if (options.length === 0) {
                reject(new Error('Binance 返回的现货币种列表为空'))
                return
            }

            resolve(options)
        }
    })
}

const fetchBybitSpotTickerSnapshot = async (coins: string[]) => {
    const symbolSet = new Set(coins.map((coin) => getSpotSymbolForSource('bybit_spot', coin)))
    const payload = await fetchJson<{result?: {list?: Array<Record<string, any>>}}>(
        `${BYBIT_SPOT_REST_URL}/tickers?category=spot`,
        '获取 Bybit 实时价格失败'
    )

    return (Array.isArray(payload.result?.list) ? payload.result?.list : [])
        .filter((item) => symbolSet.has(String(item.symbol ?? '').toUpperCase()))
        .map((item) => {
            const symbol = String(item.symbol ?? '').toUpperCase()
            const price = String(item.lastPrice ?? '0')
            const open = String(item.prevPrice24h ?? price)
            const priceChangePercentage = (toNumber(item.price24hPcnt) * 100).toFixed(2)
            return {
                coin: symbol.replace('USDT', ''),
                price,
                open,
                high: String(item.highPrice24h ?? price),
                low: String(item.lowPrice24h ?? price),
                priceChangePercentage,
                volume: String(item.volume24h ?? '0'),
                volumeInUSDT: String(item.turnover24h ?? '0')
            } satisfies CoinPrice
        })
}

const fetchBitgetSpotTickerSnapshot = async (coins: string[]) => {
    const symbolSet = new Set(coins.map((coin) => getSpotSymbolForSource('bitget_spot', coin)))
    const payload = await fetchJson<{data?: Array<Record<string, any>>}>(
        `${BITGET_SPOT_REST_URL}/market/tickers`,
        '获取 Bitget 实时价格失败'
    )

    return (Array.isArray(payload.data) ? payload.data : [])
        .filter((item) => symbolSet.has(String(item.symbol ?? '').toUpperCase()))
        .map((item) => {
            const symbol = String(item.symbol ?? '').toUpperCase()
            const price = String(item.lastPr ?? item.close ?? '0')
            const open = String(item.open ?? item.open24h ?? price)
            const openPrice = toNumber(open)
            const lastPrice = toNumber(price)
            const quoteVolume = String(item.usdtVolume ?? item.quoteVolume ?? '0')
            const computedChange = openPrice > 0
                ? (((lastPrice - openPrice) / openPrice) * 100).toFixed(2)
                : (toNumber(item.change24h) * 100).toFixed(2)

            return {
                coin: symbol.replace('USDT', ''),
                price,
                open,
                high: String(item.high24h ?? price),
                low: String(item.low24h ?? price),
                priceChangePercentage: computedChange,
                volume: String(item.baseVolume ?? item.volume ?? '0'),
                volumeInUSDT: quoteVolume
            } satisfies CoinPrice
        })
}

const fetchKuCoinSpotTickerSnapshot = async (coins: string[]) => {
    const symbolSet = new Set(coins.map((coin) => getSpotSymbolForSource('kucoin_spot', coin)))
    const payload = await fetchJson<{data?: {ticker?: Array<Record<string, any>>}}>(
        `${KUCOIN_SPOT_REST_URL}/market/allTickers`,
        '获取 KuCoin 实时价格失败'
    )

    return (Array.isArray(payload.data?.ticker) ? payload.data?.ticker : [])
        .filter((item) => symbolSet.has(String(item.symbol ?? '').toUpperCase()))
        .map((item) => {
            const symbol = String(item.symbol ?? '').toUpperCase()
            const price = String(item.last ?? '0')
            const changePrice = toNumber(item.changePrice)
            const changeRate = toNumber(item.changeRate)
            const openPrice = toNumber(price) - changePrice

            return {
                coin: symbol.replace('-USDT', ''),
                price,
                open: openPrice > 0 ? openPrice.toString() : price,
                high: String(item.high ?? price),
                low: String(item.low ?? price),
                priceChangePercentage: (changeRate * 100).toFixed(2),
                volume: String(item.vol ?? '0'),
                volumeInUSDT: String(item.volValue ?? '0')
            } satisfies CoinPrice
        })
}

export const createSpotTickerClient = (source: MarketDataSource, coins: string[]) => {
    if (source === 'kucoin_spot') {
        return new RestPollingSpotTickerClient(async () => await fetchKuCoinSpotTickerSnapshot(coins))
    }

    if (source === 'bitget_spot') {
        return new RestPollingSpotTickerClient(async () => await fetchBitgetSpotTickerSnapshot(coins))
    }

    if (source === 'bybit_spot') {
        return new RestPollingSpotTickerClient(async () => await fetchBybitSpotTickerSnapshot(coins))
    }

    if (source === 'coinbase_spot') {
        return new CoinbaseSpotTickerClient(coins)
    }

    if (source === 'kraken_spot') {
        return new KrakenSpotTickerClient(coins)
    }

    if (source === 'okx_spot') {
        return new OkxSpotTickerClient(coins)
    }

    return new BinanceSpotTickerClient(coins)
}

const toNumber = (value: unknown) => {
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : 0
}

const createSpotCandle = (
    openTime: number,
    closeTime: number,
    open: unknown,
    high: unknown,
    low: unknown,
    close: unknown,
    volume: unknown,
    quoteVolume: unknown
): SpotCandle => {
    return {
        openTime,
        closeTime,
        open: toNumber(open),
        high: toNumber(high),
        low: toNumber(low),
        close: toNumber(close),
        volume: toNumber(volume),
        quoteVolume: toNumber(quoteVolume)
    }
}

const normalizeSpotCandles = (candles: SpotCandle[], targetCount?: number) => {
    const deduplicated = new Map<number, SpotCandle>()

    candles.forEach((candle) => {
        if (!Number.isFinite(candle.openTime) || !Number.isFinite(candle.closeTime)) {
            return
        }
        if (
            [candle.open, candle.high, candle.low, candle.close, candle.volume, candle.quoteVolume]
                .some((value) => !Number.isFinite(value))
        ) {
            return
        }
        deduplicated.set(candle.openTime, candle)
    })

    const sorted = [...deduplicated.values()].sort((first, second) => first.openTime - second.openTime)
    if (!targetCount || sorted.length <= targetCount) {
        return sorted
    }
    return sorted.slice(-targetCount)
}

const buildWeekBucketKey = (timestamp: number) => {
    const date = new Date(timestamp)
    const weekday = date.getUTCDay() || 7
    date.setUTCHours(0, 0, 0, 0)
    date.setUTCDate(date.getUTCDate() - weekday + 1)
    return date.toISOString().slice(0, 10)
}

const buildMonthBucketKey = (timestamp: number) => {
    const date = new Date(timestamp)
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

const aggregateSpotCandles = (
    candles: SpotCandle[],
    bucketType: 'week' | 'month',
    targetCount: number
) => {
    const grouped = new Map<string, SpotCandle[]>()

    normalizeSpotCandles(candles).forEach((candle) => {
        const bucketKey = bucketType === 'week'
            ? buildWeekBucketKey(candle.openTime)
            : buildMonthBucketKey(candle.openTime)
        const bucket = grouped.get(bucketKey) ?? []
        bucket.push(candle)
        grouped.set(bucketKey, bucket)
    })

    const aggregated = [...grouped.values()].map((bucket) => {
        const sortedBucket = bucket.sort((first, second) => first.openTime - second.openTime)
        const first = sortedBucket[0]
        const last = sortedBucket[sortedBucket.length - 1]
        return createSpotCandle(
            first.openTime,
            last.closeTime,
            first.open,
            Math.max(...sortedBucket.map((item) => item.high)),
            Math.min(...sortedBucket.map((item) => item.low)),
            last.close,
            sortedBucket.reduce((sum, item) => sum + item.volume, 0),
            sortedBucket.reduce((sum, item) => sum + item.quoteVolume, 0)
        )
    })

    return normalizeSpotCandles(aggregated, targetCount)
}

const ensureOk = async (response: Response, errorPrefix: string) => {
    if (!response.ok) {
        throw new Error(`${errorPrefix}：${response.status}`)
    }
}

const fetchJson = async <T>(url: string, errorPrefix: string): Promise<T> => {
    const response = await fetch(url)
    await ensureOk(response, errorPrefix)
    return await response.json() as T
}

const getSpotSymbolForSource = (source: MarketDataSource, coin: string) => {
    const normalizedCoin = coin.toUpperCase()
    if (source === 'okx_spot' || source === 'coinbase_spot' || source === 'kucoin_spot') {
        return `${normalizedCoin}-USDT`
    }
    if (source === 'kraken_spot') {
        return `${normalizedCoin}/USDT`
    }
    return `${normalizedCoin}USDT`
}

const buildSpotCandleCacheKey = (source: MarketDataSource, coin: string, interval: SpotCandleInterval) => {
    return `${source}:${coin.toUpperCase()}:${interval}`
}

const getSpotCandleIntervalDurationMs = (interval: SpotCandleInterval) => {
    const durationMap: Record<SpotCandleInterval, number> = {
        '15m': 15 * 60 * 1000,
        '1h': 60 * 60 * 1000,
        '1d': 24 * 60 * 60 * 1000,
        '1w': 7 * 24 * 60 * 60 * 1000,
        '1M': 30 * 24 * 60 * 60 * 1000,
        all: 30 * 24 * 60 * 60 * 1000
    }
    return durationMap[interval]
}

const getCachedSpotCandles = (source: MarketDataSource, coin: string, interval: SpotCandleInterval) => {
    const cache = spotCandleCache.get(buildSpotCandleCacheKey(source, coin, interval))
    if (!cache) {
        return null
    }
    if (Date.now() - cache.updatedAt > SPOT_CANDLE_CACHE_TTL_MS) {
        spotCandleCache.delete(buildSpotCandleCacheKey(source, coin, interval))
        return null
    }
    return cache.candles
}

const setCachedSpotCandles = (
    source: MarketDataSource,
    coin: string,
    interval: SpotCandleInterval,
    candles: SpotCandle[]
) => {
    spotCandleCache.set(buildSpotCandleCacheKey(source, coin, interval), {
        updatedAt: Date.now(),
        candles
    })
}

const fetchBinanceSpotCandles = async (coin: string, interval: SpotCandleInterval) => {
    const binanceIntervalMap: Record<SpotCandleInterval, string> = {
        '15m': '15m',
        '1h': '1h',
        '1d': '1d',
        '1w': '1w',
        '1M': '1M',
        all: '1M'
    }
    const limit = SPOT_CANDLE_TARGET_COUNTS[interval]
    const symbol = getSpotSymbolForSource('binance_spot', coin)
    const payload = await fetchJson<Array<Array<string | number>>>(
        `${BINANCE_SPOT_REST_URL}/klines?symbol=${symbol}&interval=${binanceIntervalMap[interval]}&limit=${limit}`,
        '获取 Binance K 线失败'
    )

    return normalizeSpotCandles(payload.map((item) => createSpotCandle(
        toNumber(item[0]),
        toNumber(item[6]),
        item[1],
        item[2],
        item[3],
        item[4],
        item[5],
        item[7]
    )), limit)
}

const fetchOkxSpotCandles = async (coin: string, interval: SpotCandleInterval) => {
    const okxIntervalMap: Record<SpotCandleInterval, string> = {
        '15m': '15m',
        '1h': '1H',
        '1d': '1Dutc',
        '1w': '1Wutc',
        '1M': '1Mutc',
        all: '1Mutc'
    }
    const limit = SPOT_CANDLE_TARGET_COUNTS[interval]
    const symbol = getSpotSymbolForSource('okx_spot', coin)
    const payload = await fetchJson<{data?: Array<Array<string | number>>}>(
        `${OKX_SPOT_REST_URL}/market/history-candles?instId=${encodeURIComponent(symbol)}&bar=${okxIntervalMap[interval]}&limit=${limit}`,
        '获取 OKX K 线失败'
    )

    const candles = Array.isArray(payload.data) ? payload.data : []
    return normalizeSpotCandles(candles.map((item) => {
        const baseVolume = toNumber(item[5])
        const quoteVolume = toNumber(item[7] ?? item[6]) || (baseVolume * toNumber(item[4]))
        return createSpotCandle(
            toNumber(item[0]),
            toNumber(item[0]) + getSpotCandleIntervalDurationMs(interval),
            item[1],
            item[2],
            item[3],
            item[4],
            baseVolume,
            quoteVolume
        )
    }), limit)
}

const fetchBybitSpotCandles = async (coin: string, interval: SpotCandleInterval) => {
    const bybitIntervalMap: Record<SpotCandleInterval, string> = {
        '15m': '15',
        '1h': '60',
        '1d': 'D',
        '1w': 'W',
        '1M': 'M',
        all: 'M'
    }
    const limit = SPOT_CANDLE_TARGET_COUNTS[interval]
    const symbol = getSpotSymbolForSource('bybit_spot', coin)
    const payload = await fetchJson<{result?: {list?: Array<Array<string | number>>}}>(
        `${BYBIT_SPOT_REST_URL}/kline?category=spot&symbol=${symbol}&interval=${bybitIntervalMap[interval]}&limit=${limit}`,
        '获取 Bybit K 线失败'
    )

    const candles = (Array.isArray(payload.result?.list) ? payload.result?.list : []).map((item) => createSpotCandle(
        toNumber(item[0]),
        toNumber(item[0]) + getSpotCandleIntervalDurationMs(interval),
        item[1],
        item[2],
        item[3],
        item[4],
        item[5],
        item[6]
    ))

    return normalizeSpotCandles(candles, limit)
}

const fetchBitgetSpotCandles = async (coin: string, interval: SpotCandleInterval) => {
    const bitgetIntervalMap: Record<SpotCandleInterval, string> = {
        '15m': '15min',
        '1h': '1h',
        '1d': '1day',
        '1w': '1week',
        '1M': '1M',
        all: '1M'
    }
    const limit = SPOT_CANDLE_TARGET_COUNTS[interval]
    const symbol = getSpotSymbolForSource('bitget_spot', coin)
    const payload = await fetchJson<{data?: Array<Array<string | number>>}>(
        `${BITGET_SPOT_REST_URL}/market/candles?symbol=${symbol}&granularity=${bitgetIntervalMap[interval]}&limit=${limit}`,
        '获取 Bitget K 线失败'
    )

    const candles = (Array.isArray(payload.data) ? payload.data : []).map((item) => createSpotCandle(
        toNumber(item[0]),
        toNumber(item[0]) + getSpotCandleIntervalDurationMs(interval),
        item[1],
        item[2],
        item[3],
        item[4],
        item[5],
        item[7] ?? item[6]
    ))

    return normalizeSpotCandles(candles, limit)
}

const fetchKuCoinCandlesWindow = async (
    symbol: string,
    type: string,
    startAt?: number,
    endAt?: number
) => {
    const search = new URLSearchParams({
        symbol,
        type
    })
    if (typeof startAt === 'number') {
        search.set('startAt', String(startAt))
    }
    if (typeof endAt === 'number') {
        search.set('endAt', String(endAt))
    }

    const payload = await fetchJson<{data?: Array<Array<string | number>>}>(
        `${KUCOIN_SPOT_REST_URL}/market/candles?${search.toString()}`,
        '获取 KuCoin K 线失败'
    )

    return normalizeSpotCandles((Array.isArray(payload.data) ? payload.data : []).map((item) => {
        const openTime = toNumber(item[0]) * 1000
        return createSpotCandle(
            openTime,
            openTime + getSpotCandleIntervalDurationMs(type === '15min' ? '15m' : type === '1hour' ? '1h' : '1d'),
            item[1],
            item[3],
            item[4],
            item[2],
            item[5],
            item[6]
        )
    }))
}

const fetchKuCoinDailyCandles = async (coin: string, dailyCount: number) => {
    const symbol = getSpotSymbolForSource('kucoin_spot', coin)
    const candles: SpotCandle[] = []
    let currentEndAt = Math.floor(Date.now() / 1000)
    let requestCount = 0

    while (candles.length < dailyCount) {
        requestCount += 1
        if (requestCount > 12) {
            break
        }
        const currentStartAt = currentEndAt - (1500 * 24 * 60 * 60)
        const batch = await fetchKuCoinCandlesWindow(symbol, '1day', currentStartAt, currentEndAt)
        if (batch.length === 0) {
            break
        }
        candles.unshift(...batch)
        currentEndAt = Math.floor(batch[0].openTime / 1000) - 24 * 60 * 60
        if (batch.length < 1400) {
            break
        }
    }

    return normalizeSpotCandles(candles, dailyCount)
}

const fetchKuCoinSpotCandles = async (coin: string, interval: SpotCandleInterval) => {
    if (interval === '1M' || interval === 'all') {
        const dailyCandles = await fetchKuCoinDailyCandles(coin, interval === '1M' ? 450 : 9000)
        return aggregateSpotCandles(dailyCandles, 'month', SPOT_CANDLE_TARGET_COUNTS[interval])
    }

    const typeMap: Record<'15m' | '1h' | '1d' | '1w', string> = {
        '15m': '15min',
        '1h': '1hour',
        '1d': '1day',
        '1w': '1week'
    }
    const symbol = getSpotSymbolForSource('kucoin_spot', coin)
    const candles = await fetchKuCoinCandlesWindow(symbol, typeMap[interval as '15m' | '1h' | '1d' | '1w'])
    return normalizeSpotCandles(candles, SPOT_CANDLE_TARGET_COUNTS[interval])
}

const fetchKrakenSpotCandlesByRest = async (coin: string, interval: SpotCandleInterval) => {
    const krakenIntervalMap: Record<SpotCandleInterval, number> = {
        '15m': 15,
        '1h': 60,
        '1d': 1440,
        '1w': 10080,
        '1M': 1440,
        all: 21600
    }
    const pairCandidates = coin.toUpperCase() === 'BTC'
        ? [`${coin}/USDT`, 'XBT/USDT', `${coin}USDT`, 'XBTUSDT']
        : [`${coin}/USDT`, `${coin}USDT`]

    for (const pair of pairCandidates) {
        try {
            const payload = await fetchJson<{error?: string[]; result?: Record<string, Array<Array<string | number>> | number>}>(
                `${KRAKEN_SPOT_REST_URL}/OHLC?pair=${encodeURIComponent(pair)}&interval=${krakenIntervalMap[interval]}`,
                '获取 Kraken K 线失败'
            )

            if (Array.isArray(payload.error) && payload.error.length > 0) {
                continue
            }

            const result = payload.result ?? {}
            const seriesEntry = Object.entries(result).find(([key, value]) => key !== 'last' && Array.isArray(value))
            if (!seriesEntry) {
                continue
            }

            const candles = (seriesEntry[1] as Array<Array<string | number>>).map((item) => {
                const openTime = toNumber(item[0]) * 1000
                const close = toNumber(item[4])
                const volume = toNumber(item[6])
                const vwap = toNumber(item[5])
                const intervalDurationMs = krakenIntervalMap[interval] * 60 * 1000
                return createSpotCandle(
                    openTime,
                    openTime + intervalDurationMs,
                    item[1],
                    item[2],
                    item[3],
                    close,
                    volume,
                    volume * (vwap || close)
                )
            })

            return normalizeSpotCandles(
                interval === '1M' || interval === 'all'
                    ? aggregateSpotCandles(candles, 'month', SPOT_CANDLE_TARGET_COUNTS[interval])
                    : candles,
                SPOT_CANDLE_TARGET_COUNTS[interval]
            )
        } catch (_error) {
            // 继续尝试下一个 pair 候选。
        }
    }

    throw new Error('获取 Kraken K 线失败：未找到可用交易对')
}

const fetchKrakenSpotCandles = async (coin: string, interval: SpotCandleInterval) => {
    const krakenIntervalMap: Record<Exclude<SpotCandleInterval, '1M' | 'all'>, number> = {
        '15m': 15,
        '1h': 60,
        '1d': 1440,
        '1w': 10080
    }

    if (interval === '1M' || interval === 'all') {
        return await fetchKrakenSpotCandlesByRest(coin, interval)
    }

    try {
        const candles = await new Promise<SpotCandle[]>((resolve, reject) => {
            const webSocket = new WebSocket(KRAKEN_SPOT_WS_URL)
            const timer = window.setTimeout(() => {
                webSocket.close()
                reject(new Error('通过 Kraken WebSocket 获取 K 线超时'))
            }, 8000)

            webSocket.onopen = () => {
                webSocket.send(JSON.stringify({
                    method: 'subscribe',
                    params: {
                        channel: 'ohlc',
                        snapshot: true,
                        symbol: [getSpotSymbolForSource('kraken_spot', coin)],
                        interval: krakenIntervalMap[interval]
                    }
                }))
            }

            webSocket.onerror = () => {
                window.clearTimeout(timer)
                reject(new Error('通过 Kraken WebSocket 获取 K 线失败'))
            }

            webSocket.onmessage = (event) => {
                const payload = JSON.parse(String(event.data))
                if (payload?.channel !== 'ohlc' || payload?.type !== 'snapshot' || !Array.isArray(payload?.data)) {
                    return
                }

                const snapshotCandles = payload.data.map((item: Record<string, unknown>) => {
                    const openTime = Date.parse(String(item.interval_begin ?? item.timestamp ?? ''))
                    const close = toNumber(item.close)
                    const volume = toNumber(item.volume)
                    const vwap = toNumber(item.vwap)
                    return createSpotCandle(
                        openTime,
                        openTime + getSpotCandleIntervalDurationMs(interval),
                        item.open,
                        item.high,
                        item.low,
                        close,
                        volume,
                        volume * (vwap || close)
                    )
                })

                window.clearTimeout(timer)
                webSocket.close()
                resolve(normalizeSpotCandles(snapshotCandles, SPOT_CANDLE_TARGET_COUNTS[interval]))
            }
        })

        if (candles.length >= 10) {
            return candles
        }
    } catch (_error) {
        // 回退到 REST。
    }

    return await fetchKrakenSpotCandlesByRest(coin, interval)
}

const fetchCoinbaseCandlesWindow = async (
    productId: string,
    granularity: number,
    startAt?: Date,
    endAt?: Date
) => {
    const search = new URLSearchParams({
        granularity: String(granularity)
    })
    if (startAt) {
        search.set('start', startAt.toISOString())
    }
    if (endAt) {
        search.set('end', endAt.toISOString())
    }

    const payload = await fetchJson<Array<Array<number>>>(
        `${COINBASE_SPOT_REST_URL}/products/${encodeURIComponent(productId)}/candles?${search.toString()}`,
        '获取 Coinbase K 线失败'
    )

    return normalizeSpotCandles(payload.map((item) => {
        const openTime = toNumber(item[0]) * 1000
        const close = toNumber(item[4])
        const volume = toNumber(item[5])
        return createSpotCandle(
            openTime,
            openTime + (granularity * 1000),
            item[3],
            item[2],
            item[1],
            close,
            volume,
            volume * close
        )
    }))
}

const fetchCoinbaseDailyCandles = async (coin: string, dailyCount: number) => {
    const productId = getSpotSymbolForSource('coinbase_spot', coin)
    const granularity = 86400
    const candles: SpotCandle[] = []
    let currentEnd = new Date()
    let requestCount = 0

    while (candles.length < dailyCount) {
        requestCount += 1
        if (requestCount > 40) {
            break
        }
        const batchSize = Math.min(300, dailyCount - candles.length)
        const currentStart = new Date(currentEnd.getTime() - (batchSize * granularity * 1000))
        const batch = await fetchCoinbaseCandlesWindow(productId, granularity, currentStart, currentEnd)
        if (batch.length === 0) {
            break
        }
        candles.unshift(...batch)
        const oldest = batch[0]
        currentEnd = new Date(oldest.openTime - 1000)
        if (batch.length < batchSize) {
            break
        }
    }

    return normalizeSpotCandles(candles)
}

const fetchCoinbaseSpotCandles = async (coin: string, interval: SpotCandleInterval) => {
    const productId = getSpotSymbolForSource('coinbase_spot', coin)
    if (interval === '1w') {
        const dailyCandles = await fetchCoinbaseDailyCandles(coin, (SPOT_CANDLE_TARGET_COUNTS['1w'] * 7) + 14)
        return aggregateSpotCandles(dailyCandles, 'week', SPOT_CANDLE_TARGET_COUNTS['1w'])
    }

    if (interval === '1M') {
        const dailyCandles = await fetchCoinbaseDailyCandles(coin, 400)
        return aggregateSpotCandles(dailyCandles, 'month', SPOT_CANDLE_TARGET_COUNTS['1M'])
    }

    if (interval === 'all') {
        const dailyCandles = await fetchCoinbaseDailyCandles(coin, 9000)
        return aggregateSpotCandles(dailyCandles, 'month', SPOT_CANDLE_TARGET_COUNTS.all)
    }

    const granularityMap: Record<'15m' | '1h' | '1d', number> = {
        '15m': 900,
        '1h': 3600,
        '1d': 86400
    }
    const directInterval = interval as '15m' | '1h' | '1d'
    const limit = SPOT_CANDLE_TARGET_COUNTS[directInterval]
    const endAt = new Date()
    const startAt = new Date(endAt.getTime() - (limit * granularityMap[directInterval] * 1000))
    const candles = await fetchCoinbaseCandlesWindow(productId, granularityMap[directInterval], startAt, endAt)
    return normalizeSpotCandles(candles, limit)
}

const fetchSpotCandlesUncached = async (source: MarketDataSource, coin: string, interval: SpotCandleInterval) => {
    if (source === 'kucoin_spot') {
        return await fetchKuCoinSpotCandles(coin, interval)
    }

    if (source === 'bitget_spot') {
        return await fetchBitgetSpotCandles(coin, interval)
    }

    if (source === 'bybit_spot') {
        return await fetchBybitSpotCandles(coin, interval)
    }

    if (source === 'coinbase_spot') {
        return await fetchCoinbaseSpotCandles(coin, interval)
    }

    if (source === 'kraken_spot') {
        return await fetchKrakenSpotCandles(coin, interval)
    }

    if (source === 'okx_spot') {
        return await fetchOkxSpotCandles(coin, interval)
    }

    return await fetchBinanceSpotCandles(coin, interval)
}

export const fetchSpotCandles = async (
    source: MarketDataSource,
    coin: string,
    interval: SpotCandleInterval,
    forceRefresh = false
) => {
    if (!forceRefresh) {
        const cached = getCachedSpotCandles(source, coin, interval)
        if (cached) {
            return cached
        }
    }

    const candles = await fetchSpotCandlesUncached(source, coin, interval)
    if (candles.length === 0) {
        throw new Error(`未获取到 ${coin.toUpperCase()} 的 ${getSpotCandleIntervalLabel(interval)} K 线数据`)
    }
    setCachedSpotCandles(source, coin, interval, candles)
    return candles
}

export const summarizeSpotCandles = (candles: SpotCandle[]): SpotCandleSummary | null => {
    const normalized = normalizeSpotCandles(candles)
    if (normalized.length === 0) {
        return null
    }

    const first = normalized[0]
    const last = normalized[normalized.length - 1]
    const high = Math.max(...normalized.map((item) => item.high))
    const low = Math.min(...normalized.map((item) => item.low))
    const volume = normalized.reduce((sum, item) => sum + item.volume, 0)
    const quoteVolume = normalized.reduce((sum, item) => sum + item.quoteVolume, 0)
    const averageClose = normalized.reduce((sum, item) => sum + item.close, 0) / normalized.length
    const changePercentage = first.open > 0
        ? ((last.close - first.open) / first.open) * 100
        : 0
    const amplitudePercentage = low > 0
        ? ((high - low) / low) * 100
        : 0

    return {
        open: first.open,
        close: last.close,
        high,
        low,
        volume,
        quoteVolume,
        changePercentage,
        amplitudePercentage,
        averageClose
    }
}
