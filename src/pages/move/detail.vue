<template>
  <view v-if="move" class="page page--with-bar">
    <view class="move-head">
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

      <view class="progress">
        <view class="progress__head">
          <text class="progress__value">拆箱进度 {{ stats.unpacked }} / {{ stats.total }} 箱</text>
          <text class="progress__percent">{{ progressPercent }}%</text>
        </view>
        <view class="progress__track">
          <view class="progress__fill" :style="{ width: progressPercent + '%' }"></view>
        </view>
      </view>
    </view>

    <view class="search-entry" hover-class="press" @tap="goSearch">
      <view class="icon-search">
        <view class="icon-search__ring"></view>
        <view class="icon-search__handle"></view>
      </view>
      <text class="search-entry__text">搜索物品名称或箱号</text>
      <text class="chevron">›</text>
    </view>

    <view class="section-head">
      <text class="section-title">箱子列表</text>
      <text class="section-count">{{ filteredBoxes.length }} 个</text>
    </view>

    <view class="filters">
      <view
        v-for="item in filters"
        :key="item.key"
        class="filter"
        :class="{ 'filter--on': statusFilter === item.key }"
        hover-class="filter--press"
        @tap="statusFilter = item.key"
      >
        <view class="filter__pill">
          <text class="filter__label">{{ item.label }}</text>
          <text class="filter__count">{{ item.count }}</text>
        </view>
      </view>
    </view>

    <view v-if="filteredBoxes.length" class="box-list">
      <view v-for="box in filteredBoxes" :key="box.id" class="box-row" hover-class="press" @tap="goBox(box)">
        <view class="box-tag">
          <text class="box-tag__num">{{ box.no }}</text>
        </view>
        <view class="box-row__body">
          <view class="box-row__main">
            <text class="box-row__title">{{ box.no }} 号箱</text>
            <text class="box-row__room">{{ box.room }}</text>
          </view>
          <text class="box-row__sub">{{ summaryFor(box) }}</text>
        </view>
        <text class="box-row__status">{{ statusLabel(box.status) }}</text>
        <text class="chevron">›</text>
      </view>
    </view>

    <EmptyState v-else-if="boxes.length" title="这个状态下没有箱子" description="切换到「全部」或别的状态看看。">
      <button class="btn btn--ghost" hover-class="none" @tap="statusFilter = 'all'">查看全部箱子</button>
    </EmptyState>

    <EmptyState v-else title="还没有箱子" description="新建箱子后会自动分配箱号，从 1 号开始。">
      <button class="btn btn--ghost" hover-class="none" @tap="openCreate">添加第一个箱子</button>
    </EmptyState>

    <view class="rule-hint">
      <view class="rule-hint__icon">
        <text class="rule-hint__i">i</text>
      </view>
      <text class="rule-hint__text">箱号只增不减，不复用已删除箱号。</text>
    </view>

    <view class="bottom-bar">
      <button class="btn btn--primary btn--block" hover-class="none" @tap="openCreate">新建箱子</button>
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
import { BOX_STATUS, BOX_STATUS_LIST } from '../../constants/index.js'
import BoxFormDialog from '../../components/BoxFormDialog.vue'
import EmptyState from '../../components/EmptyState.vue'

const moveId = ref('')
const dialogVisible = ref(false)
const saving = ref(false)
const statusFilter = ref('all')

const move = computed(() => store.db.moves.find((item) => item.id === moveId.value) || null)

const boxes = computed(() =>
  store.db.boxes
    .filter((box) => box.moveId === moveId.value)
    .sort((a, b) => a.no - b.no)
)

const stats = computed(() => {
  const list = boxes.value
  const maxNo = list.reduce((max, box) => Math.max(max, Number(box.no) || 0), 0)
  const count = (status) => list.filter((box) => box.status === status).length
  return {
    total: list.length,
    packing: count('packing'),
    sealed: count('sealed'),
    moved: count('moved'),
    unpacked: count('unpacked'),
    nextNo: Math.max(Number(move.value && move.value.nextBoxNo) || 1, maxNo + 1),
  }
})

/** 每箱前 3 个物品名，一次遍历内存快照，不额外查库。 */
const itemNamesByBox = computed(() => {
  const map = new Map()
  for (const item of store.db.items) {
    const names = map.get(item.boxId)
    if (!names) {
      map.set(item.boxId, [item.name])
    } else if (names.length < 3) {
      names.push(item.name)
    }
  }
  return map
})

function summaryFor(box) {
  const names = itemNamesByBox.value.get(box.id) || []
  if (names.length) return names.join('、')
  return box.note || '暂无物品'
}

function statusLabel(status) {
  return (BOX_STATUS[status] || BOX_STATUS.packing).label
}

const filteredBoxes = computed(() => {
  if (statusFilter.value === 'all') return boxes.value
  return boxes.value.filter((box) => box.status === statusFilter.value)
})

const filters = computed(() => [
  { key: 'all', label: '全部', count: stats.value.total },
  ...BOX_STATUS_LIST.map((status) => ({
    key: status.key,
    label: status.label,
    count: stats.value[status.key],
  })),
])

const progressPercent = computed(() => {
  if (!stats.value.total) return 0
  return Math.round((stats.value.unpacked / stats.value.total) * 100)
})

onLoad((options) => {
  moveId.value = (options && options.id) || ''
})

onShow(() => {
  refresh()
})

function openCreate() {
  dialogVisible.value = true
}

function goBox(box) {
  uni.navigateTo({ url: `/pages/box/detail?id=${box.id}` })
}

