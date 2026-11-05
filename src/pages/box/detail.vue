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

    <view class="status-card">
      <view class="status-card__head">
        <text class="status-card__title">箱子状态</text>
        <text class="status-card__hint">可随时改回之前的状态</text>
      </view>
      <view class="status-steps">
        <view
          v-for="(step, index) in statusList"
          :key="step.key"
          class="status-step"
          :class="{ 'status-step--on': box.status === step.key }"
          @tap="changeStatus(step)"
        >
          <view class="status-step__dot">{{ index + 1 }}</view>
          <text class="status-step__label">{{ step.label }}</text>
        </view>
      </view>
    </view>

    <view class="section-head">
      <text class="section-title">箱内物品</text>
      <text class="section-count">{{ items.length }} 件</text>
    </view>

    <view v-if="items.length" class="item-list">
      <view v-for="item in items" :key="item.id" class="item-row" @tap="goEdit(item)">
        <image v-if="item.photoPath" class="item-row__thumb" :src="item.photoPath" mode="aspectFill" />
        <view class="item-row__main">
          <text class="item-row__name">{{ item.name }}</text>
          <text class="item-row__meta">数量 ×{{ item.quantity }}</text>
        </view>
        <text class="item-row__move" @tap.stop="openMove(item)">移箱</text>
        <text class="item-row__delete" @tap.stop="confirmDeleteItem(item)">删除</text>
        <text class="item-row__arrow">›</text>
      </view>
    </view>

    <EmptyState v-else title="箱内还没有物品" description="记下名称和数量，之后就知道东西在几号箱。">
      <button class="btn btn--ghost" hover-class="none" @tap="goAdd">添加第一件物品</button>
    </EmptyState>

    <view class="actions">
      <button class="btn btn--ghost actions__btn" hover-class="none" @tap="openEdit">编辑箱子</button>
      <button class="btn btn--danger actions__btn" hover-class="none" @tap="confirmDelete">删除箱子</button>
    </view>

    <view class="bottom-bar">
      <button class="btn btn--primary btn--block" hover-class="none" @tap="goAdd">添加物品</button>
    </view>

    <BoxFormDialog v-model="dialogVisible" :box="box" :loading="saving" @submit="handleUpdate" />
    <MoveItemDialog
      v-model="moveDialogVisible"
      :item="movingItem"
      :current-box="box"
      :boxes="otherBoxes"
      @select="handleMove"
    />
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
import { removePhoto } from '../../services/photos.js'
import { formatDate } from '../../utils/format.js'
import { BOX_STATUS_LIST } from '../../constants/index.js'
import BoxFormDialog from '../../components/BoxFormDialog.vue'
import EmptyState from '../../components/EmptyState.vue'
import MoveItemDialog from '../../components/MoveItemDialog.vue'
import StatusChip from '../../components/StatusChip.vue'

const boxId = ref('')
const dialogVisible = ref(false)
const saving = ref(false)
const moveDialogVisible = ref(false)
const movingItem = ref(null)
const statusList = BOX_STATUS_LIST

const box = computed(() => store.db.boxes.find((item) => item.id === boxId.value) || null)
const items = computed(() =>
  store.db.items
    .filter((item) => item.boxId === boxId.value)
    .sort((a, b) => a.createdAt - b.createdAt)
)
const otherBoxes = computed(() => {
  const current = box.value
  if (!current) return []
  return store.db.boxes
    .filter((entry) => entry.moveId === current.moveId && entry.id !== current.id)
    .sort((a, b) => a.no - b.no)
})

onLoad((options) => {
  boxId.value = (options && options.id) || ''
})

onShow(() => {
  refresh()
})

function openEdit() {
  dialogVisible.value = true
}

function goAdd() {
  uni.navigateTo({ url: `/pages/item/form?boxId=${boxId.value}` })
}

function goEdit(item) {
  uni.navigateTo({ url: `/pages/item/form?boxId=${boxId.value}&id=${item.id}` })
}

function openMove(item) {
  movingItem.value = item
  moveDialogVisible.value = true
}

