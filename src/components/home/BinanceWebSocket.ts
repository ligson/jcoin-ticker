export interface CoinPrice {
    coin: string,
    price: string,
    open: string,
    high: string,
    low: string,
    priceChangePercentage: string,
    volume: string,        // 24小时交易量(基础货币)
    volumeInUSDT: string,  // 24小时交易量(USDT计价)
}

export default class BinanceWebSocket {
    static wsUrlPrefix = "wss://fstream.binance.com/stream?streams="
    private messageCallback: ((coinPrice: CoinPrice) => void) | null = null
    private coins: string[] = []
    private ws: WebSocket | null = null
    private reconnectInterval = 5000 // 重连间隔5秒
    private reconnectTimer: NodeJS.Timeout | null = null

    constructor(coins: string[]) {
        this.coins = coins
        this.init(coins)
    }

    setMessageCallback(callback: (coinPrice: CoinPrice) => void) {
        this.messageCallback = callback
    }

    init(coins: string[]) {
        // 清除之前的重连定时器
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }

        const wsUrl = coins.map(coin => `${coin.toLowerCase()}usdt@ticker`).join('/')
        this.ws = new WebSocket(BinanceWebSocket.wsUrlPrefix + wsUrl)

        this.ws.onopen = () => {
            console.log("WebSocket connected")
        }

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
            if (this.messageCallback) {
                this.messageCallback(coinPrice)
            }
        }

        this.ws.onclose = () => {
            console.log("WebSocket closed, will reconnect in 5 seconds...")
            // 设置重连定时器
            this.reconnectTimer = setTimeout(() => {
                this.init(this.coins)
            }, this.reconnectInterval)
        }

        this.ws.onerror = (error) => {
            console.error("WebSocket error:", error)
            // 发生错误时关闭连接，触发重连机制
            if (this.ws) {
                this.ws.close()
            }
        }
    }

    // 提供手动关闭连接的方法
    close() {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
        if (this.ws) {
            this.ws.close()
        }
    }
}
