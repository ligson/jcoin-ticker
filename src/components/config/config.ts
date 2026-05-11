export type MarketDataSource =
    | 'binance_spot'
    | 'okx_spot'
    | 'kraken_spot'
    | 'coinbase_spot'
    | 'bybit_spot'
    | 'bitget_spot'
    | 'kucoin_spot'

export interface ProxyConfig {
    enabled: boolean;
    server: string;
    bypassRules: string;
    ignoreCertificateErrors: boolean;
}

export interface FloatingWindowConfig {
    enabled: boolean;
    opacity: number;
}

export interface AppConfig {
    coins: string[];
    proxy: ProxyConfig;
    marketDataSource: MarketDataSource;
    floatingWindow: FloatingWindowConfig;
}

export const defaultProxyConfig: ProxyConfig = {
    enabled: false,
    server: '',
    bypassRules: '',
    ignoreCertificateErrors: false
}

export const defaultFloatingWindowConfig: FloatingWindowConfig = {
    enabled: false,
    opacity: 86
}

export const defaultAppConfig: AppConfig = {
    coins: ['BTC', 'ETH', 'CRV', 'S'],
    proxy: {
        ...defaultProxyConfig
    },
    marketDataSource: 'binance_spot',
    floatingWindow: {
        ...defaultFloatingWindowConfig
    }
}

export const normalizeAppConfig = (value: Partial<AppConfig> | null | undefined): AppConfig => {
    const coins = Array.isArray(value?.coins) && value?.coins.length > 0 ? value.coins : defaultAppConfig.coins
    const proxy = value?.proxy ?? defaultProxyConfig
    const floatingWindow = value?.floatingWindow ?? defaultFloatingWindowConfig
    const opacity = Number(floatingWindow.opacity)

    return {
        coins: [...coins],
        proxy: {
            enabled: Boolean(proxy.enabled),
            server: proxy.server ?? '',
            bypassRules: proxy.bypassRules ?? '',
            ignoreCertificateErrors: Boolean(proxy.ignoreCertificateErrors)
        },
        marketDataSource: ['okx_spot', 'kraken_spot', 'coinbase_spot', 'bybit_spot', 'bitget_spot', 'kucoin_spot'].includes(String(value?.marketDataSource))
            ? value?.marketDataSource as MarketDataSource
            : 'binance_spot',
        floatingWindow: {
            enabled: Boolean(floatingWindow.enabled),
            opacity: Number.isFinite(opacity) ? Math.min(100, Math.max(45, Math.round(opacity))) : defaultFloatingWindowConfig.opacity
        }
    }
}