function handleMove(target) {
  const item = movingItem.value
  if (!item) return
  try {
    actions.moveItem(item.id, target.id)
    moveDialogVisible.value = false
    movingItem.value = null
    uni.showToast({ title: `已移到 ${target.no} 号箱`, icon: 'none' })
  } catch (error) {
    uni.showToast({ title: error.message || '移动失败', icon: 'none' })
  }
}

function changeStatus(step) {
  if (!box.value || box.value.status === step.key) return
  try {
    actions.setBoxStatus(boxId.value, step.key)
    uni.showToast({ title: `状态改为${step.label}`, icon: 'none' })
  } catch (error) {
    uni.showToast({ title: error.message || '状态修改失败', icon: 'none' })
  }
}

function confirmDeleteItem(item) {
  uni.showModal({
    title: '删除物品',
    content: `确定删除「${item.name}」吗？`,
    confirmText: '删除',
    confirmColor: '#a83e21',
    success: (res) => {
      if (!res.confirm) return
      try {
        actions.deleteItem(item.id)
        removePhoto(item.photoPath)
        uni.showToast({ title: '物品已删除', icon: 'none' })
      } catch (error) {
        uni.showToast({ title: error.message || '删除失败', icon: 'none' })
      }
    },
  })
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
        // 先记下箱内照片，箱子删除并级联清理物品后一并删文件。
        const photos = items.value.map((entry) => entry.photoPath).filter(Boolean)
        actions.deleteBox(target.id)
        photos.forEach((photo) => removePhoto(photo))
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
  margin: 8rpx 0 26rpx;
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

.status-card {
  padding: 24rpx 26rpx;
  margin-bottom: 28rpx;
  background: var(--c-surface);
  border: 1rpx solid var(--c-line);
  border-radius: 22rpx;
}

.status-card__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 18rpx;
}

.status-card__title {
  font-size: 28rpx;
  font-weight: 700;
}

.status-card__hint {
  font-size: 21rpx;
  color: var(--c-ink-3);
}

.status-steps {
  display: flex;
}

.status-step {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  padding: 10rpx 0;
}

.status-step__dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44rpx;
  height: 44rpx;
  font-size: 21rpx;
  font-weight: 600;
  color: var(--c-ink-3);
  background: var(--c-bg);
  border: 1rpx solid var(--c-line-strong);
  border-radius: 50%;
}

.status-step__label {
  margin-top: 8rpx;
  font-size: 21rpx;
  color: var(--c-ink-3);
}

.status-step--on .status-step__dot {
  color: #fffdf8;
  background: var(--c-accent);
  border-color: var(--c-accent);
  box-shadow: 0 8rpx 18rpx rgba(194, 84, 47, 0.24);
}

.status-step--on .status-step__label {
  font-weight: 600;
  color: var(--c-accent);
}

.item-row {
  display: flex;
  align-items: center;
  padding: 22rpx 24rpx;
  margin-bottom: 16rpx;
  background: var(--c-surface);
  border: 1rpx solid var(--c-line);
  border-radius: 20rpx;
}

.item-row__thumb {
  flex-shrink: 0;
  width: 88rpx;
  height: 88rpx;
  margin-right: 18rpx;
  border-radius: 12rpx;
}

.item-row__main {
  flex: 1;
  min-width: 0;
}

.item-row__name {
  display: block;
  overflow: hidden;
  font-size: 29rpx;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-row__meta {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--c-ink-3);
}

.item-row__move {
  padding: 8rpx 16rpx;
  margin-right: 10rpx;
  font-size: 22rpx;
  color: var(--c-accent);
  background: var(--c-accent-soft);
  border-radius: 999rpx;
}

.item-row__delete {
  padding: 8rpx 16rpx;
  margin-right: 10rpx;
  font-size: 22rpx;
  color: #a83e21;
  background: #fbeae4;
  border-radius: 999rpx;
}

.item-row__arrow {
  font-size: 38rpx;
  line-height: 1;
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
