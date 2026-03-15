<template>
  <WorkbenchShell
    icon="🛠️"
    title="Admin Workbench"
    subtitle="管理员首页聚焦系统、任务、用户、授权和审计，不鼓励日常跨域操作。"
    :loading="loading"
    :error="error"
    :last-updated="data?.last_updated || '—'"
    :data-quality="error ? 'low' : 'high'"
  >
    <template #summary-cards>
      <div class="summary-card"><span class="summary-label">用户数</span><strong>{{ data?.summary?.users ?? 0 }}</strong></div>
      <div class="summary-card"><span class="summary-label">角色数</span><strong>{{ data?.summary?.roles ?? 0 }}</strong></div>
      <div class="summary-card"><span class="summary-label">权限项</span><strong>{{ data?.summary?.permissions ?? 0 }}</strong></div>
      <div class="summary-card"><span class="summary-label">拒绝访问</span><strong>{{ data?.summary?.denied_access_events ?? 0 }}</strong></div>
      <div class="summary-card"><span class="summary-label">关键告警</span><strong>{{ data?.summary?.critical_alerts ?? 0 }}</strong></div>
    </template>

    <ExplainabilityStrip
      :result-value="`${data?.summary?.critical_alerts ?? 0} alerts`"
      explanation="管理员拥有广泛权限，但所有授权变更和拒绝访问都应留下审计痕迹。"
      source-type="live"
      :data-quality="error ? 'low' : 'high'"
      :last-updated="data?.last_updated || '—'"
      suggested-action="优先检查系统告警、用户状态与近期授权拒绝。"
    />

    <section class="section-block">
      <div class="section-header">
        <h3>Quick Actions</h3>
        <p>管理入口统一收口到用户、角色、审计和系统监控。</p>
      </div>
      <div class="action-grid">
        <PermissionButton
          v-for="action in data?.quick_actions ?? []"
          :key="action.path"
          :permissions="[action.permission]"
          @click="router.push(action.path)"
        >
          {{ action.label }}
        </PermissionButton>
      </div>
    </section>

    <section class="section-block">
      <div class="section-header">
        <h3>Recent Audit</h3>
        <p>最近的授权相关记录会显示在这里，方便快速排障。</p>
      </div>
      <div v-if="(data?.audit ?? []).length" class="list-grid">
        <article v-for="item in data?.audit ?? []" :key="item.id" class="list-card">
          <div class="card-title">{{ item.username }} · {{ item.decision }}</div>
          <div class="card-meta">{{ item.event_type }} / {{ item.resource }} / {{ item.action }}</div>
        </article>
      </div>
      <div v-else class="empty-state">暂无审计记录</div>
    </section>
  </WorkbenchShell>
</template>

<script setup lang="ts">
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import ExplainabilityStrip from '@/components/workbench/ExplainabilityStrip.vue'
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import { fetchAdminOverview } from '@/api/roleWorkbenchService'
import WorkbenchShell from '@/components/workbench/WorkbenchShell.vue'
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import PermissionButton from '@/components/auth/PermissionButton.vue'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const data = ref<any | null>(null)
const loading = ref(false)
const error = ref('')

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    data.value = await fetchAdminOverview()
  } catch (err: any) {
    error.value = err?.response?.data?.detail || err?.message || '管理员首页加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.section-block { display:flex; flex-direction:column; gap:14px; padding:18px; border-radius:14px; border:1px solid rgba(56,189,248,0.12); background:rgba(15,23,42,0.72); }
.summary-card,.list-card { padding:16px; border-radius:12px; background:rgba(30,41,59,0.72); border:1px solid rgba(148,163,184,0.16); }
.summary-label,.card-meta,.section-header p,.empty-state { color:#94a3b8; }
.summary-card strong { display:block; margin-top:8px; font-size:1.5rem; color:#f8fafc; }
.card-title { font-weight:700; color:#f8fafc; margin-bottom:8px; }
.action-grid,.list-grid { display:grid; gap:12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
</style>
