<template>
  <WorkbenchShell
    icon="🪪"
    title="权限目录"
    subtitle="权限要能看清、讲清、追清；否则只是把复杂度藏进代码里。"
    :loading="loading"
    :error="error"
    :last-updated="lastUpdated"
    :data-quality="error ? 'low' : 'high'"
  >
    <section class="section-block">
      <div class="section-header">
        <h3>筛选条件</h3>
        <p>按资源、动作和访问模式快速定位权限项。</p>
      </div>
      <div class="filter-grid">
        <input v-model.trim="keyword" class="field" placeholder="搜索 code / description" />
        <select v-model="resource" class="field">
          <option value="">全部资源</option>
          <option v-for="item in resources" :key="item" :value="item">{{ item }}</option>
        </select>
        <select v-model="accessMode" class="field">
          <option value="">全部访问模式</option>
          <option value="summary">summary</option>
          <option value="readonly">readonly</option>
          <option value="standard">standard</option>
          <option value="write">write</option>
        </select>
      </div>
    </section>

    <section class="section-block">
      <div class="section-header">
        <h3>权限列表</h3>
        <p>当前共 {{ filteredPermissions.length }} 项可见权限。</p>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Code</th>
              <th>资源</th>
              <th>动作</th>
              <th>范围</th>
              <th>模式</th>
              <th>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredPermissions" :key="item.id">
              <td class="code-cell">{{ item.code }}</td>
              <td>{{ item.resource }}</td>
              <td>{{ item.action }}</td>
              <td>{{ item.scope }}</td>
              <td><span class="mode-tag">{{ item.access_mode }}</span></td>
              <td>{{ item.description || '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </WorkbenchShell>
</template>

<script setup lang="ts">
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import { fetchAdminPermissions, type AdminPermissionItem } from '@/api/adminRbacService'
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import WorkbenchShell from '@/components/workbench/WorkbenchShell.vue'
import { computed, onMounted, ref } from 'vue'

const permissions = ref<AdminPermissionItem[]>([])
const loading = ref(false)
const error = ref('')
const lastUpdated = ref('—')
const keyword = ref('')
const resource = ref('')
const accessMode = ref('')

const resources = computed(() => Array.from(new Set(permissions.value.map((item) => item.resource))).sort())

const filteredPermissions = computed(() => {
  const needle = keyword.value.toLowerCase()
  return permissions.value.filter((item) => {
    const matchKeyword = !needle || item.code.toLowerCase().includes(needle) || String(item.description || '').toLowerCase().includes(needle)
    const matchResource = !resource.value || item.resource === resource.value
    const matchAccessMode = !accessMode.value || item.access_mode === accessMode.value
    return matchKeyword && matchResource && matchAccessMode
  })
})

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    permissions.value = await fetchAdminPermissions()
    lastUpdated.value = new Date().toLocaleString('zh-CN', { hour12: false })
  } catch (err: any) {
    error.value = err?.response?.data?.detail || err?.message || '权限目录加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.section-block { display:flex; flex-direction:column; gap:14px; padding:18px; border-radius:14px; border:1px solid rgba(56,189,248,0.12); background:rgba(15,23,42,0.72); }
.section-header p { color:#94a3b8; }
.filter-grid { display:grid; gap:12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.field { padding:10px 12px; border-radius:10px; border:1px solid rgba(148,163,184,0.18); background:rgba(15,23,42,0.9); color:#e2e8f0; }
.table-wrap { overflow:auto; }
.table { width:100%; border-collapse: collapse; }
.table th,.table td { padding:12px; border-bottom:1px solid rgba(148,163,184,0.12); color:#e2e8f0; text-align:left; vertical-align:top; }
.code-cell { font-family: 'Cascadia Code', 'Consolas', monospace; font-size:0.85rem; color:#bae6fd; }
.mode-tag { display:inline-flex; padding:4px 8px; border-radius:999px; background:rgba(21,94,117,0.82); color:#ecfeff; }
</style>
