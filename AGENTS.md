# AGENTS.md

## 项目用途

`jcoin-ticker` 是一个基于 Electron + Vue 3 的轻量桌面盯盘工具。
当前核心用途是展示用户自定义币种列表的公开现货行情，并通过 `electron-store` 在本地保存监控币种、代理和数据源配置。

## 开始前先读

进入仓库后，优先按这个顺序读取：

1. `README.md`
2. `doc/PROJECT_OVERVIEW.md`
3. `doc/PROJECT_STRUCTURE.md`
4. `CHANGELOG.md`

## 项目事实

- Renderer 入口：`src/main.ts`
- 应用布局壳：`src/App.vue`
- 顶部导航：`src/Menu.vue`
- 行情主页：`src/components/home/HomePage.vue`
- 现货数据源适配层：`src/components/home/spotMarketDataSources.ts`
- 全局现货行情运行时：`src/components/home/spotTickerRuntime.ts`
- 设置页入口：`src/components/setting/SettingPage.vue`
- 币种配置页：`src/components/setting/pages/tickercoin/TickerCoinPage.vue`
- 代理设置页：`src/components/setting/pages/proxy/ProxySettingPage.vue`
- 数据源设置页：`src/components/setting/pages/datasource/DataSourceSettingPage.vue`
- Electron 主进程：`electron/main.ts`
- Preload 桥接：`electron/preload.ts`
- 持久化访问入口：`src/config/store.ts`
- 路由配置：`src/config/router.ts`

## 工作规则

- 改动要小、要准，并且直接服务当前需求。
- 能复用现有工具、脚本、依赖、内置能力时，先复用，不要先手写。
- 优先通过配置、组合、复用解决问题，不要轻易新增抽象层。
- 不要做猜测式功能扩展、架构升级或顺手重构。
- 修改文件时，不要顺手“优化”无关内容。
- 不要凭空发明需求，需求应来自现有代码或用户明确说明。
- 行为发生变化时，要在同一轮同步更新相关文档。
- 每次有意义的改动都必须记录到 `CHANGELOG.md`。
- `dist-electron/` 默认视为构建产物，除非任务明确要求处理生成结果。
- 在本仓库执行 shell 命令时，统一使用 `rtk` 前缀。
- 文档尽可能使用中文编写，必要时保留少量英文技术名词。
- 新增或修改代码注释时，优先使用中文。
- 新增或修改业务日志、提示日志时，优先使用中文。
- 不要乱发挥，未被请求的功能、页面、流程不要主动扩展。
- 当用户说“发版”时，默认含义是：将 `package.json` 版本号按补丁位加一、整理 `CHANGELOG.md`、提交代码、推送远端，并创建对应的 `v版本号` tag。
- 发版动作必须串行执行，不能把 `git commit`、`git tag`、`git push` 并行跑。
- 正确发版顺序固定为：1. 修改版本和 changelog 2. 提交 commit 3. 在该 commit 上创建 tag 4. 校验 `git show <tag>:package.json` 与 `git show <tag>:CHANGELOG.md` 5. 推送分支 6. 推送 tag。
- 如果 tag 指错提交，不要静默重写已发布 tag；优先补发一个新的补丁版本，并在 `CHANGELOG.md` 中注明上一个错误 tag 的原因。

## 文档规则

- `README.md` 是面向使用者的项目说明。
- `doc/PROJECT_OVERVIEW.md` 说明项目用途、运行结构和核心行为。
- `doc/PROJECT_STRUCTURE.md` 说明目录职责和关键文件定位。
- `CHANGELOG.md` 是项目持续维护的变更记录。
- `CHANGELOG.md` 优先按版本维护；未发布改动先写入 `未发布`，发版前整理到对应版本章节。
- 如果结构、行为、流程变了，要更新对应文档，不能留下过期描述。
- 文档内容尽量使用中文表达，保持统一口径。

## 改动策略

处理需求时按下面顺序执行：

1. 先确认现有文件、组件、依赖或脚本是否已经覆盖大部分需求。
2. 只修改最小必要范围。
3. 命名、结构和现有代码风格保持一致。
4. 收尾前同步更新 `CHANGELOG.md`。

## 当前功能范围

- 展示公开现货行情流中的实时价格和 24 小时统计数据。
- 支持增加和删除监控币种。
- 支持切换现货数据源。
- 支持配置网络代理。
- 支持在桌面端本地持久化保存币种列表、代理和数据源配置。
- 首页实时价格复用全局后台 WebSocket 运行时，切换页面时不会重新建连。
- 支持以 Electron 桌面应用形式运行和打包。

## 当前已知缺口

- `help` 和 `about` 页面目前仍是占位内容。
- 仓库当前没有自动化测试。
- README 与项目记忆文档需要人工保持同步。
