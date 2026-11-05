<template>
  <view v-if="modelValue" class="sheet" @tap="close">
    <view class="sheet__panel" @tap.stop>
      <view class="sheet__grabber"></view>
      <text class="sheet__title">移动物品</text>
      <text class="sheet__subtitle">{{ subtitle }}</text>

      <view v-if="boxes.length" class="sheet__list">
        <view v-for="target in boxes" :key="target.id" class="target" @tap="emit('select', target)">
          <view class="target__tag">
            <text class="target__num">{{ target.no }}</text>
            <text class="target__unit">号箱</text>
          </view>
          <view class="target__body">
            <text class="target__room">{{ target.room }}</text>
            <text class="target__note">{{ target.note || '暂无备注' }}</text>
          </view>
          <text class="target__arrow">›</text>
        </view>
      </view>

      <text v-else class="sheet__empty">这次搬家还没有其他箱子，先新建一个再移动。</text>

      <button class="btn btn--ghost sheet__cancel" hover-class="none" @tap="close">取消</button>
    </view>
  </view>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  item: { type: Object, default: null },
  currentBox: { type: Object, default: null },
  boxes: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'select'])

const subtitle = computed(() => {
  if (!props.item || !props.currentBox) return '选择要移入的箱子。'
  return `「${props.item.name}」目前在 ${props.currentBox.no} 号箱，选择要移入的箱子。`
})

function close() {
  emit('update:modelValue', false)
}
</script>

<style scoped>
.sheet {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 900;
  display: flex;
  align-items: flex-end;
  background: rgba(32, 24, 16, 0.42);
  animation: sheet-mask-in 0.18s ease-out;
}

.sheet__panel {
  width: 100%;
  max-height: 82vh;
  overflow-y: auto;
  padding: 18rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  background: #fffdf8;
  border-radius: 32rpx 32rpx 0 0;
  animation: sheet-up 0.24s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.sheet__grabber {
  width: 68rpx;
  height: 8rpx;
  margin: 0 auto 26rpx;
  background: var(--c-line-strong);
  border-radius: 999rpx;
}

.sheet__title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
}

.sheet__subtitle {
  display: block;
  margin: 8rpx 0 24rpx;
  font-size: 24rpx;
  line-height: 1.6;
  color: var(--c-ink-3);
}

.target {
  display: flex;
  align-items: center;
  padding: 18rpx 22rpx;
  margin-bottom: 14rpx;
  background: var(--c-surface);
  border: 1rpx solid var(--c-line);
  border-radius: 20rpx;
}

.target__tag {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 84rpx;
  height: 94rpx;
  margin-right: 20rpx;
  background: #fff8ea;
  border: 2rpx dashed #c9a87c;
  border-radius: 12rpx;
}

.target__num {
  font-size: 40rpx;
  font-weight: 700;
  line-height: 1;
  color: #8a5a2b;
}

.target__unit {
  margin-top: 4rpx;
  font-size: 18rpx;
  color: #a98c63;
}

.target__body {
  flex: 1;
  min-width: 0;
}

.target__room {
  display: block;
  font-size: 29rpx;
  font-weight: 600;
}

.target__note {
  display: block;
  margin-top: 6rpx;
  overflow: hidden;
  font-size: 22rpx;
  color: var(--c-ink-3);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.target__arrow {
  font-size: 38rpx;
  line-height: 1;
  color: var(--c-ink-3);
}

.sheet__empty {
  display: block;
  padding: 30rpx 0;
  font-size: 25rpx;
  line-height: 1.7;
  color: var(--c-ink-3);
}

.sheet__cancel {
  margin-top: 14rpx;
}

@keyframes sheet-mask-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes sheet-up {
  from {
    opacity: 0.6;
    transform: translateY(40rpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
