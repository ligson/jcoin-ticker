export type MarketDataSource = 'binance_spot' | 'okx_spot' | 'kraken_spot' | 'coinbase_spot'

export interface ProxyConfig {
    enabled: boolean;
    server: string;
    bypassRules: string;
    ignoreCertificateErrors: boolean;
}

export interface AppConfig {
    coins: string[];
    proxy: ProxyConfig;
    marketDataSource: MarketDataSource;
}

export const defaultProxyConfig: ProxyConfig = {
    enabled: false,
    server: '',
    bypassRules: '',
    ignoreCertificateErrors: false
}

export const defaultAppConfig: AppConfig = {
    coins: ['BTC', 'ETH', 'CRV', 'S'],
    proxy: {
        ...defaultProxyConfig
    },
    marketDataSource: 'binance_spot'
}

export const normalizeAppConfig = (value: Partial<AppConfig> | null | undefined): AppConfig => {
    const coins = Array.isArray(value?.coins) && value?.coins.length > 0 ? value.coins : defaultAppConfig.coins
    const proxy = value?.proxy ?? defaultProxyConfig

    return {
        coins: [...coins],
        proxy: {
            enabled: Boolean(proxy.enabled),
            server: proxy.server ?? '',
            bypassRules: proxy.bypassRules ?? '',
            ignoreCertificateErrors: Boolean(proxy.ignoreCertificateErrors)
        },
        marketDataSource: ['okx_spot', 'kraken_spot', 'coinbase_spot'].includes(String(value?.marketDataSource))
            ? value?.marketDataSource as MarketDataSource
            : 'binance_spot'
    }
}
