<script setup lang="ts">
import {getCurrentInstance, nextTick, onMounted, ref} from "vue";
import {AppConfig} from "../../../config/config.ts";
import {PlusOutlined} from '@ant-design/icons-vue';


const tags = ref<string[]>([])
const inputVisible = ref<boolean>(false)
const inputValue = ref<string>('')
const appConfig = ref<AppConfig>({coins: []});
const instance = getCurrentInstance();
const $message = instance?.appContext.config.globalProperties.$message;
const $store = instance?.appContext.config.globalProperties.$store;

const loadSettings = () => {
  $store.get("appConfig").then((value: AppConfig | null) => {
    if (value) {
      appConfig.value = value
      if (appConfig.value) {
        tags.value = appConfig.value.coins
      }
    }
  })
}


const inputRef = ref();


const handleClose = (removedTag: string) => {
  const tags2 = tags.value.filter(tag => tag !== removedTag);
  console.log(tags);
  tags.value = tags2;
  if (appConfig.value) {
    appConfig.value.coins = tags.value
    $store.set("appConfig", JSON.parse(JSON.stringify(appConfig.value)))
    $message.success(`${removedTag} removed`)
  }
};

const showInput = () => {
  inputVisible.value = true;
  nextTick(() => {
    inputRef.value.focus();
  });
};

const handleInputConfirm = () => {
  if (inputValue.value && tags.value && (tags.value.indexOf(inputValue.value) === -1)) {
    tags.value = [...tags.value, inputValue.value];
  }
  if (appConfig.value) {
    appConfig.value.coins = tags.value
    $store.set("appConfig", JSON.parse(JSON.stringify(appConfig.value)))
  }
  inputValue.value = ''
  inputVisible.value = false;
};

onMounted(() => {
  loadSettings()
})
</script>

<template>
  <template v-for="(tag, _) in tags" :key="tag">
    <a-tooltip v-if="tag.length > 20" :title="tag">
      <a-tag :closable="true" @close="handleClose(tag)">
        {{ `${tag.slice(0, 20)}...` }}
      </a-tag>
    </a-tooltip>
    <a-tag v-else :closable="true" @close="handleClose(tag)">
      {{ tag }}
    </a-tag>
  </template>
  <a-input
      v-if="inputVisible"
      ref="inputRef"
      v-model:value="inputValue"
      type="text"
      size="small"
      :style="{ width: '78px' }"
      @blur="handleInputConfirm"
      @keyup.enter="handleInputConfirm"
  />
  <a-tag v-else style="background: #fff; border-style: dashed" @click="showInput">
    <plus-outlined/>
    添加币种
  </a-tag>
</template>

<style scoped>

</style>
