import {app, BrowserWindow, ipcMain, net, screen, session, shell} from 'electron'
import {fileURLToPath} from 'node:url'
import path from 'node:path'
import Store from 'electron-store'
import {AppConfig, FloatingWindowConfig, ProxyConfig, normalizeAppConfig} from '../src/components/config/config'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// 创建 Store 实例
const store = new Store()
const TICKER_SYMBOL_CACHE_KEY = 'tickerSymbolCache'
const TICKER_SYMBOL_CACHE_TTL_MS = 12 * 60 * 60 * 1000
const FLOATING_WINDOW_BOUNDS_KEY = 'floatingWindowBounds'
const GITHUB_REPOSITORY_URL = 'https://github.com/ligson/jcoin-ticker'
const GITHUB_RELEASES_URL = `${GITHUB_REPOSITORY_URL}/releases`
const GITHUB_LATEST_RELEASE_API_URL = 'https://api.github.com/repos/ligson/jcoin-ticker/releases/latest'
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
let floatingWin: BrowserWindow | null = null
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

interface FloatingWindowBounds {
    width: number;
    height: number;
    x?: number;
    y?: number;
}

interface GitHubReleaseAsset {
    name?: string;
    browser_download_url?: string;
}

interface GitHubLatestReleaseResponse {
    tag_name?: string;
    html_url?: string;
    body?: string;
    published_at?: string;
    assets?: GitHubReleaseAsset[];
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

ipcMain.handle('floating-window-show', async () => {
    const window = await createFloatingWindow()
    window.show()
    window.focus()
    window.setAlwaysOnTop(true, 'screen-saver')
    return true
})

ipcMain.handle('floating-window-hide', () => {
    floatingWin?.hide()
    return true
})

ipcMain.handle('floating-window-sync', async (_, floatingWindowConfig?: FloatingWindowConfig) => {
    await syncFloatingWindowWithConfig(floatingWindowConfig)
    return true
})

ipcMain.handle('floating-window-fit-content', (_, size?: { width?: number; height?: number }) => {
    if (!floatingWin || floatingWin.isDestroyed()) {
        return false
    }

    const display = screen.getDisplayMatching(floatingWin.getBounds())
    const workArea = display.workArea
    const currentBounds = floatingWin.getBounds()
    const requestedWidth = Number(size?.width)
    const requestedHeight = Number(size?.height)
    const width = Number.isFinite(requestedWidth)
        ? Math.min(420, Math.max(280, Math.round(requestedWidth)))
        : currentBounds.width
    const height = Number.isFinite(requestedHeight)
        ? Math.min(workArea.height - 32, Math.max(160, Math.round(requestedHeight)))
        : currentBounds.height

    floatingWin.setBounds({
        ...currentBounds,
        width,
        height
    })
    saveFloatingWindowBounds(floatingWin)
    return true
})

ipcMain.handle('app-about-info-get', () => {
    return {
        name: app.getName(),
        version: app.getVersion(),
        repositoryUrl: GITHUB_REPOSITORY_URL,
        releasesUrl: GITHUB_RELEASES_URL
    }
})

ipcMain.handle('app-repository-open', async () => {
    await shell.openExternal(GITHUB_REPOSITORY_URL)
    return true
})

ipcMain.handle('app-update-check', async () => {
    const release = await fetchLatestGitHubRelease()
    const currentVersion = normalizeVersion(app.getVersion())
    const latestVersion = normalizeVersion(String(release.tag_name ?? ''))
    const hasUpdate = compareVersions(latestVersion, currentVersion) > 0
    const downloadAsset = pickReleaseAssetForCurrentPlatform(Array.isArray(release.assets) ? release.assets : [])
    const targetUrl = downloadAsset?.browser_download_url || release.html_url || GITHUB_RELEASES_URL

    if (hasUpdate) {
        await shell.openExternal(targetUrl)
    }

    return {
        currentVersion,
        latestVersion,
        hasUpdate,
        repositoryUrl: GITHUB_REPOSITORY_URL,
        releasesUrl: GITHUB_RELEASES_URL,
        releaseUrl: release.html_url || GITHUB_RELEASES_URL,
        downloadUrl: targetUrl,
        assetName: downloadAsset?.name || '',
        publishedAt: release.published_at || ''
    }
})

function getAppConfig(): AppConfig {
    return normalizeAppConfig(store.get('appConfig') as AppConfig | null)
}

function normalizeVersion(version: string) {
    return version.trim().replace(/^v/i, '').split('-')[0]
}

function compareVersions(left: string, right: string) {
    const leftParts = normalizeVersion(left).split('.').map((item) => Number.parseInt(item, 10) || 0)
    const rightParts = normalizeVersion(right).split('.').map((item) => Number.parseInt(item, 10) || 0)
    const maxLength = Math.max(leftParts.length, rightParts.length)

    for (let index = 0; index < maxLength; index += 1) {
        const leftValue = leftParts[index] ?? 0
        const rightValue = rightParts[index] ?? 0
        if (leftValue === rightValue) {
            continue
        }
        return leftValue > rightValue ? 1 : -1
    }

    return 0
}

function pickReleaseAssetForCurrentPlatform(assets: GitHubReleaseAsset[]) {
    const platform = process.platform
    const matchers = platform === 'darwin'
        ? [
            (asset: GitHubReleaseAsset) => /Mac/i.test(String(asset.name)) && /\.dmg$/i.test(String(asset.name)),
            (asset: GitHubReleaseAsset) => /\.dmg$/i.test(String(asset.name))
        ]
        : platform === 'win32'
            ? [
                (asset: GitHubReleaseAsset) => /Windows/i.test(String(asset.name)) && /\.exe$/i.test(String(asset.name)),
                (asset: GitHubReleaseAsset) => /\.exe$/i.test(String(asset.name))
            ]
            : [
                (asset: GitHubReleaseAsset) => /Linux/i.test(String(asset.name)) && /\.AppImage$/i.test(String(asset.name)),
                (asset: GitHubReleaseAsset) => /\.AppImage$/i.test(String(asset.name))
            ]

    for (const matcher of matchers) {
        const matchedAsset = assets.find((asset) => matcher(asset) && asset.browser_download_url)
        if (matchedAsset) {
            return matchedAsset
        }
    }

    return assets.find((asset) => asset.browser_download_url)
}

async function fetchLatestGitHubRelease() {
    const response = await net.fetch(GITHUB_LATEST_RELEASE_API_URL, {
        headers: {
            'Accept': 'application/vnd.github+json',
            'User-Agent': `${app.getName()}/${app.getVersion()}`
        }
    })

    if (!response.ok) {
        throw new Error(`获取 GitHub 最新版本失败：${response.status}`)
    }

    return await response.json() as GitHubLatestReleaseResponse
}

function getFloatingWindowOpacity(floatingWindowConfig?: FloatingWindowConfig) {
    const config = floatingWindowConfig ?? getAppConfig().floatingWindow
    return Math.min(0.96, Math.max(0.45, config.opacity / 100))
}

function getStoredFloatingWindowBounds(): FloatingWindowBounds {
    const storedValue = store.get(FLOATING_WINDOW_BOUNDS_KEY) as Partial<FloatingWindowBounds> | null
    const width = Number(storedValue?.width)
    const height = Number(storedValue?.height)
    const x = Number(storedValue?.x)
    const y = Number(storedValue?.y)

    return {
        width: Number.isFinite(width) && width >= 300 ? width : 320,
        height: Number.isFinite(height) && height >= 220 ? height : 380,
        x: Number.isFinite(x) ? x : undefined,
        y: Number.isFinite(y) ? y : undefined
    }
}

function saveFloatingWindowBounds(window: BrowserWindow) {
    if (window.isDestroyed()) {
        return
    }
    const bounds = window.getBounds()
    store.set(FLOATING_WINDOW_BOUNDS_KEY, {
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y
    })
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

async function loadRendererWindow(window: BrowserWindow, search?: string) {
    if (VITE_DEV_SERVER_URL) {
        const url = new URL(VITE_DEV_SERVER_URL)
        if (search) {
            url.search = search
        }
        await window.loadURL(url.toString())
        return
    }

    if (search) {
        await window.loadFile(path.join(RENDERER_DIST, 'index.html'), {
            search
        })
        return
    }

    await window.loadFile(path.join(RENDERER_DIST, 'index.html'))
}

async function createMainWindow() {
    await applyProxyConfig(getAppConfig().proxy)

    win = new BrowserWindow({
        icon: path.join(process.env.VITE_PUBLIC, 'btc.ico'),
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
        },
    })

    win.on('closed', () => {
        if (floatingWin && !floatingWin.isDestroyed()) {
            floatingWin.destroy()
            floatingWin = null
        }
        win = null
    })

    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString())
    })

    await loadRendererWindow(win)
}

