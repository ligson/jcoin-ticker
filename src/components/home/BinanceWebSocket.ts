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

    constructor(coins: string[]) {
        this.init(coins)
    }

    setMessageCallback(callback: (coinPrice: CoinPrice) => void) {
        this.messageCallback = callback
    }

    init(coins: string[]) {
        const wsUrl = coins.map(coin => `${coin.toLowerCase()}usdt@ticker`).join('/')
        const ws = new WebSocket(BinanceWebSocket.wsUrlPrefix + wsUrl)
        ws.onopen = () => {
            console.log("WebSocket connected")
        }
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            const coinPrice: CoinPrice = {
                coin: data.data.s.replace('USDT', ''),
                price: data.data.c,
                open: data.data.o,
                high: data.data.h,
                low: data.data.l,
                priceChangePercentage: data.data.P,
                volume: data.data.v,  // 基础货币交易量
                volumeInUSDT: (parseFloat(data.data.v) * parseFloat(data.data.c)).toString(),  // USDT计价交易量
            }
            if (this.messageCallback) {
                this.messageCallback(coinPrice)
            }

        }
        ws.onclose = () => {
            console.log("WebSocket closed")
        }
        ws.onerror = (error) => {
            console.error(error)
        }
    }
}
