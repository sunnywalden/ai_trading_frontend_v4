<template>
  <WorkbenchShell
    icon="⛔"
    title="403 · 无权限访问"
    subtitle="你当前登录角色不能访问这个页面；系统已经很礼貌地把门关上了。"
    :last-updated="new Date().toLocaleString('zh-CN', { hour12: false })"
    data-quality="high"
  >
    <ExplainabilityStrip
      result-value="ACCESS DENIED"
      explanation="前端负责裁剪体验，但最终是否允许访问，以后端授权结果为准。"
      source-type="rule"
      data-quality="high"
      :last-updated="new Date().toLocaleString('zh-CN', { hour12: false })"
      suggested-action="返回你的角色首页，或联系管理员调整角色授权。"
    />

    <section class="forbidden-card">
      <p class="forbidden-detail">如果你刚被分配了新角色，请重新登录后再试。</p>
      <div class="action-row">
        <button class="action-btn" @click="router.push(auth.homePath)">返回角色首页</button>
        <button class="action-btn secondary" @click="router.push('/login')">重新登录</button>
      </div>
    </section>
  </WorkbenchShell>
</template>

<script setup lang="ts">
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import ExplainabilityStrip from '@/components/workbench/ExplainabilityStrip.vue'
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import WorkbenchShell from '@/components/workbench/WorkbenchShell.vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()
</script>

<style scoped>
.forbidden-card {
  padding: 24px;
  border-radius: 16px;
  border: 1px solid rgba(248, 113, 113, 0.25);
  background: rgba(127, 29, 29, 0.16);
}
.forbidden-detail { color: #fecaca; margin-bottom: 16px; }
.action-row { display: flex; gap: 12px; flex-wrap: wrap; }
.action-btn { padding: 10px 14px; border-radius: 10px; border: 1px solid rgba(248,113,113,0.25); background: rgba(127,29,29,0.64); color: #fff7ed; cursor: pointer; }
.action-btn.secondary { background: rgba(15,23,42,0.72); border-color: rgba(148,163,184,0.25); color: #e2e8f0; }
</style>
