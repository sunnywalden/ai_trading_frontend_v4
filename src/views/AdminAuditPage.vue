<template>
  <WorkbenchShell
    icon="🧾"
    title="授权审计"
    subtitle="所有高权限动作都应该有证据链；如果没有，那就说明系统还不够成熟。"
    :loading="loading"
    :error="error"
    :last-updated="lastUpdated"
    :data-quality="error ? 'low' : 'high'"
  >
    <section class="section-block">
      <div class="section-header"><h3>最近审计记录</h3></div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>时间</th><th>用户</th><th>事件</th><th>资源</th><th>结果</th><th>原因</th></tr></thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td>{{ item.created_at }}</td>
              <td>{{ item.username }}</td>
              <td>{{ item.event_type }}</td>
              <td>{{ item.resource }} / {{ item.action }}</td>
              <td>{{ item.decision }}</td>
              <td>{{ item.reason || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </WorkbenchShell>
</template>

<script setup lang="ts">
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import { fetchAdminAudit, type AdminAuditItem } from '@/api/adminRbacService'
import WorkbenchShell from '@/components/workbench/WorkbenchShell.vue'
import { onMounted, ref } from 'vue'

const items = ref<AdminAuditItem[]>([])
const loading = ref(false)
const error = ref('')
const lastUpdated = ref('—')

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    items.value = await fetchAdminAudit(200)
    lastUpdated.value = new Date().toLocaleString('zh-CN', { hour12: false })
  } catch (err: any) {
    error.value = err?.response?.data?.detail || err?.message || '审计记录加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.section-block { display:flex; flex-direction:column; gap:14px; padding:18px; border-radius:14px; border:1px solid rgba(56,189,248,0.12); background:rgba(15,23,42,0.72); }
.table-wrap { overflow:auto; }
.table { width:100%; border-collapse:collapse; }
.table th,.table td { padding:12px; border-bottom:1px solid rgba(148,163,184,0.12); color:#e2e8f0; text-align:left; white-space:nowrap; }
</style>
