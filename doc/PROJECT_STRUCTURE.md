# 项目结构

## 顶层结构

```text
jcoin-ticker/
├── AGENTS.md
├── CHANGELOG.md
├── README.md
├── doc/
├── electron/
├── public/
├── src/
├── dist-electron/
├── package.json
├── vite.config.ts
├── electron-builder.json5
└── forge.config.cjs
```

## 目录职责

### `src/`

Renderer 源码目录。

- `main.ts`：初始化 Vue、Ant Design Vue、路由和全局存储访问。
- `App.vue`：整体页面布局壳。
- `Menu.vue`：顶部导航，负责主页、设置切换。
- `config/router.ts`：路由注册与路径配置。
- `config/store.ts`：Renderer 侧访问 preload 暴露的存储接口。
- `components/home/`：实时行情列表界面与可切换的现货数据源适配层。
- `components/home/SpotDetailPage.vue`：币种详情页，展示常见周期、全部走势 K 线和市场摘要。
- `components/home/SpotCandleChart.vue`：详情页使用的 K 线图表组件。
- `components/home/SpotMetricTrendChart.vue`：详情页扩展指标走势组件，用于显示市值、成交量、成交额曲线。
- `components/home/MarketSentimentPanel.vue`：首页全局市场情绪指数面板。
- `components/home/marketSentiment.ts`：首页市场情绪数据访问，负责读取 Alternative.me Fear & Greed Index 历史数据。
- `components/home/spotAssetMetrics.ts`：详情页辅助指标数据访问，负责读取公开市值与市值历史数据。
- `components/home/spotTickerRuntime.ts`：全局后台现货行情运行时，负责跨页面复用实时连接。
- `components/floating/FloatingTickerWindow.vue`：桌面悬浮盯盘窗口，展示紧凑版关注列表、涨跌幅和轻量走势背景。
- `components/setting/`：设置页壳与各个设置子页面。
- `components/setting/pages/floating/FloatingWindowSettingPage.vue`：悬浮窗设置页，负责显示开关与透明度设置。
- `components/setting/pages/about/AboutPage.vue`：关于页，展示工具简介、版本、GitHub 项目入口和更新按钮。
- `components/help/`：帮助页，占位状态。
- `components/config/`：共享配置结构与默认配置。

### `electron/`

Electron 进程代码。

- `main.ts`：窗口创建、IPC 处理、应用生命周期管理，包括主窗口与受设置页控制的透明悬浮窗。
- `preload.ts`：向 Renderer 安全暴露 IPC 和 `storeAPI`。
- `main.ts` 当前主要负责代理应用、证书校验策略和本地存储 IPC。

### `public/`

应用运行和打包时使用的静态资源目录，包含图标等文件。

### `doc/`

项目文档和示例截图目录。

- `example.png`：当前示例截图。
- `PROJECT_OVERVIEW.md`：项目用途、运行结构和行为说明。
- `PROJECT_STRUCTURE.md`：给协作者和 agent 使用的结构定位文档。

### `dist-electron/`

Electron 相关生成产物目录，可用于运行和打包流程。
除非任务明确要求处理生成结果，否则不要把这里当作主源码目录。

## 关键文件定位

- 实时行情界面：`src/components/home/HomePage.vue`
- 桌面悬浮窗界面：`src/components/floating/FloatingTickerWindow.vue`
- 币种详情页：`src/components/home/SpotDetailPage.vue`
- K 线图表组件：`src/components/home/SpotCandleChart.vue`
- 现货数据源适配层：`src/components/home/spotMarketDataSources.ts`
- 后台现货行情运行时：`src/components/home/spotTickerRuntime.ts`
- 币种设置页面：`src/components/setting/pages/tickercoin/TickerCoinPage.vue`
- 代理设置页面：`src/components/setting/pages/proxy/ProxySettingPage.vue`
- 数据源设置页面：`src/components/setting/pages/datasource/DataSourceSettingPage.vue`
- 悬浮窗设置页面：`src/components/setting/pages/floating/FloatingWindowSettingPage.vue`
- 配置结构定义：`src/components/config/config.ts`
- Electron 存储桥接：`electron/preload.ts`
- Electron 存储处理：`electron/main.ts`
- CI 发布流程：`.github/workflows/BuildAndPackage.yml`

## 文档维护规则

- 面向使用者的行为变化时，要更新 `README.md`。
- 目录结构、关键文件或职责边界变化时，要更新本文档。
- 每次有意义的代码或文档变动，都要更新 `CHANGELOG.md`。
- 文档默认优先使用中文编写，必要时再保留少量英文技术名词。
