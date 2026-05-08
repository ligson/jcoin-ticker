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
- `Menu.vue`：顶部导航，负责主页、设置、帮助切换。
- `config/router.ts`：路由注册与路径配置。
- `config/store.ts`：Renderer 侧访问 preload 暴露的存储接口。
- `components/home/`：实时行情列表界面与可切换的现货数据源适配层。
- `components/home/spotTickerRuntime.ts`：全局后台现货行情运行时，负责跨页面复用实时连接。
- `components/setting/`：设置页壳与各个设置子页面。
- `components/help/`：帮助页，占位状态。
- `components/config/`：共享配置结构与默认配置。

### `electron/`

Electron 进程代码。

- `main.ts`：窗口创建、IPC 处理、应用生命周期管理。
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
- 现货数据源适配层：`src/components/home/spotMarketDataSources.ts`
- 后台现货行情运行时：`src/components/home/spotTickerRuntime.ts`
- 币种设置页面：`src/components/setting/pages/tickercoin/TickerCoinPage.vue`
- 代理设置页面：`src/components/setting/pages/proxy/ProxySettingPage.vue`
- 数据源设置页面：`src/components/setting/pages/datasource/DataSourceSettingPage.vue`
- 配置结构定义：`src/components/config/config.ts`
- Electron 存储桥接：`electron/preload.ts`
- Electron 存储处理：`electron/main.ts`
- CI 发布流程：`.github/workflows/BuildAndPackage.yml`

## 文档维护规则

- 面向使用者的行为变化时，要更新 `README.md`。
- 目录结构、关键文件或职责边界变化时，要更新本文档。
- 每次有意义的代码或文档变动，都要更新 `CHANGELOG.md`。
- 文档默认优先使用中文编写，必要时再保留少量英文技术名词。
