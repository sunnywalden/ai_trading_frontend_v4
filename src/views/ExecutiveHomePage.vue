<template>
  <WorkbenchShell
    icon="🧾"
    title="Executive Workbench"
    subtitle="主管视角默认极简：先看收益、风险和系统健康，再决定是否深入。"
    :loading="loading"
    :error="error"
    :last-updated="data?.last_updated || '—'"
    :data-quality="error ? 'low' : 'high'"
  >
    <template #summary-cards>
      <div v-for="card in data?.summary_cards ?? []" :key="card.label" class="summary-card">
        <span class="summary-label">{{ card.label }}</span>
        <strong>{{ card.value }}</strong>
      </div>
    </template>

    <ExplainabilityStrip
      :result-value="data?.summary_cards?.[2]?.value ?? 'UNKNOWN'"
      explanation="主管默认只面对经营摘要，不被实现细节和写操作按钮打断。"
      source-type="live"
      :data-quality="error ? 'low' : 'high'"
      :last-updated="data?.last_updated || '—'"
      suggested-action="先看经营总览，再按需进入风险或绩效报表。"
    />

    <section class="section-block">
      <div class="section-header">
        <h3>Highlights</h3>
        <p>把最值得升级关注的摘要聚在一起。</p>
      </div>
      <div class="list-grid">
        <article v-for="item in data?.highlights ?? []" :key="item.title" class="list-card">
          <div class="card-title">{{ item.title }}</div>
          <div class="card-value">{{ item.value }}</div>
          <div class="card-meta">{{ item.description }}</div>
        </article>
      </div>
    </section>

    <section class="section-block">
      <div class="section-header">
        <h3>Reports</h3>
        <p>主管入口只保留三张报表，不开放平台治理动作。</p>
      </div>
      <div class="action-grid">
        <PermissionButton
          v-for="report in data?.reports ?? []"
          :key="report.path"
          :permissions="[report.permission]"
          access-mode="summary"
          @click="router.push(report.path)"
        >
          {{ report.label }}
        </PermissionButton>
      </div>
    </section>
  </WorkbenchShell>
</template>

<script setup lang="ts">
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import ExplainabilityStrip from '@/components/workbench/ExplainabilityStrip.vue'
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import WorkbenchShell from '@/components/workbench/WorkbenchShell.vue'
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import { fetchExecutiveSummary } from '@/api/roleWorkbenchService'
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
    data.value = await fetchExecutiveSummary()
  } catch (err: any) {
    error.value = err?.response?.data?.detail || err?.message || '主管首页加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.section-block { display:flex; flex-direction:column; gap:14px; padding:18px; border-radius:14px; border:1px solid rgba(56,189,248,0.12); background:rgba(15,23,42,0.72); }
.summary-card,.list-card { padding:16px; border-radius:12px; background:rgba(30,41,59,0.72); border:1px solid rgba(148,163,184,0.16); }
.summary-label,.card-meta,.section-header p { color:#94a3b8; }
.summary-card strong,.card-value { display:block; margin-top:8px; font-size:1.5rem; color:#f8fafc; }
.card-title { font-weight:700; color:#f8fafc; margin-bottom:8px; }
.action-grid,.list-grid { display:grid; gap:12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
</style>
