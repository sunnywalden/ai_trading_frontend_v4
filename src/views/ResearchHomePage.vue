<template>
  <WorkbenchShell
    icon="🧪"
    title="Research Workbench"
    subtitle="面向研究员的信号、策略与回测入口，避免把执行噪声塞满脑袋。"
    :loading="loading"
    :error="error"
    :last-updated="data?.last_updated || '—'"
    :data-quality="error ? 'low' : 'high'"
  >
    <template #summary-cards>
      <div class="summary-card">
        <span class="summary-label">策略总数</span>
        <strong>{{ data?.summary?.total_strategies ?? 0 }}</strong>
      </div>
      <div class="summary-card">
        <span class="summary-label">活跃策略</span>
        <strong>{{ data?.summary?.active_strategies ?? 0 }}</strong>
      </div>
      <div class="summary-card">
        <span class="summary-label">最近运行</span>
        <strong>{{ data?.summary?.recent_runs ?? 0 }}</strong>
      </div>
    </template>

    <ExplainabilityStrip
      :result-value="`${data?.summary?.active_strategies ?? 0} active`"
      explanation="研究页只保留策略、候选信号、回测与研究导出，不暴露真实交易动作。"
      source-type="live"
      :data-quality="error ? 'low' : 'high'"
      :last-updated="data?.last_updated || '—'"
      suggested-action="优先查看 Alpha Lab、机会扫描和策略库。"
    />

    <section class="section-block">
      <div class="section-header">
        <h3>Quick Actions</h3>
        <p>把研究链路里最常用的动作固定在首页。</p>
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
        <h3>Recent Runs</h3>
        <p>帮助研究员快速判断最近扫描和回测的状态。</p>
      </div>
      <div v-if="(data?.recent_runs ?? []).length" class="list-grid">
        <article v-for="run in data?.recent_runs ?? []" :key="run.run_id" class="list-card">
          <div class="card-title">{{ run.strategy_id }}</div>
          <div class="card-meta">状态：{{ run.status }} · 方向：{{ run.direction || '—' }}</div>
          <div class="card-meta">运行 ID：{{ run.run_id }}</div>
        </article>
      </div>
      <div v-else class="empty-state">暂无最近运行记录</div>
    </section>
  </WorkbenchShell>
</template>

<script setup lang="ts">
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import ExplainabilityStrip from '@/components/workbench/ExplainabilityStrip.vue'
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import WorkbenchShell from '@/components/workbench/WorkbenchShell.vue'
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import { fetchResearchHome } from '@/api/roleWorkbenchService'
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
    data.value = await fetchResearchHome()
  } catch (err: any) {
    error.value = err?.response?.data?.detail || err?.message || '研究员首页加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.section-block {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;
  border-radius: 14px;
  border: 1px solid rgba(56, 189, 248, 0.12);
  background: rgba(15, 23, 42, 0.72);
}
.summary-card {
  padding: 14px 16px;
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.72);
  border: 1px solid rgba(56, 189, 248, 0.12);
}
.summary-label,.card-meta,.section-header p,.empty-state { color: #94a3b8; }
.summary-card strong { display:block; margin-top:8px; font-size: 1.6rem; color:#f8fafc; }
.action-grid,.list-grid { display:grid; gap:12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.list-card { padding: 16px; border-radius: 12px; background: rgba(30, 41, 59, 0.72); border: 1px solid rgba(148, 163, 184, 0.16); }
.card-title { font-weight: 700; color: #f8fafc; margin-bottom: 8px; }
.empty-state { padding: 10px 0; }
</style>
