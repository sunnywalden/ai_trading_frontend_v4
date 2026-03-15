<template>
  <slot v-if="allowed" />
  <slot v-else name="fallback">
    <div v-if="showMessage" class="permission-guard__message">
      {{ fallbackText }}
    </div>
  </slot>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth';
import type { AccessMode, RoleCode } from '@/types/auth';
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  roles?: RoleCode[]
  permissions?: string[]
  accessMode?: AccessMode
  showMessage?: boolean
  fallbackText?: string
}>(), {
  showMessage: false,
  fallbackText: '当前角色无此权限',
})

const auth = useAuthStore()
const allowed = computed(() => auth.canPerform({
  roles: props.roles,
  permissions: props.permissions,
  accessMode: props.accessMode,
}))
</script>

<style scoped>
.permission-guard__message {
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px dashed rgba(248, 113, 113, 0.35);
  background: rgba(127, 29, 29, 0.18);
  color: #fecaca;
  font-size: 0.85rem;
}
</style>
