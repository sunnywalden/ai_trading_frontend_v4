<template>
  <WorkbenchShell
    icon="📊"
    :title="pageTitle"
    :subtitle="pageSubtitle"
    :loading="loading"
    :error="error"
    :last-updated="data?.last_updated || '—'"
    :data-quality="error ? 'low' : 'high'"
  >
    <ExplainabilityStrip
      :result-value="headlineValue"
      :explanation="pageSubtitle"
      source-type="live"
      :data-quality="error ? 'low' : 'high'"
      :last-updated="data?.last_updated || '—'"
      suggested-action="如果摘要异常，再进入交易或系统工作台深挖。"
    />

    <section class="section-block">
      <div class="kv-grid">
        <article v-for="item in entries" :key="item.label" class="kv-card">
          <div class="kv-label">{{ item.label }}</div>
          <div class="kv-value">{{ item.value }}</div>
        </article>
      </div>
    </section>
  </WorkbenchShell>
</template>

<script setup lang="ts">
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import ExplainabilityStrip from '@/components/workbench/ExplainabilityStrip.vue'
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import { fetchExecutivePerformanceReport, fetchExecutiveRiskReport, fetchExecutiveSummary } from '@/api/roleWorkbenchService'
import WorkbenchShell from '@/components/workbench/WorkbenchShell.vue'
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const data = ref<any | null>(null)
const loading = ref(false)
const error = ref('')

const reportMode = computed(() => {
  if (route.path.includes('/risk')) return 'risk'
  if (route.path.includes('/performance')) return 'performance'
  return 'executive'
})

const pageTitle = computed(() => ({
  executive: '经营总览报表',
  risk: '风险报表',
  performance: '绩效报表',
}[reportMode.value]))

const pageSubtitle = computed(() => ({
  executive: '主管视角下的核心经营结果与系统摘要。',
  risk: '聚焦风险等级、收益压力和执行纪律的高层摘要。',
  performance: '聚焦收益与资本效率，不展示研究和执行配置细节。',
}[reportMode.value]))

const entries = computed(() => {
  if (!data.value) return []
  if (reportMode.value === 'executive') {
    return (data.value.summary_cards ?? []).map((item: any) => ({ label: item.label, value: item.value }))
  }
  const block = reportMode.value === 'risk' ? data.value.risk : data.value.performance
  return Object.entries(block ?? {}).map(([label, value]) => ({ label, value }))
})

const headlineValue = computed(() => entries.value[0]?.value ?? '—')

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    if (reportMode.value === 'risk') data.value = await fetchExecutiveRiskReport()
    else if (reportMode.value === 'performance') data.value = await fetchExecutivePerformanceReport()
    else data.value = await fetchExecutiveSummary()
  } catch (err: any) {
    error.value = err?.response?.data?.detail || err?.message || '报表加载失败'
  } finally {
    loading.value = false
  }
}

watch(reportMode, loadData)
onMounted(loadData)
</script>

<style scoped>
.section-block { padding:18px; border-radius:14px; border:1px solid rgba(56,189,248,0.12); background:rgba(15,23,42,0.72); }
.kv-grid { display:grid; gap:12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.kv-card { padding:16px; border-radius:12px; background:rgba(30,41,59,0.72); border:1px solid rgba(148,163,184,0.16); }
.kv-label { color:#94a3b8; margin-bottom:6px; }
.kv-value { color:#f8fafc; font-size:1.25rem; font-weight:700; }
</style>
