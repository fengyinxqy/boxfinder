<template>
  <view class="page page--with-bar page--tabbar">
    <view class="hero">
      <view class="hero__copy">
        <text class="hero__title">每件物品，都有去处</text>
        <text class="hero__sub">写好箱号，再开始装箱</text>
      </view>
      <view class="hero__art">
        <view class="carton">
          <view class="carton__lid"></view>
          <view class="carton__tape"></view>
          <view class="carton__label">
            <text class="carton__num">1</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="store.error" class="alert">
      <text class="alert__text">{{ store.error }}</text>
      <text class="alert__action" @tap="refresh">重试</text>
    </view>

    <view class="section-head">
      <text class="section-title">我的搬家</text>
      <text class="section-action" @tap="goMine">数据与说明 ›</text>
    </view>

    <view v-if="moves.length" class="move-list">
      <view v-for="move in moves" :key="move.id" class="move-card" hover-class="press" @tap="goMove(move)">
        <view class="move-card__body">
          <text class="move-card__name">{{ move.name }}</text>
          <text class="move-card__meta">{{ formatDate(move.createdAt) }} 创建 · {{ boxCount(move.id) }} 个箱子</text>
        </view>
        <text class="move-card__rename" hover-class="press" @tap.stop="openRename(move)">改名 ›</text>
      </view>
    </view>

    <EmptyState v-else title="还没有搬家记录" description="创建第一次搬家，系统会从 1 号箱开始编号。">
      <button class="btn btn--ghost" hover-class="none" @tap="openCreate">创建第一次搬家</button>
    </EmptyState>

    <view class="guide-card">
      <text class="guide-card__title">使用说明</text>
      <view class="guide-steps">
        <view v-for="(step, index) in steps" :key="step" class="guide-step">
          <text class="guide-step__no">{{ index + 1 }}.</text>
          <text class="guide-step__text">{{ step }}</text>
        </view>
      </view>
      <text class="guide-card__note">数据仅保存在本机，请定期备份。</text>
    </view>

    <view class="bottom-bar bottom-bar--tabbar">
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

const steps = [
  '创建搬家：为本次搬家建立记录。',
  '编号装箱：按顺序写好箱号并装箱。',
  '搜索定位：通过物品或箱号快速找到位置。',
  '搬运拆箱：更新箱子状态，逐步完成搬家。',
]

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

/** 「数据与说明」：备份、占用等信息与帮助都在「我的」tab。 */
function goMine() {
  uni.switchTab({ url: '/pages/mine/index' })
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
/* ---------- Hero ---------- */
.hero {
  display: flex;
  align-items: center;
  padding: var(--sp-4);
  margin-bottom: var(--sp-4);
  background: #fff8ea;
  border: 1rpx solid var(--c-line);
  border-radius: var(--r-card);
}

.hero__copy {
  flex: 1;
  min-width: 0;
}

.hero__title {
  display: block;
  overflow: hidden;
  font-size: 40rpx;
  font-weight: 700;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero__sub {
  display: block;
  margin-top: var(--sp-1);
  font-size: var(--fs-sub);
  line-height: 1.5;
  color: var(--c-ink-2);
}

.hero__art {
  flex-shrink: 0;
  width: 156rpx;
  margin-left: var(--sp-3);
}

.carton {
  position: relative;
  width: 148rpx;
  height: 126rpx;
  margin-top: 20rpx;
  background: #e8c49c;
  border: 1rpx solid #c9a87c;
  border-radius: 6rpx;
}

.carton__lid {
  position: absolute;
  top: -18rpx;
  left: -6rpx;
  right: -6rpx;
  height: 26rpx;
  background: #dcb487;
  border: 1rpx solid #c9a87c;
  border-radius: 4rpx;
}

.carton__tape {
  position: absolute;
  top: -18rpx;
  left: 50%;
  width: 18rpx;
  height: 86rpx;
  margin-left: -9rpx;
  background: rgba(255, 250, 240, 0.66);
}

.carton__label {
  position: absolute;
  right: 12rpx;
  bottom: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56rpx;
  height: 56rpx;
  background: #fffdf8;
  border: 1rpx solid #c9a87c;
  border-radius: 4rpx;
}

.carton__num {
  font-size: 32rpx;
  font-weight: 700;
  line-height: 1;
  color: #8a5a2b;
}

/* ---------- 提示 ---------- */
.alert {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--sp-2) var(--sp-3);
  margin-bottom: var(--sp-3);
  background: #fbeae4;
  border-radius: var(--r-inner);
}

.alert__text {
  flex: 1;
  font-size: var(--fs-note);
  color: #a83e21;
}

.alert__action {
  margin-left: var(--sp-3);
  font-size: var(--fs-note);
  color: #a83e21;
  text-decoration: underline;
}

/* ---------- 搬家列表 ---------- */
.move-card {
  display: flex;
  align-items: center;
  padding: var(--sp-3) var(--sp-4);
  margin-bottom: var(--sp-2);
  background: var(--c-surface);
  border: 1rpx solid var(--c-line);
  border-radius: var(--r-card);
}

.move-card__body {
  flex: 1;
  min-width: 0;
}

.move-card__name {
  display: block;
  overflow: hidden;
  font-size: var(--fs-row);
  font-weight: 600;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.move-card__meta {
  display: block;
  margin-top: 6rpx;
  font-size: var(--fs-sub);
  line-height: 1.4;
  color: var(--c-ink-3);
}

.move-card__rename {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  min-width: 104rpx;
  min-height: 88rpx;
  margin-left: var(--sp-2);
  font-size: var(--fs-sub);
  color: var(--c-accent);
}

.press {
  opacity: 0.6;
}

/* ---------- 使用说明 ---------- */
.guide-card {
  padding: var(--sp-3) var(--sp-4);
  margin-top: var(--sp-4);
  background: var(--c-surface);
  border: 1rpx solid var(--c-line);
  border-radius: var(--r-card);
}

.guide-card__title {
  display: block;
  margin-bottom: var(--sp-1);
  font-size: var(--fs-section);
  font-weight: 600;
}

.guide-step {
  display: flex;
  align-items: flex-start;
  padding: 6rpx 0;
}

.guide-step__no {
  flex-shrink: 0;
  width: 36rpx;
  font-size: var(--fs-sub);
  line-height: 1.7;
  color: var(--c-ink-2);
}

.guide-step__text {
  flex: 1;
  font-size: var(--fs-sub);
  line-height: 1.7;
  color: var(--c-ink-2);
}

.guide-card__note {
  display: block;
  padding-top: var(--sp-2);
  margin-top: var(--sp-1);
  font-size: var(--fs-note);
  line-height: 1.5;
  color: var(--c-ink-3);
  border-top: 1rpx solid var(--c-line);
}
</style>