async function createFloatingWindow(floatingWindowConfig?: FloatingWindowConfig) {
    if (floatingWin && !floatingWin.isDestroyed()) {
        floatingWin.setOpacity(getFloatingWindowOpacity(floatingWindowConfig))
        return floatingWin
    }

    const bounds = getStoredFloatingWindowBounds()
    floatingWin = new BrowserWindow({
        width: bounds.width,
        height: bounds.height,
        x: bounds.x,
        y: bounds.y,
        minWidth: 300,
        minHeight: 160,
        maxWidth: 420,
        alwaysOnTop: true,
        frame: false,
        transparent: true,
        hasShadow: true,
        resizable: false,
        skipTaskbar: true,
        backgroundColor: '#00000000',
        title: '悬浮盯盘',
        opacity: getFloatingWindowOpacity(floatingWindowConfig),
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.mjs'),
        },
    })

    floatingWin.on('move', () => {
        if (floatingWin) {
            saveFloatingWindowBounds(floatingWin)
        }
    })

    floatingWin.on('resize', () => {
        if (floatingWin) {
            saveFloatingWindowBounds(floatingWin)
        }
    })

    floatingWin.on('close', () => {
        if (floatingWin) {
            saveFloatingWindowBounds(floatingWin)
        }
    })

    floatingWin.on('closed', () => {
        floatingWin = null
    })

    await loadRendererWindow(floatingWin, 'window=floating')
    return floatingWin
}

async function syncFloatingWindowWithConfig(floatingWindowConfig?: FloatingWindowConfig) {
    const config = floatingWindowConfig ?? getAppConfig().floatingWindow

    if (!config.enabled) {
        floatingWin?.hide()
        return
    }

    const window = await createFloatingWindow(config)
    window.setOpacity(getFloatingWindowOpacity(config))
    window.showInactive()
    window.setAlwaysOnTop(true, 'screen-saver')
}

// 最后一个窗口关闭后直接退出应用，避免开发时进程残留。
app.on('window-all-closed', () => {
    app.quit()
    win = null
    floatingWin = null
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        void createMainWindow()
    }
})

app.whenReady().then(() => {
    void createMainWindow()
    void syncFloatingWindowWithConfig()
})
