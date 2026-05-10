import type {SpotMetricPoint} from "./spotAssetMetrics.ts";

export interface MarketSentimentPoint extends SpotMetricPoint {
    classification: string;
}

export type MarketSentimentRange = '7d' | '30d' | '90d' | '1y' | 'max'

interface AlternativeFearGreedItem {
    value?: string;
    value_classification?: string;
    timestamp?: string;
}

interface AlternativeFearGreedResponse {
    data?: AlternativeFearGreedItem[];
}

const ALTERNATIVE_FEAR_GREED_API_URL = 'https://api.alternative.me/fng/'
const MARKET_SENTIMENT_CACHE_TTL_MS = 30 * 60 * 1000

let historyCache: {updatedAt: number; points: MarketSentimentPoint[]} | null = null
let historyPromise: Promise<MarketSentimentPoint[]> | null = null

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

export const fetchMarketSentimentHistory = async (forceRefresh = false) => {
    if (!forceRefresh && historyCache && (Date.now() - historyCache.updatedAt) < MARKET_SENTIMENT_CACHE_TTL_MS) {
        return historyCache.points
    }

    if (!forceRefresh && historyPromise) {
        return await historyPromise
    }

    historyPromise = (async () => {
        const payload = await fetchJson<AlternativeFearGreedResponse>(
            `${ALTERNATIVE_FEAR_GREED_API_URL}?limit=0&format=json`,
            '获取市场情绪指数失败'
        )

        const points = (Array.isArray(payload.data) ? payload.data : [])
            .map((item) => ({
                timestamp: toNumber(item.timestamp) * 1000,
                value: toNumber(item.value),
                classification: String(item.value_classification ?? '')
            }))
            .filter((item) => Number.isFinite(item.timestamp) && Number.isFinite(item.value) && item.value >= 0)
            .sort((first, second) => first.timestamp - second.timestamp)

        historyCache = {
            updatedAt: Date.now(),
            points
        }
        return points
    })()

    try {
        return await historyPromise
    } finally {
        historyPromise = null
    }
}

export const sliceMarketSentimentHistory = (points: MarketSentimentPoint[], range: MarketSentimentRange) => {
    if (range === 'max') {
        return points
    }

    const latest = points[points.length - 1]
    if (!latest) {
        return []
    }

    const rangeMsMap: Record<Exclude<MarketSentimentRange, 'max'>, number> = {
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
        '90d': 90 * 24 * 60 * 60 * 1000,
        '1y': 365 * 24 * 60 * 60 * 1000
    }

    const cutoff = latest.timestamp - rangeMsMap[range]
    return points.filter((item) => item.timestamp >= cutoff)
}

export const resolveMarketSentimentAccent = (value: number) => {
    if (value >= 55) {
        return 'emerald' as const
    }
    if (value <= 44) {
        return 'amber' as const
    }
    return 'sky' as const
}
