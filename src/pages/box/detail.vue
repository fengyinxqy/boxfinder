<template>
  <view v-if="box" class="page page--with-bar">
    <view class="label">
      <view class="label__holes">
        <view class="hole"></view>
        <view class="hole"></view>
      </view>
      <text class="label__kicker">装箱标签</text>
      <view class="label__no">
        <text class="label__num">{{ box.no }}</text>
        <text class="label__unit">号箱</text>
      </view>
      <view class="label__row">
        <text class="label__key">目标房间</text>
        <text class="label__value">{{ box.room }}</text>
      </view>
      <view class="label__row">
        <text class="label__key">状态</text>
        <StatusChip :status="box.status" />
      </view>
      <view v-if="box.note" class="label__note">
        <text class="label__key">备注</text>
        <text class="label__note-text">{{ box.note }}</text>
      </view>
      <text class="label__date">{{ formatDate(box.createdAt) }} 创建</text>
    </view>

    <view class="section-head">
      <text class="section-title">箱内物品</text>
      <text class="section-count">0 件</text>
    </view>

    <view class="placeholder">
      <text class="placeholder__title">物品录入将在 M3 开放</text>
      <text class="placeholder__desc">下一阶段会在这里添加物品名称、数量和照片，并支持保存后继续添加。</text>
    </view>

    <view class="actions">
      <button class="btn btn--ghost actions__btn" hover-class="none" @tap="openEdit">编辑箱子</button>
      <button class="btn btn--danger actions__btn" hover-class="none" @tap="confirmDelete">删除箱子</button>
    </view>

    <view class="bottom-bar">
      <button class="btn btn--primary btn--block btn--disabled" hover-class="none" disabled>添加物品（M3 开放）</button>
    </view>

    <BoxFormDialog v-model="dialogVisible" :box="box" :loading="saving" @submit="handleUpdate" />
  </view>

  <view v-else class="page">
    <EmptyState title="箱子不存在" description="它可能已被删除，返回上一页重新选择。">
      <button class="btn btn--ghost" hover-class="none" @tap="goBack">返回</button>
    </EmptyState>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { actions, refresh, store } from '../../store/index.js'
import { formatDate } from '../../utils/format.js'
import BoxFormDialog from '../../components/BoxFormDialog.vue'
import EmptyState from '../../components/EmptyState.vue'
import StatusChip from '../../components/StatusChip.vue'

const boxId = ref('')
const dialogVisible = ref(false)
const saving = ref(false)

const box = computed(() => store.db.boxes.find((item) => item.id === boxId.value) || null)

onLoad((options) => {
  boxId.value = (options && options.id) || ''
})

onShow(() => {
  refresh()
})

function openEdit() {
  dialogVisible.value = true
}

function goBack() {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.reLaunch({ url: '/pages/index/index' })
}

function handleUpdate(payload) {
  saving.value = true
  try {
    actions.updateBox(boxId.value, payload)
    dialogVisible.value = false
    uni.showToast({ title: '箱子已更新', icon: 'none' })
  } catch (error) {
    uni.showToast({ title: error.message || '保存失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}

function confirmDelete() {
  const target = box.value
  if (!target) return
  uni.showModal({
    title: '删除箱子',
    content: `确定删除「${target.no} 号箱」吗？该箱号不会被重新使用，箱内物品也会一并移除。`,
    confirmText: '删除',
    confirmColor: '#a83e21',
    success: (res) => {
      if (!res.confirm) return
      try {
        actions.deleteBox(target.id)
        uni.showToast({ title: `已删除 ${target.no} 号箱`, icon: 'none' })
        goBack()
      } catch (error) {
        uni.showToast({ title: error.message || '删除失败', icon: 'none' })
      }
    },
  })
}
</script>

<style scoped>
.label {
  position: relative;
  padding: 36rpx 32rpx 30rpx;
  margin: 8rpx 0 30rpx;
  background: #fffaf0;
  border: 2rpx dashed #c9a87c;
  border-radius: 22rpx;
  box-shadow: 0 16rpx 36rpx rgba(90, 60, 30, 0.07);
}

.label__holes {
  position: absolute;
  top: 20rpx;
  right: 26rpx;
  display: flex;
}

.hole {
  width: 14rpx;
  height: 14rpx;
  margin-left: 12rpx;
  background: var(--c-bg);
  border: 2rpx solid #d8c3a2;
  border-radius: 50%;
}

.label__kicker {
  font-size: 20rpx;
  letter-spacing: 4rpx;
  color: #b08e60;
}

.label__no {
  display: flex;
  align-items: baseline;
  margin: 12rpx 0 24rpx;
}

.label__num {
  font-size: 120rpx;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -2rpx;
  color: #3b2a18;
}

.label__unit {
  margin-left: 14rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #6b4f2f;
}

.label__row {
  display: flex;
  align-items: center;
  padding: 14rpx 0;
  border-top: 1rpx solid rgba(201, 168, 124, 0.28);
}

.label__key {
  width: 130rpx;
  font-size: 24rpx;
  color: #a98c63;
}

.label__value {
  font-size: 32rpx;
  font-weight: 600;
  color: var(--c-ink);
}

.label__note {
  display: flex;
  padding: 14rpx 0 4rpx;
  border-top: 1rpx solid rgba(201, 168, 124, 0.28);
}

.label__note-text {
  flex: 1;
  font-size: 26rpx;
  line-height: 1.6;
  color: var(--c-ink-2);
}

.label__date {
  display: block;
  margin-top: 18rpx;
  font-size: 21rpx;
  color: #b6a184;
}

.placeholder {
  padding: 40rpx 32rpx;
  text-align: center;
  border: 2rpx dashed var(--c-line-strong);
  border-radius: 24rpx;
}

.placeholder__title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--c-ink-2);
}

.placeholder__desc {
  display: block;
  max-width: 540rpx;
  margin: 12rpx auto 0;
  font-size: 23rpx;
  line-height: 1.6;
  color: var(--c-ink-3);
}

.actions {
  display: flex;
  margin-top: 32rpx;
}

.actions__btn {
  flex: 1;
  height: 80rpx;
  font-size: 27rpx;
}

.actions__btn + .actions__btn {
  margin-left: 20rpx;
}
</style>
