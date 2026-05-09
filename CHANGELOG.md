# 变更记录

仓库中所有有意义的改动都应该记录在这里。

## 记录规则

- 使用倒序记录，新的改动写在前面。
- 按版本分组维护；未发版的改动先写入 `## [未发布]`。
- 发版前将 `未发布` 中需要发布的内容整理到与 `package.json` 对应的版本章节，例如 `## [0.0.18] - 2026-05-08`。
- GitHub Release 会优先读取与当前 tag/version 对应的版本章节作为发布说明。
- 记录内容保持简短、具体。
- 纯文档改动也要记录。

## [未发布]

### 变更

- 暂无

## [0.0.33] - 2026-05-10

### 变更

- 将 `package.json` 版本号提升到 `0.0.33`，用于重新触发 GitHub Actions 并彻底修复 mac 打包阶段仍命中 `cdn.npmmirror.com` 的问题。
- 调整 GitHub Actions 中 `electron-builder` 的运行方式：不再通过 `pnpm build` 间接启动 `electron-builder`，改为在同一 shell 中直接执行 `vue-tsc`、`vite build` 和 `node node_modules/electron-builder/cli.js --publish never`，绕开 `pnpm` 将 `.npmrc` 中 `electron_mirror=npmmirror` 注入子进程环境后覆盖 `dmg-builder` 下载源的问题。
- 将 `electron-builder` 运行时补丁改为基于 `require.resolve()` 命中真实安装路径，并继续修复 `ReadWrite` 导入与二进制镜像函数，避免 `pnpm` 布局差异导致补丁落空。

## [0.0.32] - 2026-05-10

### 变更

- 将 `package.json` 版本号提升到 `0.0.32`，用于重新触发 GitHub Actions 并彻底修复上一版 `node -e` 补丁脚本仍受 shell 展开干扰的问题。
- 将 GitHub Actions 中的 `electron-builder` 运行时补丁从单行 `node -e` 改为 heredoc 形式的 `node <<'NODE'`，避免反引号与 ``${...}`` 模板字符串在 shell 层被提前解析，确保 `binDownload.js` 的镜像函数补丁原样生效。

## [0.0.31] - 2026-05-10

### 变更

- 将 `package.json` 版本号提升到 `0.0.31`，用于重新触发 GitHub Actions 并修复上一版 workflow 中 `node -e` 补丁脚本的模板字符串被 shell 提前展开的问题。
- 对 `electron-builder` 运行时补丁中的 ``${githubOrgRepo}`` 进行 shell 层转义，确保 `beforeMirror` / `afterMirror` 能正确匹配并替换 `binDownload.js` 内的镜像函数实现。

## [0.0.30] - 2026-05-10

### 变更

- 将 `package.json` 版本号提升到 `0.0.30`，用于重新触发 GitHub Actions 并修复 mac 打包阶段 `dmg-builder` 仍错误命中 `cdn.npmmirror.com` 的问题。
- 扩展 GitHub Actions 中的 `electron-builder` 运行时补丁：除修复 `ReadWrite` 导入外，同步将 `app-builder-lib/out/binDownload.js` 的 `getBinariesMirrorUrl()` 固定到 GitHub 官方 `electron-builder-binaries` release 地址，避免 `dmg-builder` 下载链路再次落回错误镜像。
- 保留前一版对顶层 `@electron/get/dist/cjs/types` 的相对路径修复，继续绕开 `app-builder-lib` 包内嵌套空壳 `types.js` 的导出问题。

## [0.0.29] - 2026-05-10

### 变更

- 将 `package.json` 版本号提升到 `0.0.29`，用于重新触发 GitHub Actions 并修复 mac 打包阶段补丁仍命中错误 `@electron/get` 副本的问题。
- 调整 GitHub Actions 中的 `electron-builder` 补丁目标：不再通过包名解析 `@electron/get/dist/cjs/types`，改为使用相对路径 `../../@electron/get/dist/cjs/types`，强制引用顶层真正导出 `ElectronDownloadCacheMode` 的实现。
- 修复 `app-builder-lib` 包内嵌套的空壳 `@electron/get/dist/cjs/types.js` 导致补丁“执行成功但运行时仍报 `ReadWrite` 未定义”的问题。

