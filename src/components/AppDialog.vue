<template>
  <view v-if="modelValue" class="dialog" @tap="handleMaskTap">
    <view class="dialog__panel" @tap.stop>
      <view class="dialog__grabber"></view>
      <view class="dialog__head">
        <text class="dialog__title">{{ title }}</text>
        <text v-if="subtitle" class="dialog__subtitle">{{ subtitle }}</text>
      </view>
      <view class="dialog__body">
        <slot />
      </view>
      <view class="dialog__footer">
        <button class="btn btn--ghost dialog__btn" hover-class="none" @tap="handleCancel">取消</button>
        <button class="btn btn--primary dialog__btn" hover-class="none" :loading="loading" @tap="handleConfirm">
          {{ confirmText }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  confirmText: { type: String, default: '保存' },
  loading: { type: Boolean, default: false },
  maskClosable: { type: Boolean, default: true },
})

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel'])

function close() {
  if (props.loading) return
  emit('update:modelValue', false)
}

function handleMaskTap() {
  if (props.maskClosable) close()
}

function handleCancel() {
  emit('cancel')
  close()
}

function handleConfirm() {
  if (props.loading) return
  emit('confirm')
}
</script>

<style scoped>
.dialog {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 900;
  display: flex;
  align-items: flex-end;
  background: rgba(32, 24, 16, 0.42);
  animation: dialog-mask-in 0.18s ease-out;
}

.dialog__panel {
  width: 100%;
  max-height: 88vh;
  overflow-y: auto;
  padding: 18rpx 32rpx calc(24rpx + env(safe-area-inset-bottom));
  background: #fffdf8;
  border-radius: 32rpx 32rpx 0 0;
  animation: dialog-up 0.24s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.dialog__grabber {
  width: 68rpx;
  height: 8rpx;
  margin: 0 auto 26rpx;
  background: var(--c-line-strong);
  border-radius: 999rpx;
}

.dialog__head {
  margin-bottom: 30rpx;
}

.dialog__title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
}

.dialog__subtitle {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.5;
  color: var(--c-ink-3);
}

.dialog__body {
  padding-bottom: 6rpx;
}

.dialog__footer {
  display: flex;
  padding-top: 12rpx;
}

.dialog__btn {
  flex: 1;
}

.dialog__btn + .dialog__btn {
  margin-left: 20rpx;
}

@keyframes dialog-mask-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes dialog-up {
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
