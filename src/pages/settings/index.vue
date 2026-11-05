<template>
  <view class="page">
    <view class="intro">
      <text class="intro__title">数据只保存在这台设备</text>
      <text class="intro__desc">第一版是单人本地版：不登录、不上传、不联网。卸载小程序或在微信里清理数据，记录会一起消失。</text>
    </view>

    <view class="card">
      <text class="card__title">使用说明</text>
      <view class="step">
        <text class="step__no">1</text>
        <text class="step__text">在首页新建一次搬家，每次搬家独立编号。</text>
      </view>
      <view class="step">
        <text class="step__no">2</text>
        <text class="step__text">进入搬家详情添加箱子，填写目标房间和备注。</text>
      </view>
      <view class="step">
        <text class="step__no">3</text>
        <text class="step__text">进入箱子详情添加物品，写清名称和数量，可连续添加。</text>
      </view>
      <view class="step">
        <text class="step__no">4</text>
        <text class="step__text">把「3 号箱」这样的编号写在纸箱上，按房间搬运。</text>
      </view>
      <view class="step">
        <text class="step__no">5</text>
        <text class="step__text">在搬家详情搜索物品名称或箱号，随时定位东西在哪；封箱、搬运、拆箱时切换箱子状态。</text>
      </view>
    </view>

    <view class="card">
      <text class="card__title">数据保存</text>
      <view class="row">
        <text class="row__label">文字记录</text>
        <text class="row__value">本机微信本地存储</text>
      </view>
      <view class="row">
        <text class="row__label">照片文件</text>
        <text class="row__value">小程序本地文件目录</text>
      </view>
      <view class="row">
        <text class="row__label">当前占用</text>
        <text class="row__value">{{ usageText }}</text>
      </view>
      <view class="row">
        <text class="row__label">容量上限</text>
        <text class="row__value">约 10 MB</text>
      </view>
      <text class="card__hint">数据量增大后会迁移到文件系统，第一版暂不涉及；照片体积较大，卸载或清理微信数据会一起丢失。</text>
    </view>

    <view class="card">
      <text class="card__title">备份与恢复</text>
      <view class="row row--action" @tap="openExport">
        <text class="row__label">导出备份</text>
        <text class="row__tag row__tag--action">打开</text>
      </view>
      <view class="row row--action" @tap="openRestore">
        <text class="row__label">恢复备份</text>
        <text class="row__tag row__tag--action">打开</text>
      </view>
      <text class="card__hint">备份是包含 schema 版本与导出时间的 JSON 文本，只含文字数据、不含照片。恢复前会完整校验结构，失败时不会改动现有数据。</text>
    </view>

    <view class="card">
      <text class="card__title">演示与版本</text>
      <view class="row" @tap="handleSeed">
        <text class="row__label">载入示例数据</text>
        <text class="row__tag row__tag--action">执行</text>
      </view>
      <view class="row">
        <text class="row__label">版本</text>
        <text class="row__value">v0.5.0（M1–M5）</text>
      </view>
      <view class="row">
        <text class="row__label">技术栈</text>
        <text class="row__value">uni-app + Vue 3</text>
      </view>
    </view>

    <view class="footer">
      <text class="footer__text">搬家装箱助手 · 单人本地版</text>
      <text class="footer__text footer__text--muted">卸载或清理微信数据会造成记录和照片丢失，请留意。</text>
    </view>

    <AppDialog
      v-model="exportVisible"
      title="导出备份"
      subtitle="复制下面的文本，保存到备忘录或发给自己"
      confirm-text="复制到剪贴板"
      @confirm="copyExport"
    >
      <view class="backup-box">
        <textarea class="backup-box__text" :value="exportText" disabled />
        <text class="backup-box__meta">{{ exportMeta }}</text>
      </view>
    </AppDialog>

    <AppDialog
      v-model="restoreVisible"
      title="恢复备份"
      subtitle="先校验结构，通过后才会替换现有数据"
      confirm-text="校验并恢复"
      @confirm="handleRestore"
    >
      <view class="backup-box">
        <textarea
          v-model="restoreText"
          class="backup-box__text backup-box__text--input"
          placeholder="把备份 JSON 粘贴到这里"
          placeholder-class="field__placeholder"
          :maxlength="-1"
          @input="restoreError = ''"
        />
      </view>
      <text class="backup-link" @tap="pasteFromClipboard">从剪贴板粘贴</text>
      <text v-if="restoreError" class="backup-error">{{ restoreError }}</text>
      <text class="backup-tip">恢复会替换当前全部文字数据，照片不会随备份恢复。</text>
    </AppDialog>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { actions, refresh, store } from '../../store/index.js'
import { getStorageUsage } from '../../services/storage.js'
import { parseBackup, serializeBackup } from '../../services/backup.js'
import AppDialog from '../../components/AppDialog.vue'

const usage = ref({ currentSize: 0, limitSize: 0 })
const usageText = computed(() => `${usage.value.currentSize} KB`)

const exportVisible = ref(false)
const exportText = ref('')
const exportMeta = computed(() => {
  if (!exportText.value) return ''
  const counts = store.db
  return `当前共 ${counts.moves.length} 次搬家、${counts.boxes.length} 个箱子、${counts.items.length} 件物品；照片不在备份内。`
})

const restoreVisible = ref(false)
const restoreText = ref('')
const restoreError = ref('')

onShow(() => {
  refresh()
  usage.value = getStorageUsage()
})

function openExport() {
  exportText.value = serializeBackup(store.db)
  exportVisible.value = true
}

