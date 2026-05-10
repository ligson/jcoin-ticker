export interface SpotAssetMetricsSnapshot {
    coinId: string;
    name: string;
    symbol: string;
    rank: number | null;
    marketCap: number | null;
    volume24h: number | null;
    circulatingSupply: number | null;
    totalSupply: number | null;
    maxSupply: number | null;
    firstDataAt: string | null;
    lastUpdated: string | null;
}

export interface SpotMetricPoint {
    timestamp: number;
    value: number;
}

export type SpotAssetMetricHistoryInterval = '24h' | '7d' | '30d' | '90d' | '1y'

interface CoinPaprikaSearchCurrency {
    id?: string;
    symbol?: string;
    rank?: number;
    is_active?: boolean;
    type?: string;
}

interface CoinPaprikaSearchResponse {
    currencies?: CoinPaprikaSearchCurrency[];
}

interface CoinPaprikaTickerResponse {
    id?: string;
    name?: string;
    symbol?: string;
    rank?: number | string | null;
    circulating_supply?: number | string | null;
    total_supply?: number | string | null;
    max_supply?: number | string | null;
    first_data_at?: string | null;
    last_updated?: string | null;
    quotes?: {
        USD?: {
            market_cap?: number | string | null;
            volume_24h?: number | string | null;
        };
    };
}

interface CoinPaprikaHistoricalPoint {
    timestamp?: string;
    market_cap?: number | string | null;
}

const COIN_PAPRIKA_API_URL = 'https://api.coinpaprika.com/v1'
const SPOT_ASSET_METRICS_CACHE_TTL_MS = 5 * 60 * 1000

const coinIdCache = new Map<string, {updatedAt: number; coinId: string}>()
const snapshotCache = new Map<string, {updatedAt: number; snapshot: SpotAssetMetricsSnapshot}>()
const marketCapSeriesCache = new Map<string, {updatedAt: number; points: SpotMetricPoint[]}>()