## [0.0.28] - 2026-05-10

### 变更

- 将 `package.json` 版本号提升到 `0.0.28`，用于重新触发 GitHub Actions 并修复 mac 打包阶段新的 `ReadWrite` 运行时错误。
- 在 GitHub Actions 中增加 `electron-builder` 依赖补丁步骤：安装依赖后将 `node_modules/app-builder-lib/out/binDownload.js` 中错误的 `@electron/get` 运行时导入改为 `@electron/get/dist/cjs/types`，修复 `Cannot read properties of undefined (reading 'ReadWrite')`。
- 保留 `electron-builder 26.9.0` 的镜像修复能力，同时避开其当前发布包中的缓存模式导入缺陷。

## [0.0.27] - 2026-05-10

### 变更

- 将 `package.json` 版本号提升到 `0.0.27`，用于重新触发 GitHub Actions 并修复 Ubuntu 构建阶段 `pnpm install --frozen-lockfile` 的失败。
- 修复 `pnpm-lock.yaml` 中 `@electron/node-gyp` 被错误写成 SSH git 仓库地址的问题，避免 GitHub Actions 在无私钥环境下执行 `git clone git@github.com:electron/node-gyp.git` 并报 `Permission denied (publickey)`。
- 将 `@electron/node-gyp` 的锁文件来源恢复为 `https://codeload.github.com/...tar.gz` 直链形式，避免 CI 再走 git fetch/clone 链路。
- 在临时目录使用 `pnpm v10.30.3` 执行 `pnpm install --frozen-lockfile --ignore-scripts` 完成验证，确认修复后锁文件可以正常安装，并且不会再触发 SSH 拉取。

## [0.0.26] - 2026-05-09

### 变更

- 将 `package.json` 版本号提升到 `0.0.26`，用于重新触发 GitHub Actions 并修复 mac 打包阶段 `dmg-builder` 仍落回 `npmmirror` 的问题。
- 将 `electron-builder` 从 `26.8.1` 升级到 `26.9.0`，引入上游对 `electron_builder_binaries_mirror` 的修复，避免 `downloadArtifact` 阶段忽略镜像覆盖配置。
- 同步更新 `pnpm-lock.yaml`，确保 GitHub Actions 的 `--frozen-lockfile` 构建实际安装到带修复的 `electron-builder` 版本。
- 在 GitHub Actions 的构建 shell 中显式导出 `electron_builder_binaries_mirror` 相关环境变量到 GitHub 官方地址，并继续清空 `electron_mirror` 相关变量，避免 mac DMG 阶段再次命中 `cdn.npmmirror.com` 的错误下载地址。

## [0.0.25] - 2026-05-09

### 变更

- 将 `package.json` 版本号提升到 `0.0.25`，用于重新触发 GitHub Actions 并修复上一版工作流 YAML 中环境变量大小写重复定义的问题。
- 调整 GitHub Actions 中镜像覆盖修复的写法：不再在 `env` 节点同时声明大小写不同的同名变量，改为在 shell 中显式导出空值，避免工作流文件校验阶段直接报错。

## [0.0.24] - 2026-05-09

### 变更

- 将 `package.json` 版本号提升到 `0.0.24`，用于重新触发 GitHub Actions 并验证本轮 mac 镜像覆盖修复。
- 修复 GitHub Actions 的 mac 打包镜像覆盖问题：构建步骤中显式清空 `electron_mirror` 相关环境变量，避免仓库 `.npmrc` 中的 `npmmirror` 配置覆盖 `dmg-builder` 官方下载地址并导致 `404`。
- 为发布工作流补充下载镜像诊断日志，后续如果 CI 再出现镜像偏差，可以直接从 Actions 日志定位当前生效的镜像变量。

## [0.0.23] - 2026-05-09

### 变更

- 将 `package.json` 版本号提升到 `0.0.23`，用于重新触发 GitHub Actions 并验证 `electron-builder-binaries` 下载源修复。
- 为 GitHub Actions 显式指定 `electron-builder-binaries` 官方下载源，避免 mac 打包阶段下载 `dmg-builder` 时继续命中 `cdn.npmmirror.com` 并报 `404`。

