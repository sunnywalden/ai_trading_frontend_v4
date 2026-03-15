<template>
  <WorkbenchShell
    icon="📈"
    title="Trading Workbench"
    subtitle="交易员只看订单、执行、持仓和异常，不让研究信息跑来抢方向盘。"
    :loading="loading"
    :error="error"
    :last-updated="data?.last_updated || '—'"
    :data-quality="error ? 'low' : 'high'"
  >
    <template #summary-cards>
      <div class="summary-card"><span class="summary-label">活跃持仓</span><strong>{{ data?.summary?.active_positions ?? 0 }}</strong></div>
      <div class="summary-card"><span class="summary-label">活跃计划</span><strong>{{ data?.summary?.active_plans ?? 0 }}</strong></div>
      <div class="summary-card"><span class="summary-label">待关注事项</span><strong>{{ data?.summary?.attention_items ?? 0 }}</strong></div>
    </template>

    <ExplainabilityStrip
      :result-value="`${data?.summary?.active_positions ?? 0} positions`"
      explanation="交易页聚焦执行和持仓生命周期，不开放研究配置与系统治理动作。"
      source-type="live"
      :data-quality="error ? 'low' : 'high'"
      :last-updated="data?.last_updated || '—'"
      suggested-action="优先查看订单簿、执行策略和持仓监控。"
    />

    <section class="section-block">
      <div class="section-header">
        <h3>Quick Actions</h3>
        <p>首页保留交易主链里最高频的几个入口。</p>
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
        <h3>Plan Snapshot</h3>
        <p>快速识别执行链路中正在推进或卡住的对象。</p>
      </div>
      <div v-if="(data?.plan_snapshot ?? []).length" class="list-grid">
        <article v-for="plan in data?.plan_snapshot ?? []" :key="plan.plan_id" class="list-card">
          <div class="card-title">{{ plan.symbol }} · {{ plan.status }}</div>
          <div class="card-meta">方向：{{ plan.direction || '—' }}</div>
          <div class="card-meta">置信度：{{ plan.confidence ?? '—' }}</div>
        </article>
      </div>
      <div v-else class="empty-state">暂无计划快照</div>
    </section>
  </WorkbenchShell>
</template>

<script setup lang="ts">
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import ExplainabilityStrip from '@/components/workbench/ExplainabilityStrip.vue'
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import WorkbenchShell from '@/components/workbench/WorkbenchShell.vue'
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import { fetchTradingHome } from '@/api/roleWorkbenchService'
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
    data.value = await fetchTradingHome()
  } catch (err: any) {
    error.value = err?.response?.data?.detail || err?.message || '交易员首页加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.section-block { display:flex; flex-direction:column; gap:14px; padding:18px; border-radius:14px; border:1px solid rgba(56,189,248,0.12); background:rgba(15,23,42,0.72); }
.summary-card { padding:14px 16px; border-radius:12px; background:rgba(30,41,59,0.72); border:1px solid rgba(56,189,248,0.12); }
.summary-label,.card-meta,.section-header p,.empty-state { color:#94a3b8; }
.summary-card strong { display:block; margin-top:8px; font-size:1.6rem; color:#f8fafc; }
.action-grid,.list-grid { display:grid; gap:12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.list-card { padding:16px; border-radius:12px; background:rgba(30,41,59,0.72); border:1px solid rgba(148,163,184,0.16); }
.card-title { font-weight:700; color:#f8fafc; margin-bottom:8px; }
</style>
