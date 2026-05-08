# 项目概览

## 项目实际作用

`jcoin-ticker` 是一个桌面端数字货币盯盘工具。
它会连接可切换的公开现货行情流，订阅多个 `USDT` 现货交易对，并展示用户自定义币种列表的实时价格和 24 小时统计信息。

## 主要使用流程

1. 启动 Electron 桌面应用。
2. 打开首页查看实时行情列表。
3. 打开设置页，通过搜索下拉选择要监控的现货币种，或配置网络代理、切换数据源。
4. 关闭后再次打开应用，继续使用上次保存的币种和代理配置。

## 运行结构

### Renderer 层

- 基于 Vue 3 + TypeScript + Ant Design Vue。
- 通过 Vue Router 管理 `home`、`setting`、`help` 页面。
- 通过 preload 暴露出来的 `storeAPI` 读写本地配置。
- Renderer 内维护一个全局后台现货行情运行时，页面切换时不会销毁实时连接。
- 设置页中的币种选择基于当前数据源的本地缓存币种列表做搜索过滤，避免一次性渲染大量选项。

### Main 进程

- 负责创建 Electron `BrowserWindow`。
- 通过 IPC 暴露 `electron-store` 的读写能力。
- 开发时加载 Vite dev server，构建后加载本地打包产物。

### 数据来源

- 当前支持 `Binance 现货`、`OKX 现货`、`Kraken 现货`、`Coinbase 现货` 四个公开、免 API Key 的数据源。
- Binance 现货 WebSocket：
  `wss://data-stream.binance.vision/stream?streams=...`
- OKX 现货公共 WebSocket：
  `wss://ws.okx.com:8443/ws/v5/public`
- Kraken 现货公共 WebSocket：
  `wss://ws.kraken.com/v2`
- Coinbase Exchange 公共 WebSocket：
  `wss://ws-feed.exchange.coinbase.com`
- 每条行情消息都会被转换成前端统一使用的 `CoinPrice` 对象。
- 币种选择数据来自当前数据源的公开现货接口/现货 WebSocket 快照，并在本地缓存后定期刷新。

## 持久化数据

- 存储方案：`electron-store`
- 当前主要配置键：`appConfig`
- 当前结构：

```ts
{
  coins: string[]
  proxy: {
    enabled: boolean
    server: string
    bypassRules: string
    ignoreCertificateErrors: boolean
  }
  marketDataSource: 'binance_spot' | 'okx_spot' | 'kraken_spot' | 'coinbase_spot'
}
```

## 关键行为

- 页面中的币种顺序跟随用户配置顺序。
- 已存在的币种数据会在原位置更新，而不是重新插入。
- WebSocket 断开后会自动按固定间隔重连。
- 设置页中的币种变更会立即写入本地存储。
- 代理设置保存后会立即应用到后续网络请求。
- 代理设置可选地放行已支持公开数据源的证书错误，用于兼容会替换 HTTPS 证书的代理环境。
- 数据源切换后，首页实时价格和监控币种下拉会一起切换。
- 监控币种、数据源、代理变更会直接重配或重连后台那一个现货连接，而不是等主页重新进入后再建连。
- 首页监听的是后台运行时里的统一实时状态，收到新消息后会立即更新，不需要通过页面切换触发重渲染。
- 币种下拉数据会优先读取当前数据源的本地缓存；只有本地没有缓存或用户手动刷新时才重新请求，并且只提供首页行情源支持的 `USDT` 现货币种。

## 构建与发布说明

- 前端构建工具：Vite
- 桌面壳：Electron
- 仓库里同时保留了 `electron-builder` 与 Electron Forge 相关打包命令。
- GitHub Actions 中已经存在基于 tag 的多平台打包发布流程。

## 当前限制

- 目前没有自动化测试。
- `Help` / `About` 页面还没有实际内容。
- Renderer 路由基路径设置为 `/icoin/`，调整路由策略时要注意这一点。
