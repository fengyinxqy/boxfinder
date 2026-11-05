<template>
  <AppDialog
    :model-value="modelValue"
    :title="move ? '重命名搬家' : '新建搬家'"
    :subtitle="move ? '改名不会影响已经分配的箱号' : '名字只用于区分不同的搬家'"
    confirm-text="保存"
    :loading="loading"
    @update:model-value="emit('update:modelValue', $event)"
    @confirm="handleSubmit"
  >
    <view class="field">
      <text class="field__label">搬家名称</text>
      <input
        v-model="name"
        class="field__input"
        :maxlength="20"
        placeholder="例如：我的第一次搬家"
        placeholder-class="field__placeholder"
        confirm-type="done"
        @confirm="handleSubmit"
      />
      <text v-if="error" class="field__error">{{ error }}</text>
    </view>
  </AppDialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import AppDialog from './AppDialog.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  move: { type: Object, default: null },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const name = ref('')
const error = ref('')

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) return
    name.value = props.move ? props.move.name : ''
    error.value = ''
  }
)

function handleSubmit() {
  const value = name.value.trim()
  if (!value) {
    error.value = '请填写搬家名称'
    return
  }
  if (value.length > 20) {
    error.value = '名称最多 20 个字'
    return
  }
  error.value = ''
  emit('submit', value)
}
</script>
