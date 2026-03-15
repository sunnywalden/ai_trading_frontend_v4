<template>
  <WorkbenchShell
    icon="🧩"
    title="角色管理"
    subtitle="系统内置角色可见但谨慎修改；自定义角色可从这里补充。"
    :loading="loading"
    :error="error"
    :last-updated="lastUpdated"
    :data-quality="error ? 'low' : 'high'"
  >
    <section class="section-block">
      <div class="section-header"><h3>{{ editingRoleId ? '编辑角色' : '新建角色' }}</h3></div>
      <div class="form-grid">
        <input v-model="form.code" class="field" placeholder="ROLE_CODE" />
        <input v-model="form.name" class="field" placeholder="Role Name" />
        <input v-model="form.description" class="field" placeholder="Description" />
      </div>
      <div class="action-row">
        <PermissionButton :permissions="['admin.role.manage']" @click="saveRole">保存角色</PermissionButton>
        <button v-if="editingRoleId" class="reset-btn" @click="resetForm">取消编辑</button>
      </div>
    </section>

    <section class="section-block">
      <div class="section-header"><h3>角色列表</h3></div>
      <div class="role-grid">
        <article v-for="role in roles" :key="role.id" class="role-card">
          <div class="role-head">
            <div>
              <h4>{{ role.name }}</h4>
              <div class="role-code">{{ role.code }}</div>
            </div>
            <button class="edit-btn" @click="editRole(role)">编辑</button>
          </div>
          <p class="role-desc">{{ role.description || '—' }}</p>
          <div class="role-tags">
            <span v-for="permission in role.permissions" :key="permission" class="tag">{{ permission }}</span>
          </div>
        </article>
      </div>
    </section>
  </WorkbenchShell>
</template>

<script setup lang="ts">
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import PermissionButton from '@/components/auth/PermissionButton.vue'
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import { createAdminRole, fetchAdminRoles, updateAdminRole, type AdminRoleItem } from '@/api/adminRbacService'
import WorkbenchShell from '@/components/workbench/WorkbenchShell.vue'
import { onMounted, reactive, ref } from 'vue'

const roles = ref<AdminRoleItem[]>([])
const loading = ref(false)
const error = ref('')
const lastUpdated = ref('—')
const editingRoleId = ref<number | null>(null)
const form = reactive({ code: '', name: '', description: '' })

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    roles.value = await fetchAdminRoles()
    lastUpdated.value = new Date().toLocaleString('zh-CN', { hour12: false })
  } catch (err: any) {
    error.value = err?.response?.data?.detail || err?.message || '角色列表加载失败'
  } finally {
    loading.value = false
  }
}

function editRole(role: AdminRoleItem) {
  editingRoleId.value = role.id
  form.code = role.code
  form.name = role.name
  form.description = role.description || ''
}

function resetForm() {
  editingRoleId.value = null
  form.code = ''
  form.name = ''
  form.description = ''
}

async function saveRole() {
  if (editingRoleId.value) {
    await updateAdminRole(editingRoleId.value, form)
  } else {
    await createAdminRole(form)
  }
  resetForm()
  await loadData()
}

onMounted(loadData)
</script>

<style scoped>
.section-block { display:flex; flex-direction:column; gap:14px; padding:18px; border-radius:14px; border:1px solid rgba(56,189,248,0.12); background:rgba(15,23,42,0.72); }
.form-grid,.role-grid { display:grid; gap:12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.field { padding:10px 12px; border-radius:10px; border:1px solid rgba(148,163,184,0.18); background:rgba(15,23,42,0.9); color:#e2e8f0; }
.action-row { display:flex; gap:10px; flex-wrap:wrap; }
.reset-btn,.edit-btn { padding:10px 14px; border-radius:10px; border:1px solid rgba(148,163,184,0.18); background:rgba(30,41,59,0.82); color:#e2e8f0; cursor:pointer; }
.role-card { padding:16px; border-radius:12px; background:rgba(30,41,59,0.72); border:1px solid rgba(148,163,184,0.16); }
.role-head { display:flex; justify-content:space-between; gap:10px; }
.role-head h4 { margin:0; color:#f8fafc; }
.role-code,.role-desc { color:#94a3b8; }
.role-tags { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
.tag { padding:4px 8px; border-radius:999px; background:#155e75; color:#f8fafc; font-size:0.75rem; }
</style>
