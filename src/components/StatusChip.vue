<template>
  <view class="chip" :class="'chip--' + tone">
    <view class="chip__dot"></view>
    <text class="chip__label">{{ label }}</text>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { BOX_STATUS } from '../constants/index.js'

const props = defineProps({
  status: { type: String, default: 'packing' },
})

const meta = computed(() => BOX_STATUS[props.status] || BOX_STATUS.packing)
const tone = computed(() => meta.value.tone)
const label = computed(() => meta.value.label)
</script>

<style scoped>
.chip {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
}

.chip__dot {
  width: 10rpx;
  height: 10rpx;
  margin-right: 8rpx;
  border-radius: 50%;
}

.chip__label {
  font-size: 22rpx;
  font-weight: 500;
  line-height: 1.4;
}

.chip--packing {
  background: var(--c-accent-soft);
  color: var(--c-accent);
}

.chip--packing .chip__dot {
  background: var(--c-accent);
}

.chip--sealed {
  background: var(--c-amber-soft);
  color: var(--c-amber);
}

.chip--sealed .chip__dot {
  background: var(--c-amber);
}

.chip--moved {
  background: var(--c-plum-soft);
  color: var(--c-plum);
}

.chip--moved .chip__dot {
  background: var(--c-plum);
}

.chip--unpacked {
  background: var(--c-green-soft);
  color: var(--c-green);
}

.chip--unpacked .chip__dot {
  background: var(--c-green);
}
</style>
