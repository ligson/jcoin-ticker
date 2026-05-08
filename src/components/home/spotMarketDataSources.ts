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

export interface SpotTickerClient {
    setMessageCallback(callback: (coinPrice: CoinPrice) => void): void;
    close(): void;
}

const RECONNECT_INTERVAL = 5000
const BINANCE_SPOT_WS_PREFIX = 'wss://data-stream.binance.vision/stream?streams='
const OKX_SPOT_WS_URL = 'wss://ws.okx.com:8443/ws/v5/public'
const KRAKEN_SPOT_WS_URL = 'wss://ws.kraken.com/v2'
const COINBASE_SPOT_WS_URL = 'wss://ws-feed.exchange.coinbase.com'

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
    }
]

export const marketDataSourceLabelMap: Record<MarketDataSource, string> = {
    binance_spot: 'Binance 现货',
    okx_spot: 'OKX 现货',
    kraken_spot: 'Kraken 现货',
    coinbase_spot: 'Coinbase 现货'
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

export const createSpotTickerClient = (source: MarketDataSource, coins: string[]) => {
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