## [0.0.22] - 2026-05-09

### 变更

- 将 `package.json` 版本号提升到 `0.0.22`，用于重新触发 GitHub Actions 并验证本轮图标与 Node 24 兼容修复。
- 新增 `public/btc-mac.png` 高分辨率比特币图标，并将 mac 打包图标切换到该文件，修复 icon 小于 `512x512` 时的构建失败。
- 为 GitHub Actions 增加 `FORCE_JAVASCRIPT_ACTIONS_TO_NODE24=true`，提前切换到 Node 24 JavaScript Actions 运行时，避免 Node 20 弃用告警。

## [0.0.21] - 2026-05-09

### 变更

- 将 `package.json` 版本号提升到 `0.0.21`，用于重新触发 GitHub Actions 并验证本轮 mac 打包修复。
- 调整 GitHub Actions 的 npm registry 配置，CI 构建时改用官方 registry，避免 mac 打包阶段下载 `dmg-builder` 辅助二进制时命中不存在的镜像地址并报 `404`。
- 调整 `electron-builder` 的构建命令，改为显式使用 `--publish never`，避免 tag 构建时出现隐式发布告警。
- 调整 mac 打包配置：改为生成 `universal` 安装包，同时兼容 Apple Silicon 与 Intel Mac，并补充应用图标配置。
- 补充 `package.json` 中的 `description` 与 `author` 字段，消除 electron-builder 的元数据缺失告警。

## [0.0.20] - 2026-05-09

### 变更

- 将 `package.json` 版本号提升到 `0.0.20`，用于重新触发 GitHub Actions 并验证本轮 CI 修复。
- 清理 `TickerCoinPage.vue` 中未再使用的币种缓存新鲜度函数，修复 `vue-tsc` 在 GitHub Actions 构建阶段报出的 `TS6133` 未使用变量错误。

## [0.0.19] - 2026-05-09

### 变更

- 将 `package.json` 版本号提升到 `0.0.19`，用于发布本轮 GitHub Actions、Release 说明与首页交互样式相关调整。
- 调整 GitHub Release 生成流程：发布时会按 tag/version 从 `CHANGELOG.md` 提取对应版本章节，作为 Release 说明正文。
- 为 GitHub Actions 增加版本一致性校验：tag 必须和 `package.json` 中的 `version` 完全一致，否则直接终止发布流程。
- 修复 GitHub Actions 构建环境配置：将发布工作流从 `yarn + Node 20` 调整为 `pnpm + Node 22.12.0`，以兼容 `@electron/rebuild@4.0.4` 的 Node 版本要求。
- 调整首页币种条目的悬停样式，鼠标移入时只切换更明显的背景色，并显示手型光标，让实时行情列表更直观。
- 同步补充 `AGENTS.md` 中的 changelog 维护规则，约定未发布内容先写入 `未发布`，发版前再整理到对应版本章节。

## [0.0.18] - 2026-05-08

### 新增

- 新增 `AGENTS.md`，记录仓库级工作规则、项目事实和文档维护要求。
- 新增 `doc/PROJECT_OVERVIEW.md`，说明项目用途、运行结构和持久化模型。
- 新增 `doc/PROJECT_STRUCTURE.md`，记录顶层结构和关键文件职责。
- 新增 `CHANGELOG.md`，并建立“每次有意义改动都要登记”的规则。

### 变更

