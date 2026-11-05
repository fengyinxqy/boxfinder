<template>
  <AppDialog
    :model-value="modelValue"
    :title="box ? '编辑箱子' : '新建箱子'"
    :subtitle="box ? '箱号创建后不可修改' : '保存后自动分配下一个箱号'"
    confirm-text="保存"
    :loading="loading"
    @update:model-value="emit('update:modelValue', $event)"
    @confirm="handleSubmit"
  >
    <view class="assign">
      <text class="assign__label">箱号</text>
      <text class="assign__value">{{ box ? box.no + ' 号箱' : nextNo + ' 号箱' }}</text>
      <text class="assign__hint">{{ box ? '编号保持不变' : '删除箱子也不会复用旧编号' }}</text>
    </view>

    <view class="field">
      <text class="field__label">目标房间</text>
      <input
        v-model="room"
        class="field__input"
        :maxlength="16"
        placeholder="例如：卧室"
        placeholder-class="field__placeholder"
      />
      <view class="presets">
        <view
          v-for="preset in presets"
          :key="preset"
          class="preset"
          :class="{ 'preset--on': room.trim() === preset }"
          @tap="room = preset"
        >
          {{ preset }}
        </view>
      </view>
    </view>

    <view class="field">
      <text class="field__label">备注（选填）</text>
      <textarea
        v-model="note"
        class="field__textarea"
        :maxlength="60"
        placeholder="例如：衣物和床品，搬家时先拆这箱"
        placeholder-class="field__placeholder"
      />
      <text class="field__count">{{ note.length }}/60</text>
    </view>

    <text v-if="error" class="field__error">{{ error }}</text>
  </AppDialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import AppDialog from './AppDialog.vue'
import { ROOM_PRESETS } from '../constants/index.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  box: { type: Object, default: null },
  nextNo: { type: Number, default: 1 },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const presets = ROOM_PRESETS
const room = ref('')
const note = ref('')
const error = ref('')

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return
    room.value = props.box ? props.box.room : ''
    note.value = props.box ? props.box.note : ''
    error.value = ''
  }
)

function handleSubmit() {
  const cleanRoom = room.value.trim()
  const cleanNote = note.value.trim()
  if (!cleanRoom) {
    error.value = '请填写目标房间'
    return
  }
  if (cleanNote.length > 60) {
    error.value = '备注最多 60 个字'
    return
  }
  error.value = ''
  emit('submit', { room: cleanRoom, note: cleanNote })
}
</script>

<style scoped>
.assign {
  display: flex;
  align-items: baseline;
  padding: 22rpx 26rpx;
  margin-bottom: 30rpx;
  background: #fdf3e0;
  border: 2rpx dashed #d8b98a;
  border-radius: 18rpx;
}

.assign__label {
  margin-right: 20rpx;
  font-size: 24rpx;
  color: #9a7644;
}

.assign__value {
  font-size: 40rpx;
  font-weight: 700;
  color: #8a5a2b;
}

.assign__hint {
  flex: 1;
  margin-left: 16rpx;
  font-size: 21rpx;
  color: #a98c63;
  text-align: right;
}

.presets {
  display: flex;
  flex-wrap: wrap;
  margin-top: 16rpx;
}

.preset {
  padding: 8rpx 20rpx;
  margin: 0 12rpx 12rpx 0;
  font-size: 24rpx;
  color: var(--c-ink-2);
  background: #f8f2e7;
  border: 1rpx solid var(--c-line);
  border-radius: 999rpx;
}

.preset--on {
  color: var(--c-accent);
  background: var(--c-accent-soft);
  border-color: #e3b49c;
}
</style>
