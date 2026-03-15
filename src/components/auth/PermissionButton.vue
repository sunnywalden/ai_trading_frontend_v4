<template>
  <button
    class="permission-btn"
    :class="{ 'permission-btn--disabled': !allowed }"
    :disabled="disabled || !allowed"
    :title="!allowed ? deniedText : title"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import type { AccessMode, RoleCode } from '@/types/auth';
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  roles?: RoleCode[]
  permissions?: string[]
  accessMode?: AccessMode
  disabled?: boolean
  deniedText?: string
  title?: string
}>(), {
  disabled: false,
  deniedText: '当前角色无此操作权限',
  title: '',
})

const emit = defineEmits<{
  click: [MouseEvent]
}>()

const auth = useAuthStore()
const allowed = computed(() => auth.canPerform({
  roles: props.roles,
  permissions: props.permissions,
  accessMode: props.accessMode,
}))

function handleClick(event: MouseEvent) {
  if (!allowed.value || props.disabled) {
    event.preventDefault()
    return
  }
  emit('click', event)
}
</script>

<style scoped>
.permission-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(56, 189, 248, 0.18);
  background: rgba(15, 23, 42, 0.82);
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.18s ease;
}

.permission-btn:hover:not(:disabled) {
  border-color: rgba(56, 189, 248, 0.45);
  color: #f8fafc;
  background: rgba(30, 41, 59, 0.92);
}

.permission-btn--disabled,
.permission-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
</style>