function goSearch() {
  uni.navigateTo({ url: `/pages/search/index?id=${moveId.value}` })
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
/* ---------- 搬家信息 ---------- */
.move-head {
  padding: var(--sp-3) var(--sp-4);
  margin-bottom: var(--sp-3);
  background: var(--c-surface);
  border: 1rpx solid var(--c-line);
  border-radius: var(--r-card);
}

.move-head__name {
  display: block;
  overflow: hidden;
  font-size: var(--fs-page);
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.move-head__date {
  display: block;
  margin-top: var(--sp-1);
  font-size: var(--fs-sub);
  color: var(--c-ink-3);
}

.stats {
  display: flex;
  align-items: stretch;
  padding-top: var(--sp-2);
  margin-top: var(--sp-2);
  border-top: 1rpx solid var(--c-line);
}

.stat {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  align-items: center;
}

.stat__num {
  font-size: 48rpx;
  font-weight: 700;
  line-height: 1.2;
}

.stat__label {
  margin-top: 2rpx;
  font-size: var(--fs-note);
  color: var(--c-ink-3);
}

.stat__divider {
  width: 1rpx;
  background: var(--c-line);
}

.progress {
  padding-top: var(--sp-2);
  margin-top: var(--sp-2);
  border-top: 1rpx solid var(--c-line);
}

.progress__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: var(--sp-1);
}

.progress__value {
  font-size: var(--fs-sub);
  color: var(--c-ink-2);
}

.progress__percent {
  font-size: var(--fs-sub);
  font-weight: 600;
  color: var(--c-ink-2);
}

.progress__track {
  height: 12rpx;
  overflow: hidden;
  background: var(--c-line);
  border-radius: var(--r-pill);
}

.progress__fill {
  height: 100%;
  background: var(--c-accent);
  border-radius: var(--r-pill);
  transition: width 0.25s ease-out;
}

/* ---------- 搜索入口 ---------- */
.search-entry {
  display: flex;
  align-items: center;
  height: 88rpx;
  padding: 0 var(--sp-3);
  margin-bottom: var(--sp-2);
  background: var(--c-paper);
  border: 1rpx solid var(--c-line-strong);
  border-radius: var(--r-btn);
}

.search-entry__text {
  flex: 1;
  min-width: 0;
  margin-left: var(--sp-2);
  overflow: hidden;
  font-size: var(--fs-sub);
  color: var(--c-ink-3);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chevron {
  flex-shrink: 0;
  margin-left: var(--sp-1);
  font-size: 40rpx;
  line-height: 1;
  color: var(--c-decor);
}

.press {
  opacity: 0.6;
}

/* ---------- 筛选 ---------- */
.filters {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: var(--sp-1);
}

/* 外框保留 88rpx 点击热区，内层 pill 负责视觉高度 */
.filter {
  display: flex;
  align-items: center;
  height: 88rpx;
  margin: 0 var(--sp-2) 0 0;
}

.filter__pill {
  display: flex;
  align-items: center;
  height: 64rpx;
  padding: 0 var(--sp-3);
  font-size: var(--fs-note);
  color: var(--c-ink-2);
  background: var(--c-surface);
  border: 1rpx solid var(--c-line-strong);
  border-radius: var(--r-pill);
}

.filter--on .filter__pill {
  color: #fffdf8;
  background: var(--c-ink);
  border-color: var(--c-ink);
}

.filter--press {
  opacity: 0.7;
}

.filter__count {
  margin-left: var(--sp-1);
  opacity: 0.72;
}

/* ---------- 箱子行 ---------- */
.box-row {
  display: flex;
  align-items: center;
  min-height: 120rpx;
  padding: var(--sp-3) var(--sp-4);
  margin-bottom: var(--sp-2);
  background: var(--c-surface);
  border: 1rpx solid var(--c-line);
  border-radius: var(--r-card);
}

.box-tag {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  margin-right: var(--sp-3);
  background: #fff8ea;
  border: 2rpx solid #c9a87c;
  border-radius: var(--r-inner);
}

.box-tag__num {
  font-size: 40rpx;
  font-weight: 700;
  line-height: 1;
  color: #8a5a2b;
}

.box-row__body {
  flex: 1;
  min-width: 0;
}

.box-row__main {
  display: flex;
  align-items: baseline;
  min-width: 0;
}

.box-row__title {
  flex-shrink: 0;
  font-size: var(--fs-row);
  font-weight: 600;
  line-height: 1.4;
}

.box-row__room {
  min-width: 0;
  margin-left: var(--sp-1);
  overflow: hidden;
  font-size: var(--fs-sub);
  color: var(--c-ink-2);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.box-row__sub {
  display: block;
  margin-top: 4rpx;
  overflow: hidden;
  font-size: var(--fs-note);
  line-height: 1.4;
  color: var(--c-ink-3);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.box-row__status {
  flex-shrink: 0;
  margin-left: var(--sp-2);
  font-size: var(--fs-sub);
  color: var(--c-ink-2);
}

/* ---------- 编号提示 ---------- */
.rule-hint {
  display: flex;
  align-items: center;
  padding: var(--sp-3) 0 var(--sp-2);
}

.rule-hint__icon {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 30rpx;
  height: 30rpx;
  margin-right: var(--sp-1);
  border: 2rpx solid var(--c-decor);
  border-radius: 50%;
}

.rule-hint__i {
  font-size: 18rpx;
  font-weight: 600;
  line-height: 1;
  color: var(--c-ink-3);
}

.rule-hint__text {
  flex: 1;
  font-size: var(--fs-note);
  line-height: 1.5;
  color: var(--c-ink-3);
}
</style>
