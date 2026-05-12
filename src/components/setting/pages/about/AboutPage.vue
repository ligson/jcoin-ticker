<script setup lang="ts">
import {getCurrentInstance, onMounted, ref} from "vue";
import {CloudDownloadOutlined, GithubOutlined, InfoCircleOutlined} from "@ant-design/icons-vue";

interface AboutInfo {
  name: string;
  version: string;
  repositoryUrl: string;
  releasesUrl: string;
}

interface UpdateCheckResult {
  currentVersion: string;
  latestVersion: string;
  hasUpdate: boolean;
  repositoryUrl: string;
  releasesUrl: string;
  releaseUrl: string;
  downloadUrl: string;
  assetName: string;
  publishedAt: string;
}

interface UpdateDownloadResult extends UpdateCheckResult {
  downloaded: boolean;
  filePath: string;
}

const instance = getCurrentInstance();
const $message = instance?.appContext.config.globalProperties.$message;

const aboutInfo = ref<AboutInfo>({
  name: 'jcoin-ticker',
  version: '--',
  repositoryUrl: 'https://github.com/ligson/jcoin-ticker',
  releasesUrl: 'https://github.com/ligson/jcoin-ticker/releases'
})
const checkingUpdate = ref(false)
const latestUpdateText = ref('点击下方按钮可检查 GitHub Release 最新版本，并在应用内下载适合当前系统的安装包。')

const loadAboutInfo = async () => {
  try {
    const info = await window.ipcRenderer.invoke('app-about-info-get') as AboutInfo
    aboutInfo.value = info
  } catch (e: any) {
    $message.error(e?.message ?? '读取应用版本失败')
  }
}

const openRepository = async () => {
  try {
    await window.ipcRenderer.invoke('app-repository-open')
  } catch (e: any) {
    $message.error(e?.message ?? '打开 GitHub 项目主页失败')
  }
}

const checkForUpdates = async () => {
  checkingUpdate.value = true
  latestUpdateText.value = '正在检查 GitHub Release 最新版本...'

  try {
    const result = await window.ipcRenderer.invoke('app-update-check') as UpdateCheckResult
    if (result.hasUpdate) {
      const publishedLabel = result.publishedAt
          ? new Date(result.publishedAt).toLocaleString()
          : '未知时间'
      latestUpdateText.value = `发现新版本 v${result.latestVersion}，正在应用内下载 ${result.assetName || '对应安装包'}。发布时间：${publishedLabel}`
      const downloadResult = await window.ipcRenderer.invoke('app-update-download') as UpdateDownloadResult
      if (!downloadResult.downloaded) {
        latestUpdateText.value = `当前已经是最新版本 v${downloadResult.currentVersion}。`
        $message.success(`当前已经是最新版本 v${downloadResult.currentVersion}`)
        return
      }
      latestUpdateText.value = `新版本 v${downloadResult.latestVersion} 下载完成，安装包已保存到：${downloadResult.filePath}`
      $message.success(`新版本 v${downloadResult.latestVersion} 下载完成，已打开安装包`)
      return
    }

    latestUpdateText.value = `当前已经是最新版本 v${result.currentVersion}。`
    $message.success(`当前已经是最新版本 v${result.currentVersion}`)
  } catch (e: any) {
    latestUpdateText.value = '检查或下载更新失败，你仍然可以通过 GitHub 项目主页手动查看 Release。'
    $message.error(e?.message ?? '检查或下载更新失败')
  } finally {
    checkingUpdate.value = false
  }
}

onMounted(() => {
  void loadAboutInfo()
})
</script>

<template>
  <div class="about-page">
    <a-card class="about-page__hero" :bordered="false">
      <div class="about-page__hero-content">
        <div class="about-page__hero-mark">
          <InfoCircleOutlined />
        </div>
        <div class="about-page__hero-copy">
          <span class="about-page__eyebrow">关于工具</span>
          <h2>{{ aboutInfo.name }}</h2>
          <p>
            这是一个面向桌面端的数字货币盯盘工具，专注于公开现货行情监控。
            你可以用它查看关注币种的实时价格、24 小时涨跌、详情图表、情绪指数，以及桌面悬浮盯盘窗口。
          </p>
        </div>
      </div>
    </a-card>

    <div class="about-page__grid">
      <a-card title="版本信息" :bordered="false">
        <a-descriptions :column="1" size="small">
          <a-descriptions-item label="当前版本">
            v{{ aboutInfo.version }}
          </a-descriptions-item>
          <a-descriptions-item label="项目地址">
            {{ aboutInfo.repositoryUrl }}
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <a-card title="项目主页" :bordered="false">
        <a-space direction="vertical" style="width: 100%">
          <a-typography-paragraph type="secondary" style="margin-bottom: 0">
            这是 GitHub 开源项目，源码、Release、问题反馈和后续更新都会在项目主页维护。
          </a-typography-paragraph>
          <a-button type="default" @click="openRepository">
            <template #icon>
              <GithubOutlined />
            </template>
            打开 GitHub 项目主页
          </a-button>
        </a-space>
      </a-card>
    </div>

    <a-card title="版本更新" :bordered="false">
      <a-space direction="vertical" style="width: 100%">
        <a-typography-paragraph type="secondary" style="margin-bottom: 0">
          点击按钮后，程序会去 GitHub Release 检查最新版本，并自动匹配当前系统的安装包；如果发现新版本，会在应用内下载到系统“下载”目录，并在完成后打开安装包。
        </a-typography-paragraph>
        <a-button type="primary" :loading="checkingUpdate" @click="checkForUpdates">
          <template #icon>
            <CloudDownloadOutlined />
          </template>
          检查并下载更新
        </a-button>
        <a-typography-paragraph type="secondary" style="margin-bottom: 0">
          {{ latestUpdateText }}
        </a-typography-paragraph>
      </a-space>
    </a-card>
  </div>
</template>

<style scoped>
.about-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.about-page__hero {
  border-radius: 22px;
  background:
      radial-gradient(circle at top left, rgba(249, 115, 22, 0.14), transparent 24%),
      linear-gradient(135deg, #ffffff, #f8fafc);
}

.about-page__hero-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.about-page__hero-mark {
  width: 52px;
  height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: linear-gradient(135deg, #f97316, #fb7185);
  color: #ffffff;
  font-size: 24px;
  box-shadow: 0 14px 30px rgba(249, 115, 22, 0.2);
}

.about-page__eyebrow {
  color: #f97316;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.about-page__hero-copy h2 {
  margin: 6px 0 10px;
  color: #111827;
  font-size: 26px;
  line-height: 1.1;
}

.about-page__hero-copy p {
  max-width: 760px;
  color: #475569;
  font-size: 14px;
  line-height: 1.8;
  margin: 0;
}

.about-page__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 16px;
}

@media (max-width: 900px) {
  .about-page__hero-content {
    flex-direction: column;
  }

  .about-page__grid {
    grid-template-columns: 1fr;
  }
}
</style>
