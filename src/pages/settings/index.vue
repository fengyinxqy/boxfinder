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
    </view>

    <view class="card">
      <text class="card__title">数据保存</text>
      <view class="row">
        <text class="row__label">存储位置</text>
        <text class="row__value">本机微信本地存储</text>
      </view>
      <view class="row">
        <text class="row__label">当前占用</text>
        <text class="row__value">{{ usageText }}</text>
      </view>
      <view class="row">
        <text class="row__label">容量上限</text>
        <text class="row__value">约 10 MB</text>
      </view>
      <text class="card__hint">数据量增大后会迁移到文件系统，第一版暂不涉及；照片备份也不在第一版范围内。</text>
    </view>

    <view class="card">
      <text class="card__title">备份与恢复</text>
      <view class="row">
        <text class="row__label">导出备份</text>
        <text class="row__tag">M5 开放</text>
      </view>
      <view class="row">
        <text class="row__label">恢复备份</text>
        <text class="row__tag">M5 开放</text>
      </view>
      <text class="card__hint">开放时会先校验备份文件结构，失败给出明确提示，不会静默覆盖现有数据。</text>
    </view>

    <view class="card">
      <text class="card__title">演示与版本</text>
      <view class="row" @tap="handleSeed">
        <text class="row__label">载入示例数据</text>
        <text class="row__tag row__tag--action">执行</text>
      </view>
      <view class="row">
        <text class="row__label">版本</text>
        <text class="row__value">v0.3.0（M1 + M2 + M3）</text>
      </view>
      <view class="row">
        <text class="row__label">技术栈</text>
        <text class="row__value">uni-app + Vue 3</text>
      </view>
    </view>

    <view class="footer">
      <text class="footer__text">搬家装箱助手 · 单人本地版</text>
      <text class="footer__text footer__text--muted">卸载或清理微信数据会造成记录丢失，请留意。</text>
    </view>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { actions, refresh } from '../../store/index.js'
import { getStorageUsage } from '../../services/storage.js'

const usage = ref({ currentSize: 0, limitSize: 0 })
const usageText = computed(() => `${usage.value.currentSize} KB`)

onShow(() => {
  refresh()
  usage.value = getStorageUsage()
})

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
