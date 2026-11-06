<template>
  <view class="page">
    <text v-if="moveName" class="search-move">{{ moveName }}</text>

    <view class="search-box">
      <view class="icon-search">
        <view class="icon-search__ring"></view>
        <view class="icon-search__handle"></view>
      </view>
      <input
        v-model="query"
        class="search-box__input"
        placeholder="搜索物品名称或箱号"
        placeholder-class="field__placeholder"
        confirm-type="search"
        :focus="autoFocus"
      />
      <view v-if="query" class="search-box__clear" @tap="clearQuery">
        <text class="search-box__clear-icon">×</text>
      </view>
    </view>

    <view v-if="!query.trim()" class="hint">
      <text class="hint__title">输入物品名称或箱号</text>
      <text class="hint__text">例如搜「充电器」会显示「3 号箱 · 书房」；直接输入「3」可以查看 3 号箱。</text>
    </view>

    <template v-else>
      <view v-if="result.boxes.length" class="result-group">
        <text class="result-group__title">箱子</text>
        <view v-for="row in result.boxes" :key="row.box.id" class="box-row" hover-class="press" @tap="goBox(row.box)">
          <view class="box-tag">
            <text class="box-tag__num">{{ row.box.no }}</text>
          </view>
          <view class="box-row__body">
            <view class="box-row__main">
              <text class="box-row__title">{{ row.box.no }} 号箱</text>
              <text class="box-row__room">{{ row.box.room }}</text>
            </view>
            <text class="box-row__meta">{{ row.itemCount }} 件物品 · {{ statusLabel(row.box.status) }}</text>
          </view>
          <text class="chevron">›</text>
        </view>
      </view>

      <view v-if="result.items.length" class="result-group">
        <text class="result-group__title">物品</text>
        <view v-for="row in result.items" :key="row.item.id" class="item-row" hover-class="press" @tap="goBox(row.box)">
          <view class="item-row__body">
            <text class="item-row__name">{{ row.item.name }}</text>
            <text class="item-row__qty">数量 ×{{ row.item.quantity }}</text>
          </view>
          <text class="item-row__loc">{{ row.box.no }} 号箱 · {{ row.box.room }}</text>
          <text class="chevron">›</text>
        </view>
      </view>

      <EmptyState v-if="!hasResults" title="没有找到" :description="`没有与「${query.trim()}」匹配的物品或箱号。`" />

      <text v-if="hasResults" class="result-hint">点击结果查看所在箱子</text>
    </template>
  </view>
</template>

<script setup>
import { computed, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { refresh, store } from '../../store/index.js'
import { searchInDb } from '../../services/search.js'
import { BOX_STATUS } from '../../constants/index.js'
import EmptyState from '../../components/EmptyState.vue'

const moveId = ref('')
const query = ref('')
const autoFocus = ref(false)

// 直接读 store 快照：移箱或改状态后回到本页，结果自动重新计算。
const result = computed(() => searchInDb(store.db, moveId.value, query.value))
const hasResults = computed(() => result.value.items.length > 0 || result.value.boxes.length > 0)
const moveName = computed(() => {
  const move = store.db.moves.find((item) => item.id === moveId.value)
  return move ? move.name : ''
})

onLoad((options) => {
  moveId.value = (options && options.id) || ''
})

onShow(() => {
  refresh()
  autoFocus.value = true
})

function statusLabel(status) {
  return (BOX_STATUS[status] || BOX_STATUS.packing).label
}

function goBox(box) {
  uni.navigateTo({ url: `/pages/box/detail?id=${box.id}` })
}

function clearQuery() {
  query.value = ''
}
</script>

<style scoped>
.search-move {
  display: block;
  overflow: hidden;
  padding: var(--sp-1) 0 0;
  font-size: var(--fs-sub);
  color: var(--c-ink-3);
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ---------- 搜索框 ---------- */
.search-box {
  display: flex;
  align-items: center;
  height: 88rpx;
  padding: 0 var(--sp-3);
  margin: var(--sp-2) 0 var(--sp-3);
  background: var(--c-paper);
  border: 1rpx solid var(--c-line-strong);
  border-radius: var(--r-btn);
}

.search-box__input {
  flex: 1;
  min-width: 0;
  height: 100%;
  margin-left: var(--sp-2);
  font-size: var(--fs-row);
}

.search-box__clear {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 88rpx;
  margin-right: calc(-1 * var(--sp-3));
}

.search-box__clear-icon {
  font-size: 36rpx;
  line-height: 1;
  color: var(--c-ink-3);
}

.press {
  opacity: 0.6;
}

/* ---------- 初始提示 ---------- */
.hint {
  padding: var(--sp-4);
  margin-top: var(--sp-1);
  background: var(--c-surface);
  border: 1rpx solid var(--c-line);
  border-radius: var(--r-card);
}

.hint__title {
  display: block;
  font-size: var(--fs-row);
  font-weight: 600;
}

.hint__text {
  display: block;
  margin-top: var(--sp-1);
  font-size: var(--fs-sub);
  line-height: 1.7;
  color: var(--c-ink-2);
}

/* ---------- 结果 ---------- */
.result-group {
  margin-bottom: var(--sp-3);
}

.result-group__title {
  display: block;
  padding: 0 0 var(--sp-1);
  font-size: var(--fs-section);
  font-weight: 600;
}

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

.box-row__meta {
  display: block;
  margin-top: 4rpx;
  font-size: var(--fs-note);
  color: var(--c-ink-3);
}

.item-row {
  display: flex;
  align-items: center;
  min-height: 104rpx;
  padding: var(--sp-3) var(--sp-4);
  margin-bottom: var(--sp-2);
  background: var(--c-surface);
  border: 1rpx solid var(--c-line);
  border-radius: var(--r-card);
}

.item-row__body {
  flex: 1;
  min-width: 0;
}

.item-row__name {
  display: block;
  overflow: hidden;
  font-size: var(--fs-row);
  font-weight: 600;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-row__qty {
  display: block;
  margin-top: 4rpx;
  font-size: var(--fs-note);
  color: var(--c-ink-3);
}

.item-row__loc {
  flex-shrink: 0;
  margin-left: var(--sp-2);
  font-size: var(--fs-sub);
  font-weight: 600;
  color: var(--c-accent);
  white-space: nowrap;
}

.chevron {
  flex-shrink: 0;
  margin-left: var(--sp-1);
  font-size: 40rpx;
  line-height: 1;
  color: var(--c-decor);
}

.result-hint {
  display: block;
  padding: var(--sp-4) 0 calc(var(--sp-3) + env(safe-area-inset-bottom));
  font-size: var(--fs-note);
  color: var(--c-ink-3);
  text-align: center;
}
</style>
