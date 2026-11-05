<template>
  <view class="page">
    <view class="search-box">
      <text class="search-box__icon">⌕</text>
      <input
        v-model="query"
        class="search-box__input"
        placeholder="搜物品名称，或直接输箱号"
        placeholder-class="field__placeholder"
        confirm-type="search"
        :focus="autoFocus"
      />
      <text v-if="query" class="search-box__clear" @tap="clearQuery">×</text>
    </view>

    <view v-if="!query.trim()" class="hint">
      <text class="hint__title">输入物品名称或箱号</text>
      <text class="hint__text">例如搜「充电器」会显示「3 号箱 · 书房」；直接输入「3」可以查看 3 号箱。</text>
    </view>

    <template v-else>
      <view v-if="result.boxes.length" class="result-group">
        <text class="result-group__title">箱子</text>
        <view v-for="row in result.boxes" :key="row.box.id" class="box-row" @tap="goBox(row.box)">
          <view class="box-tag">
            <text class="box-tag__num">{{ row.box.no }}</text>
            <text class="box-tag__unit">号箱</text>
          </view>
          <view class="box-row__body">
            <text class="box-row__room">{{ row.box.room }}</text>
            <text class="box-row__meta">{{ row.itemCount }} 件物品 · {{ statusLabel(row.box.status) }}</text>
          </view>
          <text class="row-arrow">›</text>
        </view>
      </view>

      <view v-if="result.items.length" class="result-group">
        <text class="result-group__title">物品</text>
        <view v-for="row in result.items" :key="row.item.id" class="item-row" @tap="goBox(row.box)">
          <view class="item-row__body">
            <text class="item-row__name">{{ row.item.name }}</text>
            <text class="item-row__qty">数量 ×{{ row.item.quantity }}</text>
          </view>
          <text class="item-row__loc">{{ row.box.no }} 号箱 · {{ row.box.room }}</text>
          <text class="row-arrow">›</text>
        </view>
      </view>

      <EmptyState v-if="!hasResults" title="没有找到" :description="`没有与「${query.trim()}」匹配的物品或箱号。`" />
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
.search-box {
  display: flex;
  align-items: center;
  height: 92rpx;
  padding: 0 24rpx;
  margin: 8rpx 0 26rpx;
  background: var(--c-paper);
  border: 1rpx solid var(--c-line-strong);
  border-radius: 999rpx;
}

.search-box__icon {
  margin-right: 14rpx;
  font-size: 34rpx;
  color: var(--c-ink-3);
}

.search-box__input {
  flex: 1;
  height: 100%;
  font-size: 30rpx;
}

.search-box__clear {
  padding: 0 8rpx 0 18rpx;
  font-size: 36rpx;
  line-height: 1;
  color: var(--c-ink-3);
}

.hint {
  padding: 40rpx 32rpx;
  margin-top: 12rpx;
  background: rgba(255, 253, 248, 0.6);
  border: 2rpx dashed var(--c-line-strong);
  border-radius: 24rpx;
}

.hint__title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: var(--c-ink-2);
}

.hint__text {
  display: block;
  margin-top: 12rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: var(--c-ink-3);
}

.result-group {
  margin-bottom: 28rpx;
}

.result-group__title {
  display: block;
  padding: 4rpx 4rpx 14rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: var(--c-ink-3);
  letter-spacing: 2rpx;
}

.box-row {
  display: flex;
  align-items: center;
  padding: 20rpx 24rpx;
  margin-bottom: 16rpx;
  background: var(--c-surface);
  border: 1rpx solid var(--c-line);
  border-radius: 22rpx;
}

.box-tag {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 88rpx;
  height: 100rpx;
  margin-right: 20rpx;
  background: #fff8ea;
  border: 2rpx dashed #c9a87c;
  border-radius: 12rpx;
}

.box-tag__num {
  font-size: 42rpx;
  font-weight: 700;
  line-height: 1;
  color: #8a5a2b;
}

.box-tag__unit {
  margin-top: 4rpx;
  font-size: 18rpx;
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

.box-row__meta {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--c-ink-3);
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

.item-row__body {
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

.item-row__qty {
  display: block;
  margin-top: 6rpx;
  font-size: 22rpx;
  color: var(--c-ink-3);
}

.item-row__loc {
  flex-shrink: 0;
  margin-left: 16rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: var(--c-accent);
}

.row-arrow {
  margin-left: 12rpx;
  font-size: 38rpx;
  line-height: 1;
  color: var(--c-ink-3);
}
</style>