function copyExport() {
  uni.setClipboardData({
    data: exportText.value,
    success: () => {
      exportVisible.value = false
      uni.showToast({ title: '备份已复制', icon: 'none' })
    },
    fail: () => {
      uni.showToast({ title: '复制失败，请手动选择文本', icon: 'none' })
    },
  })
}

function openRestore() {
  restoreText.value = ''
  restoreError.value = ''
  restoreVisible.value = true
}

function pasteFromClipboard() {
  uni.getClipboardData({
    success: (res) => {
      restoreText.value = (res && res.data) || ''
      restoreError.value = ''
    },
    fail: () => {
      restoreError.value = '读取剪贴板失败，请手动粘贴'
    },
  })
}

function handleRestore() {
  restoreError.value = ''
  let parsed
  try {
    // 先完整校验，用户确认前不写库；坏文件永远不会覆盖现有数据。
    parsed = parseBackup(restoreText.value)
  } catch (error) {
    restoreError.value = error.message || '备份内容有误'
    return
  }

  const counts = {
    moves: parsed.moves.length,
    boxes: parsed.boxes.length,
    items: parsed.items.length,
  }
  uni.showModal({
    title: '恢复备份',
    content: `将用备份中的 ${counts.moves} 次搬家、${counts.boxes} 个箱子、${counts.items} 件物品替换当前全部文字数据，照片不会恢复。确定继续吗？`,
    confirmText: '恢复',
    confirmColor: '#c2542f',
    success: (res) => {
      if (!res.confirm) return
      try {
        const result = actions.restoreBackup(restoreText.value)
        restoreVisible.value = false
        usage.value = getStorageUsage()
        uni.showToast({ title: `已恢复 ${result.counts.items} 件物品`, icon: 'none' })
      } catch (error) {
        restoreError.value = error.message || '恢复失败'
      }
    },
  })
}

function handleSeed() {
  uni.showModal({
    title: '载入示例数据',
    content: '会创建 1 个示例搬家和 3 个箱子，不影响已有记录。',
    success: (res) => {
      if (!res.confirm) return
      try {
        const result = actions.seedDemo()
        usage.value = getStorageUsage()
        uni.showToast({
          title: result.created ? `已创建 ${result.boxes} 个示例箱子` : '示例数据已存在',
          icon: 'none',
        })
      } catch (error) {
        uni.showToast({ title: error.message || '操作失败', icon: 'none' })
      }
    },
  })
}
</script>

<style scoped>
.intro {
  padding: 20rpx 4rpx 34rpx;
}

.intro__title {
  display: block;
  font-size: 42rpx;
  font-weight: 700;
  line-height: 1.35;
}

.intro__desc {
  display: block;
  margin-top: 16rpx;
  font-size: 25rpx;
  line-height: 1.7;
  color: var(--c-ink-2);
}

.card {
  padding: 30rpx 28rpx;
  margin-bottom: 22rpx;
  background: var(--c-surface);
  border: 1rpx solid var(--c-line);
  border-radius: 24rpx;
}

.card__title {
  display: block;
  margin-bottom: 16rpx;
  font-size: 30rpx;
  font-weight: 700;
}

.card__hint {
  display: block;
  margin-top: 16rpx;
  font-size: 22rpx;
  line-height: 1.6;
  color: var(--c-ink-3);
}

.step {
  display: flex;
  align-items: flex-start;
  padding: 10rpx 0;
}

.step__no {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 36rpx;
  height: 36rpx;
  margin-right: 16rpx;
  font-size: 20rpx;
  font-weight: 600;
  color: var(--c-accent);
  background: var(--c-accent-soft);
  border-radius: 50%;
}

.step__text {
  flex: 1;
  font-size: 25rpx;
  line-height: 1.6;
  color: var(--c-ink-2);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
  border-top: 1rpx solid var(--c-line);
}

.row__label {
  font-size: 26rpx;
  color: var(--c-ink-2);
}

.row__value {
  font-size: 25rpx;
  color: var(--c-ink-3);
}

.row__tag {
  font-size: 21rpx;
  color: var(--c-ink-3);
}

.row__tag--action {
  padding: 4rpx 16rpx;
  color: var(--c-accent);
  background: var(--c-accent-soft);
  border-radius: 999rpx;
}

.row--action {
  cursor: pointer;
}

.backup-box {
  padding: 16rpx;
  background: var(--c-paper);
  border: 1rpx solid var(--c-line-strong);
  border-radius: 16rpx;
}

.backup-box__text {
  width: 100%;
  height: 320rpx;
  font-size: 20rpx;
  line-height: 1.5;
  color: var(--c-ink-2);
  background: transparent;
}

.backup-box__text--input {
  height: 360rpx;
  color: var(--c-ink);
}

.backup-box__meta {
  display: block;
  margin-top: 10rpx;
  font-size: 21rpx;
  line-height: 1.5;
  color: var(--c-ink-3);
}

.backup-link {
  display: inline-block;
  padding: 10rpx 0;
  margin-top: 6rpx;
  font-size: 23rpx;
  color: var(--c-accent);
}

.backup-error {
  display: block;
  padding: 12rpx 16rpx;
  margin-top: 10rpx;
  font-size: 22rpx;
  line-height: 1.5;
  color: #a83e21;
  background: #fbeae4;
  border-radius: 12rpx;
}

.backup-tip {
  display: block;
  margin-top: 12rpx;
  font-size: 21rpx;
  line-height: 1.5;
  color: var(--c-ink-3);
}

.footer {
  padding: 30rpx 4rpx 60rpx;
  text-align: center;
}

.footer__text {
  display: block;
  font-size: 22rpx;
  color: var(--c-ink-3);
}

.footer__text--muted {
  margin-top: 8rpx;
  color: #b6a897;
}
</style>
