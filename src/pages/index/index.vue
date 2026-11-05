<template>
  <view class="page">
    <text class="title">搬家装箱助手</text>
    <text class="subtitle">M1 数据层已就绪</text>
    <view class="card">
      <text class="stat">搬家 {{ store.db.moves.length }} 次</text>
      <text class="stat">箱子 {{ store.db.boxes.length }} 个</text>
    </view>
    <button class="btn" hover-class="none" @tap="handleSeed">载入示例数据</button>
    <text class="hint">示例数据用于验证本地持久化：载入后关闭小程序再打开，数量应保持不变。</text>
  </view>
</template>

<script setup>
import { onShow } from '@dcloudio/uni-app'
import { actions, refresh, store } from '../../store/index.js'

onShow(refresh)

function handleSeed() {
  try {
    const result = actions.seedDemo()
    uni.showToast({
      title: result.created ? `已创建 ${result.boxes} 个箱子` : '示例数据已存在',
      icon: 'none',
    })
  } catch (error) {
    uni.showToast({ title: error.message || '操作失败', icon: 'none' })
  }
}
</script>

<style scoped>
.page { min-height: 100vh; padding: 80rpx 40rpx; background: #f6f1e7; }
.title { display: block; font-size: 48rpx; font-weight: 700; color: #241e18; }
.subtitle { display: block; margin-top: 12rpx; font-size: 26rpx; color: #9c8e7d; }
.card { padding: 32rpx; margin: 40rpx 0; background: #fff; border-radius: 20rpx; }
.stat { display: block; font-size: 30rpx; line-height: 2; color: #6b5f52; }
.btn { height: 88rpx; font-size: 30rpx; line-height: 88rpx; color: #fff; background: #c2542f; border-radius: 999rpx; }
.hint { display: block; margin-top: 24rpx; font-size: 24rpx; line-height: 1.7; color: #9c8e7d; }
</style>
