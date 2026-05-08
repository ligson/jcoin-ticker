import {app, BrowserWindow, ipcMain, net, session} from 'electron'
import {fileURLToPath} from 'node:url'
import path from 'node:path'
import Store from 'electron-store'
import {AppConfig, ProxyConfig, normalizeAppConfig} from '../src/components/config/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// 创建 Store 实例
const store = new Store()
const TICKER_SYMBOL_CACHE_KEY = 'tickerSymbolCache'
const TICKER_SYMBOL_CACHE_TTL_MS = 12 * 60 * 60 * 1000
const BINANCE_HOSTS = new Set([
    'api.binance.com',
    'data-api.binance.vision',
    'fstream.binance.com',
    'stream.binance.com',
    'data-stream.binance.vision'
])
const SUPPORTED_MARKET_DATA_HOSTS = new Set([
    ...BINANCE_HOSTS,
    'ws.okx.com',
    'ws.kraken.com',
    'ws-feed.exchange.coinbase.com'
])
const BINANCE_TICKER_SYMBOL_ENDPOINTS = [
    'https://fapi.binance.com/fapi/v1/exchangeInfo'
]

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │soub
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let refreshingTickerSymbolCachePromise: Promise<TickerSymbolCache> | null = null

interface TickerSymbolOption {
    value: string;
    label: string;
    symbol: string;
    baseAsset: string;
    quoteAsset: string;
}

interface TickerSymbolCache {
    updatedAt: number;
    options: TickerSymbolOption[];
}

// 添加 electron-store IPC 处理
ipcMain.handle('store-get', (_, key, defaultValue) => {
    return store.get(key, defaultValue)
})

ipcMain.handle('store-set', (_, key, value) => {
    store.set(key, value)
})

ipcMain.handle('store-delete', (_, key) => {
    store.delete(key)
})

ipcMain.handle('store-clear', () => {
    store.clear()
})

ipcMain.handle('store-has', (_, key) => {
    return store.has(key)
})

ipcMain.handle('store-reset', (_, key, defaultValue) => {
    return store.reset(key, defaultValue)
})

ipcMain.handle('store-get-all', () => {
    return store.store
})

ipcMain.handle('proxy-apply', async (_, proxyConfig: ProxyConfig) => {
    await applyProxyConfig(proxyConfig)
})

ipcMain.handle('ticker-symbol-options-get', async (_, forceRefresh?: boolean) => {
    return await getTickerSymbolCache(Boolean(forceRefresh))
})

function getAppConfig(): AppConfig {
    return normalizeAppConfig(store.get('appConfig') as AppConfig | null)
}

async function applyProxyConfig(proxyConfig: ProxyConfig) {
    const proxyServer = proxyConfig.server.trim()
    const bypassRules = proxyConfig.bypassRules.trim()
    const ignoreCertificateErrors = proxyConfig.ignoreCertificateErrors

    if (!proxyConfig.enabled || !proxyServer) {
        await session.defaultSession.setProxy({
            mode: 'system'
        })
        applyCertificateVerifyPolicy(ignoreCertificateErrors)
        await session.defaultSession.closeAllConnections()
        return
    }

    await session.defaultSession.setProxy({
        mode: 'fixed_servers',
        proxyRules: proxyServer,
        proxyBypassRules: bypassRules
    })
    applyCertificateVerifyPolicy(ignoreCertificateErrors)
    await session.defaultSession.closeAllConnections()
}

function applyCertificateVerifyPolicy(ignoreCertificateErrors: boolean) {
    session.defaultSession.setCertificateVerifyProc((request, callback) => {
        if (ignoreCertificateErrors && SUPPORTED_MARKET_DATA_HOSTS.has(request.hostname)) {
            callback(0)
            return
        }
        callback(-3)
    })
}

function getStoredTickerSymbolCache(): TickerSymbolCache | null {
    const value = store.get(TICKER_SYMBOL_CACHE_KEY) as TickerSymbolCache | null
    if (!value || typeof value.updatedAt !== 'number' || !Array.isArray(value.options)) {
        return null
    }

    return {
        updatedAt: value.updatedAt,
        options: value.options
    }
}

function isTickerSymbolCacheFresh(cache: TickerSymbolCache) {
    return Date.now() - cache.updatedAt < TICKER_SYMBOL_CACHE_TTL_MS
}