const toNumber = (value: unknown) => {
    const numberValue = Number(value)
    return Number.isFinite(numberValue) ? numberValue : 0
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

const getCachedValue = <T>(
    cache: Map<string, {updatedAt: number; [key: string]: any}>,
    key: string,
    valueKey: string
) => {
    const cached = cache.get(key)
    if (!cached) {
        return null
    }
    if (Date.now() - cached.updatedAt > SPOT_ASSET_METRICS_CACHE_TTL_MS) {
        cache.delete(key)
        return null
    }
    return cached[valueKey] as T
}

const resolveCoinPaprikaCoinId = async (coin: string) => {
    const cacheKey = coin.toUpperCase()
    const cachedCoinId = getCachedValue<string>(coinIdCache, cacheKey, 'coinId')
    if (cachedCoinId) {
        return cachedCoinId
    }

    const search = new URLSearchParams({
        q: coin,
        c: 'currencies',
        modifier: 'symbol_search',
        limit: '20'
    })

    const payload = await fetchJson<CoinPaprikaSearchResponse>(
        `${COIN_PAPRIKA_API_URL}/search?${search.toString()}`,
        '搜索 CoinPaprika 币种失败'
    )

    const matched = (Array.isArray(payload.currencies) ? payload.currencies : [])
        .filter((item) => String(item.symbol ?? '').toUpperCase() === cacheKey)
        .filter((item) => item.is_active !== false)
        .sort((first, second) => {
            const firstRank = toNumber(first.rank || Number.MAX_SAFE_INTEGER)
            const secondRank = toNumber(second.rank || Number.MAX_SAFE_INTEGER)
            if (firstRank !== secondRank) {
                return firstRank - secondRank
            }

            const firstCoinTypeScore = String(first.type ?? '') === 'coin' ? 0 : 1
            const secondCoinTypeScore = String(second.type ?? '') === 'coin' ? 0 : 1
            if (firstCoinTypeScore !== secondCoinTypeScore) {
                return firstCoinTypeScore - secondCoinTypeScore
            }

            return String(first.id ?? '').localeCompare(String(second.id ?? ''))
        })

    const target = matched[0]
    if (!target?.id) {
        throw new Error(`未在 CoinPaprika 中找到 ${cacheKey} 的市值数据映射`)
    }

    coinIdCache.set(cacheKey, {
        updatedAt: Date.now(),
        coinId: target.id
    })
    return target.id
}

export const fetchSpotAssetMetricsSnapshot = async (coin: string, forceRefresh = false) => {
    const cacheKey = coin.toUpperCase()
    if (!forceRefresh) {
        const cached = getCachedValue<SpotAssetMetricsSnapshot>(snapshotCache, cacheKey, 'snapshot')
        if (cached) {
            return cached
        }
    }

    const coinId = await resolveCoinPaprikaCoinId(coin)
    const payload = await fetchJson<CoinPaprikaTickerResponse>(
        `${COIN_PAPRIKA_API_URL}/tickers/${encodeURIComponent(coinId)}?quotes=USD`,
        '获取 CoinPaprika 当前指标失败'
    )

    const usdQuote = payload.quotes?.USD
    const snapshot: SpotAssetMetricsSnapshot = {
        coinId,
        name: String(payload.name ?? coin.toUpperCase()),
        symbol: String(payload.symbol ?? coin.toUpperCase()),
        rank: Number.isFinite(Number(payload.rank)) ? Number(payload.rank) : null,
        marketCap: usdQuote?.market_cap == null ? null : toNumber(usdQuote.market_cap),
        volume24h: usdQuote?.volume_24h == null ? null : toNumber(usdQuote.volume_24h),
        circulatingSupply: payload.circulating_supply == null ? null : toNumber(payload.circulating_supply),
        totalSupply: payload.total_supply == null ? null : toNumber(payload.total_supply),
        maxSupply: payload.max_supply == null ? null : toNumber(payload.max_supply),
        firstDataAt: payload.first_data_at ?? null,
        lastUpdated: payload.last_updated ?? null
    }

    snapshotCache.set(cacheKey, {
        updatedAt: Date.now(),
        snapshot
    })
    return snapshot
}

const buildMarketCapHistoryRequest = (interval: SpotAssetMetricHistoryInterval) => {
    const now = Date.now()
    const configMap: Record<SpotAssetMetricHistoryInterval, {lookbackMs: number; requestInterval: string}> = {
        '24h': {lookbackMs: 24 * 60 * 60 * 1000, requestInterval: '1h'},
        '7d': {lookbackMs: 7 * 24 * 60 * 60 * 1000, requestInterval: '24h'},
        '30d': {lookbackMs: 30 * 24 * 60 * 60 * 1000, requestInterval: '1d'},
        '90d': {lookbackMs: 90 * 24 * 60 * 60 * 1000, requestInterval: '1d'},
        '1y': {lookbackMs: 365 * 24 * 60 * 60 * 1000, requestInterval: '7d'}
    }
    const config = configMap[interval]

    return {
        startAt: new Date(now - config.lookbackMs),
        endAt: new Date(now),
        requestInterval: config.requestInterval
    }
}

export const fetchSpotMarketCapHistory = async (
    coin: string,
    interval: SpotAssetMetricHistoryInterval,
    forceRefresh = false
) => {
    const cacheKey = `${coin.toUpperCase()}:${interval}`
    if (!forceRefresh) {
        const cached = getCachedValue<SpotMetricPoint[]>(marketCapSeriesCache, cacheKey, 'points')
        if (cached) {
            return cached
        }
    }

    const coinId = await resolveCoinPaprikaCoinId(coin)
    const {startAt, endAt, requestInterval} = buildMarketCapHistoryRequest(interval)
    const search = new URLSearchParams({
        start: startAt.toISOString(),
        end: endAt.toISOString(),
        quote: 'usd',
        interval: requestInterval,
        limit: '5000'
    })

    const payload = await fetchJson<CoinPaprikaHistoricalPoint[]>(
        `${COIN_PAPRIKA_API_URL}/tickers/${encodeURIComponent(coinId)}/historical?${search.toString()}`,
        '获取 CoinPaprika 市值历史失败'
    )

    const points = (Array.isArray(payload) ? payload : [])
        .map((item) => ({
            timestamp: Date.parse(String(item.timestamp ?? '')),
            value: toNumber(item.market_cap)
        }))
        .filter((item) => Number.isFinite(item.timestamp) && Number.isFinite(item.value) && item.value > 0)
        .sort((first, second) => first.timestamp - second.timestamp)

    marketCapSeriesCache.set(cacheKey, {
        updatedAt: Date.now(),
        points
    })
    return points
}
