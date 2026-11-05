<template>
  <view v-if="move" class="page page--with-bar">
    <view class="move-head">
      <text class="move-head__kicker">当前搬家</text>
      <text class="move-head__name">{{ move.name }}</text>
      <text class="move-head__date">{{ formatDate(move.createdAt) }} 创建</text>
      <view class="stats">
        <view class="stat">
          <text class="stat__num">{{ stats.total }}</text>
          <text class="stat__label">箱子总数</text>
        </view>
        <view class="stat__divider"></view>
        <view class="stat">
          <text class="stat__num">{{ stats.unpacked }}</text>
          <text class="stat__label">已拆箱</text>
        </view>
        <view class="stat__divider"></view>
        <view class="stat">
          <text class="stat__num">{{ stats.nextNo }}</text>
          <text class="stat__label">下一个箱号</text>
        </view>
      </view>
    </view>

    <view class="section-head">
      <text class="section-title">箱子列表</text>
      <text class="section-count">{{ boxes.length }} 个</text>
    </view>

    <view v-if="boxes.length" class="box-list">
      <view v-for="box in boxes" :key="box.id" class="box-row" @tap="goBox(box)">
        <view class="box-tag">
          <text class="box-tag__num">{{ box.no }}</text>
          <text class="box-tag__unit">号箱</text>
        </view>
        <view class="box-row__body">
          <text class="box-row__room">{{ box.room }}</text>
          <text class="box-row__note">{{ box.note || '暂无备注' }}</text>
        </view>
        <StatusChip :status="box.status" />
      </view>
    </view>

    <EmptyState v-else title="还没有箱子" description="新建箱子后会自动分配箱号，从 1 号开始。">
      <button class="btn btn--ghost" hover-class="none" @tap="openCreate">添加第一个箱子</button>
    </EmptyState>

    <view class="rule">
      <text class="rule__title">编号规则</text>
      <text class="rule__text">箱号只增不减。删除箱子后，下一个新箱子仍会使用新的编号，不会复用旧箱号。</text>
    </view>

    <view class="bottom-bar">
      <button class="btn btn--primary btn--block" hover-class="none" @tap="openCreate">添加箱子</button>
    </view>

    <BoxFormDialog v-model="dialogVisible" :next-no="stats.nextNo" :loading="saving" @submit="handleCreate" />
  </view>

  <view v-else class="page">
    <EmptyState title="搬家记录不存在" description="它可能已被删除，返回首页重新选择。">
      <button class="btn btn--ghost" hover-class="none" @tap="goHome">返回首页</button>
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

const moveId = ref('')
const dialogVisible = ref(false)
const saving = ref(false)

const move = computed(() => store.db.moves.find((item) => item.id === moveId.value) || null)

const boxes = computed(() =>
  store.db.boxes
    .filter((box) => box.moveId === moveId.value)
    .sort((a, b) => a.no - b.no)
)

const stats = computed(() => {
  const list = boxes.value
  const maxNo = list.reduce((max, box) => Math.max(max, Number(box.no) || 0), 0)
  return {
    total: list.length,
    unpacked: list.filter((box) => box.status === 'unpacked').length,
    nextNo: Math.max(Number(move.value && move.value.nextBoxNo) || 1, maxNo + 1),
  }
})

onLoad((options) => {
  moveId.value = (options && options.id) || ''
})

onShow(() => {
  refresh()
  if (move.value) {
    uni.setNavigationBarTitle({ title: move.value.name })
  }
})

function openCreate() {
  dialogVisible.value = true
}

function goBox(box) {
  uni.navigateTo({ url: `/pages/box/detail?id=${box.id}` })
}

function goHome() {
  const pages = getCurrentPages()
  if (pages.length > 1) uni.navigateBack()
  else uni.reLaunch({ url: '/pages/index/index' })
}

function handleCreate(payload) {
  saving.value = true
  try {
    const box = actions.createBox(moveId.value, payload)
    dialogVisible.value = false
    uni.showToast({ title: `已创建 ${box.no} 号箱`, icon: 'none' })
  } catch (error) {
    uni.showToast({ title: error.message || '创建失败', icon: 'none' })
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.move-head {
  padding: 32rpx;
  margin-bottom: 22rpx;
  background: var(--c-surface);
  border: 1rpx solid var(--c-line);
  border-radius: 28rpx;
}

.move-head__kicker {
  display: block;
  font-size: 20rpx;
  letter-spacing: 4rpx;
  color: var(--c-ink-3);
}

.move-head__name {
  display: block;
  margin-top: 10rpx;
  font-size: 40rpx;
  font-weight: 700;
  line-height: 1.35;
}

.move-head__date {
  display: block;
  margin-top: 8rpx;
  font-size: 22rpx;
  color: var(--c-ink-3);
}

.stats {
  display: flex;
  align-items: stretch;
  padding-top: 26rpx;
  margin-top: 26rpx;
  border-top: 1rpx solid var(--c-line);
}

.stat {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
}

.stat__num {
  font-size: 44rpx;
  font-weight: 700;
  line-height: 1.2;
  color: var(--c-accent);
}

.stat__label {
  margin-top: 4rpx;
  font-size: 21rpx;
  color: var(--c-ink-3);
}

.stat__divider {
  width: 1rpx;
  background: var(--c-line);
}

.box-row {
  display: flex;
  align-items: center;
  padding: 22rpx 24rpx;
  margin-bottom: 18rpx;
  background: var(--c-surface);
  border: 1rpx solid var(--c-line);
  border-radius: 22rpx;
}

.box-tag {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 96rpx;
  height: 110rpx;
  margin-right: 22rpx;
  background: #fff8ea;
  border: 2rpx dashed #c9a87c;
  border-radius: 12rpx;
}

.box-tag__num {
  font-size: 48rpx;
  font-weight: 700;
  line-height: 1;
  color: #8a5a2b;
}

.box-tag__unit {
  margin-top: 6rpx;
  font-size: 19rpx;
  color: #a98c63;
}

.box-row__body {
  flex: 1;
  min-width: 0;
}

.box-row__room {
  display: block;
  font-size: 30rpx;
  font-weight: 600;
}

.box-row__note {
  display: block;
  margin-top: 6rpx;
  overflow: hidden;
  font-size: 23rpx;
  color: var(--c-ink-3);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rule {
  padding: 26rpx 28rpx;
  margin-top: 30rpx;
  border: 2rpx dashed var(--c-line-strong);
  border-radius: 22rpx;
}

.rule__title {
  display: block;
  margin-bottom: 10rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: var(--c-ink-2);
}

.rule__text {
  display: block;
  font-size: 23rpx;
  line-height: 1.7;
  color: var(--c-ink-3);
}
</style>