async function fetchTickerSymbolOptionsFromBinance(): Promise<TickerSymbolOption[]> {
    let lastError: Error | null = null

    for (const endpoint of BINANCE_TICKER_SYMBOL_ENDPOINTS) {
        try {
            const response = await net.fetch(endpoint)
            if (!response.ok) {
                lastError = new Error(`获取币安币种列表失败：${response.status}`)
                continue
            }

            const payload = await response.json() as { symbols?: Array<Record<string, any>> }
            if (!Array.isArray(payload.symbols)) {
                lastError = new Error('币安返回的币种列表格式不正确')
                continue
            }

            const optionsMap = new Map<string, TickerSymbolOption>()
            payload.symbols.forEach((item) => {
                const quoteAsset = String(item.quoteAsset ?? '').toUpperCase()
                const status = String(item.status ?? '').toUpperCase()
                const contractType = String(item.contractType ?? '').toUpperCase()
                const baseAsset = String(item.baseAsset ?? '').toUpperCase()
                const symbol = String(item.symbol ?? '').toUpperCase()

                if (quoteAsset !== 'USDT' || status !== 'TRADING' || contractType !== 'PERPETUAL' || !baseAsset || !symbol) {
                    return
                }

                if (!optionsMap.has(baseAsset)) {
                    optionsMap.set(baseAsset, {
                        value: baseAsset,
                        label: `${baseAsset} / USDT 永续`,
                        symbol,
                        baseAsset,
                        quoteAsset
                    })
                }
            })

            return [...optionsMap.values()].sort((first, second) => first.value.localeCompare(second.value))
        } catch (error: any) {
            lastError = error instanceof Error ? error : new Error(String(error))
        }
    }

    try {
        return await fetchTickerSymbolOptionsFromFuturesWebSocket()
    } catch (webSocketError: any) {
        if (lastError) {
            throw lastError
        }
        throw webSocketError instanceof Error ? webSocketError : new Error(String(webSocketError))
    }
}

function buildTickerSymbolOptions(symbols: string[]): TickerSymbolOption[] {
    const optionsMap = new Map<string, TickerSymbolOption>()

    symbols.forEach((rawSymbol) => {
        const symbol = rawSymbol.toUpperCase()
        if (!symbol.endsWith('USDT') || symbol.includes('_')) {
            return
        }

        const baseAsset = symbol.slice(0, -4)
        if (!baseAsset) {
            return
        }

        if (!optionsMap.has(baseAsset)) {
            optionsMap.set(baseAsset, {
                value: baseAsset,
                label: `${baseAsset} / USDT 永续`,
                symbol,
                baseAsset,
                quoteAsset: 'USDT'
            })
        }
    })

    return [...optionsMap.values()].sort((first, second) => first.value.localeCompare(second.value))
}

async function fetchTickerSymbolOptionsFromFuturesWebSocket(): Promise<TickerSymbolOption[]> {
    return await new Promise((resolve, reject) => {
        const webSocket = new WebSocket('wss://fstream.binance.com/ws/!ticker@arr')
        const timer = setTimeout(() => {
            webSocket.close()
            reject(new Error('通过币安合约 WebSocket 获取币种列表超时'))
        }, 8000)

        webSocket.onerror = () => {
            clearTimeout(timer)
            reject(new Error('通过币安合约 WebSocket 获取币种列表失败'))
        }

        webSocket.onmessage = (event) => {
            clearTimeout(timer)
            try {
                const payload = JSON.parse(String(event.data))
                const items = Array.isArray(payload) ? payload : []
                const symbols = items
                    .map((item: Record<string, any>) => String(item.s ?? '').toUpperCase())
                    .filter(Boolean)
                const options = buildTickerSymbolOptions(symbols)
                webSocket.close()

                if (options.length === 0) {
                    reject(new Error('通过币安合约 WebSocket 获取到的币种列表为空'))
                    return
                }

                resolve(options)
            } catch (error: any) {
                webSocket.close()
                reject(error instanceof Error ? error : new Error(String(error)))
            }
        }
    })
}

async function refreshTickerSymbolCache(): Promise<TickerSymbolCache> {
    if (refreshingTickerSymbolCachePromise) {
        return await refreshingTickerSymbolCachePromise
    }

    refreshingTickerSymbolCachePromise = (async () => {
        const options = await fetchTickerSymbolOptionsFromBinance()
        const cache: TickerSymbolCache = {
            updatedAt: Date.now(),
            options
        }
        store.set(TICKER_SYMBOL_CACHE_KEY, cache)
        return cache
    })()

    try {
        return await refreshingTickerSymbolCachePromise
    } finally {
        refreshingTickerSymbolCachePromise = null
    }
}

async function getTickerSymbolCache(forceRefresh: boolean): Promise<TickerSymbolCache> {
    const storedCache = getStoredTickerSymbolCache()

    if (!forceRefresh && storedCache) {
        if (!isTickerSymbolCacheFresh(storedCache)) {
            void refreshTickerSymbolCache().catch(() => {
                // 后台刷新失败时保留旧缓存，避免阻塞页面使用。
            })
        }
        return storedCache
    }

    try {
        return await refreshTickerSymbolCache()
    } catch (error) {
        if (storedCache) {
            return storedCache
        }
        throw error
    }
}

async function createWindow() {
    await applyProxyConfig(getAppConfig().proxy)

    win = new BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC, 'btc.ico'),
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
        },
    })

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString())
    })

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
    } else {
        // win.loadFile('dist/index.html')
        win.loadFile(path.join(RENDERER_DIST, 'index.html'))
    }
}

// 最后一个窗口关闭后直接退出应用，避免开发时进程残留。
app.on('window-all-closed', () => {
    app.quit()
    win = null
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        void createWindow()
    }
})

app.whenReady().then(() => {
    void createWindow()
})
