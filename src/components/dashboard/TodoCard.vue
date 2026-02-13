<template>
  <div class="todo-card" :class="'priority-' + todo.priority" @click="$emit('click')">
    <div class="todo-header">
      <span class="todo-icon">{{ getIcon(todo.todo_type) }}</span>
      <span class="todo-priority" :class="'priority-' + todo.priority">{{ todo.priority }}</span>
    </div>
    <h4 class="todo-title">{{ todo.title }}</h4>
    <p class="todo-description">{{ todo.description }}</p>
    <div class="todo-footer" v-if="todo.due_at">
      <span class="due-time">截止: {{ formatTime(todo.due_at) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TodoItem } from '@/api/client'

defineProps<{
  todo: TodoItem
}>()

defineEmits(['click'])

function getIcon(type: string): string {
  const icons: Record<string, string> = {
    'alert': '🔔',
    'plan_expiring': '⏰',
    'signal_pending': '📊',
    'risk_warning': '⚠️',
  }
  return icons[type] || '•'
}

function formatTime(timeStr: string): string {
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.todo-card {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 3px solid #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.todo-card:hover {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.todo-card.priority-high {
  border-left-color: #ef4444;
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.todo-icon {
  font-size: 1.1rem;
}

.todo-priority {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
}

.todo-priority.priority-high {
  background: #fee2e2;
  color: #991b1b;
}

.todo-priority.priority-medium {
  background: #fef3c7;
  color: #92400e;
}

.todo-priority.priority-low {
  background: #dbeafe;
  color: #1e40af;
}

.todo-title {
  font-size: 0.9rem;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.todo-description {
  font-size: 0.8rem;
  color: var(--text-secondary, #666);
  margin: 0;
}

.todo-footer {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
}

.due-time {
  font-size: 0.75rem;
  color: var(--text-secondary, #888);
}
</style>