- 将 `package.json` 版本号提升到 `0.0.18`，用于提交本轮现货数据源、代理、文档与后台实时行情运行时相关改动。
- 更新 `.gitignore`，将 `.pnpm-store/` 与 `dist-electron/` 纳入忽略范围，避免本地依赖缓存和 Electron 构建产物进入 Git。
- 修复首页实时行情列表的响应式更新方式，收到后台现货 WebSocket 新消息后会立即刷新，不再需要切换页面才能看到新价格。
- 修复全局现货行情运行时在主动关闭旧连接后仍可能自动重连的问题，避免切换币种、数据源或代理后后台残留重复 WebSocket 连接。
- 同步更新 `AGENTS.md`、`README.md`、`doc/PROJECT_OVERVIEW.md`、`doc/PROJECT_STRUCTURE.md`，使项目记忆文档与当前“公开现货 + 全局后台运行时”的实际行为保持一致。
- 重写 `README.md`，使其反映项目真实定位：一个基于 Binance WebSocket 的 Electron 桌面盯盘工具。
- 补充协作偏好：尽量少写新代码，优先复用现有工具和依赖，避免猜测式扩展。
- 将 `AGENTS.md`、`doc/PROJECT_OVERVIEW.md`、`doc/PROJECT_STRUCTURE.md`、`CHANGELOG.md` 统一改为以中文为主的表达。
- 将“文档、代码注释、日志优先使用中文”补充为仓库规则。
- 将 `README.md` 中默认安装、运行和打包命令示例统一切换为 `pnpm`。
- 新增项目级 `.npmrc`，将 `pnpm` 的 `node-linker` 固定为 `hoisted`，以兼容 `electron-forge`。
- 移除 `forge.config.cjs` 中的 `loadingGif: null`，修复 Electron Forge 在读取配置时因空值触发的启动报错。
- 在 `.npmrc` 中补充 Electron 镜像配置，降低国内网络环境下 Electron 二进制下载失败的概率。
- 在 `.npmrc` 中补充国内 npm registry 配置，使依赖包下载和 Electron 二进制下载都优先走国内镜像。
- 将 `package.json` 的默认 `start` 脚本切换为 `vite`，避免开发时误走 `electron-forge start` 导致读取不存在的 `dist/index.html` 并白屏。
- 调整窗口关闭行为：最后一个窗口关闭时直接退出应用，不再保留 macOS 默认的后台驻留行为。
- 新增代理设置页，支持保存代理配置并在主进程中立即应用到后续网络请求。
- 修复代理保存时的 IPC 传参问题，避免因传递响应式对象而出现 `An object could not be cloned`。
- 将监控币种输入方式改为基于 Binance 现货币种列表的搜索下拉选择，并增加本地缓存与定期刷新机制，避免大列表导致设置页卡顿。
- 调整默认配置的初始化方式，避免页面之间共享同一个默认配置对象。
- 新增“忽略 Binance 证书错误”开关，用于兼容代理导致的 `ERR_CERT_COMMON_NAME_INVALID`。
- 将币种列表接口优先切换到 `data-api.binance.vision`，并保留回退逻辑，以降低 Binance `451` 地区限制对公共市场数据读取的影响。
- 将监控币种下拉源从现货改为 `USDⓈ-M Futures` 可交易合约列表，和首页实时价格数据源保持一致，避免选到无行情的币种。
- 当合约 REST 接口返回 `451` 等受限错误时，监控币种列表自动回退到合约全市场 WebSocket 快照，降低地区限制带来的刷新失败问题。
- 将监控币种列表获取链路收敛到 renderer 侧 Binance 合约 WebSocket，并继续使用本地缓存，避免主进程 REST/IPC 链路在受限网络下反复报 `451`。
- 按实际业务口径将首页行情源和监控币种下拉统一切回 Binance 现货数据，并切换到现货 WebSocket 与现货缓存键，避免现货/合约混用。
- 新增数据源设置页，支持在 `Binance 现货` 和 `OKX 现货` 之间切换，并让首页行情和监控币种列表同步切换。
- 扩展现货数据源适配层，新增 `Kraken 现货` 和 `Coinbase 现货`，并继续保持统一的只读现货接口封装。
- 将代理证书忽略范围扩展到所有已支持公开数据源，避免切换数据源后再次触发证书拦截问题。
- 调整监控币种页的缓存策略：默认只读取本地缓存，只有首次无缓存或手动刷新时才重新请求远端币种列表。
- 修复 `Coinbase`、`Kraken` 等交易所带分隔符的产品 ID 解析，避免币种名称出现 `BTC-/USDT` 之类的异常显示。
- 修复监控币种页的初始化顺序，改为先读取本地设置再决定是否读取缓存/请求远端，避免每次打开页面都误触发请求。
- 引入全局后台现货行情运行时，页面切换时不再反复建立 WebSocket；监控币种、数据源、代理变更会直接重配或重连这一个后台连接。
