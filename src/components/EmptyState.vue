<template>
  <view class="empty">
    <view class="empty__art">
      <view class="empty__box empty__box--back"></view>
      <view class="empty__box"></view>
    </view>
    <text class="empty__title">{{ title }}</text>
    <text v-if="description" class="empty__desc">{{ description }}</text>
    <view class="empty__action">
      <slot />
    </view>
  </view>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  description: { type: String, default: '' },
})
</script>

<style scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64rpx 32rpx 52rpx;
  background: rgba(255, 253, 248, 0.6);
  border: 2rpx dashed var(--c-line-strong);
  border-radius: 28rpx;
}

.empty__art {
  position: relative;
  width: 140rpx;
  height: 112rpx;
  margin-bottom: 30rpx;
}

.empty__box {
  position: absolute;
  left: 30rpx;
  bottom: 0;
  width: 88rpx;
  height: 76rpx;
  background: #fff8ea;
  border: 2rpx dashed #c9a87c;
  border-radius: 10rpx;
}

.empty__box--back {
  left: 8rpx;
  bottom: 26rpx;
  width: 72rpx;
  height: 62rpx;
  opacity: 0.5;
  transform: rotate(-8deg);
}

.empty__title {
  font-size: 30rpx;
  font-weight: 600;
  color: var(--c-ink-2);
}

.empty__desc {
  max-width: 520rpx;
  margin-top: 12rpx;
  font-size: 24rpx;
  color: var(--c-ink-3);
  line-height: 1.6;
  text-align: center;
}

.empty__action {
  margin-top: 28rpx;
}
</style>
