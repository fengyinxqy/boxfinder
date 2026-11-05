<template>
  <view class="page page--with-bar">
    <view class="hero">
      <view class="hero__copy">
        <text class="hero__kicker">MOVE · PACK</text>
        <text class="hero__title hero__title--first">箱号写得清，</text>
        <text class="hero__title">搬到哪间一目了然。</text>
        <text class="hero__desc">每次搬家单独记录，箱子从 1 号开始自动编号。先把编号写在纸箱上，再往里装。</text>
      </view>
      <view class="hero__art">
        <view class="label-card label-card--back">2</view>
        <view class="label-card">1</view>
      </view>
    </view>

    <view v-if="store.error" class="alert">
      <text class="alert__text">{{ store.error }}</text>
      <text class="alert__action" @tap="refresh">重试</text>
    </view>

    <view class="section-head">
      <text class="section-title">我的搬家</text>
      <text class="section-action" @tap="goSettings">数据与说明</text>
    </view>

    <view v-if="moves.length" class="move-list">
      <view v-for="move in moves" :key="move.id" class="move-card" @tap="goMove(move)">
        <view class="move-card__body">
          <text class="move-card__name">{{ move.name }}</text>
          <text class="move-card__meta">{{ formatDate(move.createdAt) }} 创建 · {{ boxCount(move.id) }} 个箱子</text>
        </view>
        <view class="move-card__rename" hover-class="press" @tap.stop="openRename(move)">改名</view>
        <text class="move-card__arrow">›</text>
      </view>
    </view>

    <EmptyState v-else title="还没有搬家记录" description="创建第一次搬家，系统会从 1 号箱开始编号。">
      <button class="btn btn--ghost" hover-class="none" @tap="openCreate">创建第一次搬家</button>
    </EmptyState>

    <view class="note">
      <text class="note__title">这一版能做什么</text>
      <text class="note__item">· 管理多次搬家，每次搬家单独编号</text>
      <text class="note__item">· 添加、编辑、删除箱子，记录目标房间和备注</text>
      <text class="note__item">· 数据保存在本机，关闭重进不会丢</text>
      <text class="note__item note__item--muted">· 物品录入、搜索和备份将在后续里程碑开放</text>
    </view>

    <view class="bottom-bar">
      <button class="btn btn--primary btn--block" hover-class="none" @tap="openCreate">新建搬家</button>
    </view>

    <MoveFormDialog v-model="dialogVisible" :move="editingMove" :loading="saving" @submit="handleSubmit" />
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { actions, refresh, store } from '../../store/index.js'
import { formatDate } from '../../utils/format.js'
import EmptyState from '../../components/EmptyState.vue'
import MoveFormDialog from '../../components/MoveFormDialog.vue'

const dialogVisible = ref(false)
const editingMove = ref(null)
const saving = ref(false)

const moves = computed(() =>
  store.db.moves.slice().sort((a, b) => b.createdAt - a.createdAt)
)

function boxCount(moveId) {
  return store.db.boxes.filter((box) => box.moveId === moveId).length
}

function openCreate() {
  editingMove.value = null
  dialogVisible.value = true
}

function openRename(move) {
  editingMove.value = move
  dialogVisible.value = true
}

function goMove(move) {
  uni.navigateTo({ url: `/pages/move/detail?id=${move.id}` })
}

function goSettings() {
  uni.navigateTo({ url: '/pages/settings/index' })
}

function handleSubmit(name) {
  saving.value = true
  try {
    if (editingMove.value) {
      actions.renameMove(editingMove.value.id, name)
      uni.showToast({ title: '名称已更新', icon: 'none' })
    } else {
      actions.createMove(name)
      uni.showToast({ title: '搬家已创建', icon: 'none' })
    }
    dialogVisible.value = false
  } catch (error) {
    uni.showToast({ title: error.message || '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

onShow(() => {
  refresh()
})
</script>

<style scoped>
.hero {
  display: flex;
  justify-content: space-between;
  padding: 32rpx 4rpx 44rpx;
}

.hero__copy {
  flex: 1;
  min-width: 0;
}

.hero__kicker {
  display: block;
  font-size: 20rpx;
  letter-spacing: 6rpx;
  color: var(--c-ink-3);
}

.hero__title {
  display: block;
  font-size: 50rpx;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 1rpx;
}

.hero__title--first {
  margin-top: 14rpx;
}

.hero__desc {
  display: block;
  padding-right: 12rpx;
  margin-top: 20rpx;
  font-size: 25rpx;
  line-height: 1.65;
  color: var(--c-ink-2);
}

.hero__art {
  position: relative;
  flex-shrink: 0;
  width: 172rpx;
  height: 168rpx;
  margin-top: 22rpx;
}

.label-card {
  position: absolute;
  top: 18rpx;
  right: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 136rpx;
  height: 136rpx;
  font-size: 62rpx;
  font-weight: 700;
  line-height: 1;
  color: #8a5a2b;
  background: #fff8ea;
  border: 2rpx dashed #c9a87c;
  border-radius: 14rpx;
  box-shadow: 0 14rpx 30rpx rgba(80, 52, 24, 0.1);
  transform: rotate(6deg);
}

.label-card--back {
  top: 2rpx;
  right: 62rpx;
  background: #fdf3e0;
  opacity: 0.55;
  transform: rotate(-8deg);
}

.alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  margin-bottom: 20rpx;
  background: #fbeae4;
  border-radius: 16rpx;
}

.alert__text {
  flex: 1;
  font-size: 24rpx;
  color: #a83e21;
}

.alert__action {
  margin-left: 20rpx;
  font-size: 24rpx;
  color: #a83e21;
  text-decoration: underline;
}

.move-card {
  display: flex;
  align-items: center;
  padding: 28rpx 26rpx;
  margin-bottom: 18rpx;
  background: var(--c-surface);
  border: 1rpx solid var(--c-line);
  border-radius: 24rpx;
}

.move-card__body {
  flex: 1;
  min-width: 0;
}

.move-card__name {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
}

.move-card__meta {
  display: block;
  margin-top: 8rpx;
  font-size: 23rpx;
  color: var(--c-ink-3);
}

.move-card__rename {
  padding: 8rpx 18rpx;
  margin-right: 12rpx;
  font-size: 22rpx;
  color: var(--c-accent);
  background: var(--c-accent-soft);
  border-radius: 999rpx;
}

.move-card__arrow {
  font-size: 40rpx;
  line-height: 1;
  color: var(--c-ink-3);
}

.press {
  opacity: 0.6;
}

.note {
  padding: 28rpx;
  margin-top: 36rpx;
  border: 2rpx dashed var(--c-line-strong);
  border-radius: 24rpx;
}

.note__title {
  display: block;
  margin-bottom: 14rpx;
  font-size: 26rpx;
  font-weight: 600;
  color: var(--c-ink-2);
}

.note__item {
  display: block;
  font-size: 24rpx;
  line-height: 1.9;
  color: var(--c-ink-2);
}

.note__item--muted {
  color: var(--c-ink-3);
}
</style>
