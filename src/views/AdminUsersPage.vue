<template>
  <WorkbenchShell
    icon="👥"
    title="用户管理"
    subtitle="创建、启停和角色切换都从这里走，顺手留下可追溯痕迹。"
    :loading="loading"
    :error="error"
    :last-updated="lastUpdated"
    :data-quality="error ? 'low' : 'high'"
  >
    <section class="section-block">
      <div class="section-header"><h3>新建用户</h3></div>
      <div class="form-grid">
        <input v-model="form.username" class="field" placeholder="username" />
        <input v-model="form.display_name" class="field" placeholder="display name" />
        <input v-model="form.password" class="field" placeholder="password" type="password" />
        <select v-model="form.role_code" class="field">
          <option v-for="role in roles" :key="role.code" :value="role.code">{{ role.name }}</option>
        </select>
      </div>
      <PermissionButton :permissions="['admin.user.manage']" @click="createUser">创建用户</PermissionButton>
    </section>

    <section class="section-block">
      <div class="section-header"><h3>用户列表</h3></div>
      <div class="table-wrap">
        <table class="table">
          <thead><tr><th>用户名</th><th>角色</th><th>状态</th><th>种子账号</th><th>需改密</th><th>操作</th></tr></thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>{{ user.username }}</td>
              <td>
                <select v-model="roleAssignments[user.id]" class="mini-field">
                  <option v-for="role in roles" :key="role.code" :value="role.code">{{ role.name }}</option>
                </select>
              </td>
              <td>{{ user.status }}</td>
              <td>{{ user.is_system_seed ? '是' : '否' }}</td>
              <td>{{ user.must_change_password ? '是' : '否' }}</td>
              <td class="actions-cell">
                <PermissionButton :permissions="['admin.role.manage']" @click="applyRole(user.id)">更新角色</PermissionButton>
                <PermissionButton :permissions="['admin.user.manage']" @click="toggleStatus(user)">{{ user.status === 'ACTIVE' ? '停用' : '启用' }}</PermissionButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </WorkbenchShell>
</template>

<script setup lang="ts">
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import { assignAdminUserRole, createAdminUser, fetchAdminRoles, fetchAdminUsers, updateAdminUser, type AdminRoleItem, type AdminUserItem } from '@/api/adminRbacService'
import PermissionButton from '@/components/auth/PermissionButton.vue'
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import WorkbenchShell from '@/components/workbench/WorkbenchShell.vue'
import { onMounted, reactive, ref } from 'vue'

const users = ref<AdminUserItem[]>([])
const roles = ref<AdminRoleItem[]>([])
const loading = ref(false)
const error = ref('')
const lastUpdated = ref('—')
const roleAssignments = reactive<Record<number, string>>({})
const form = reactive({ username: '', display_name: '', password: '', role_code: 'RESEARCHER' })

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [userItems, roleItems] = await Promise.all([fetchAdminUsers(), fetchAdminRoles()])
    users.value = userItems
    roles.value = roleItems
    userItems.forEach((item) => { roleAssignments[item.id] = item.default_role })
    if (!form.role_code && roleItems[0]) form.role_code = roleItems[0].code
    lastUpdated.value = new Date().toLocaleString('zh-CN', { hour12: false })
  } catch (err: any) {
    error.value = err?.response?.data?.detail || err?.message || '用户列表加载失败'
  } finally {
    loading.value = false
  }
}

async function createUser() {
  await createAdminUser(form)
  form.username = ''
  form.display_name = ''
  form.password = ''
  await loadData()
}

async function toggleStatus(user: AdminUserItem) {
  await updateAdminUser(user.id, { status: user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE' })
  await loadData()
}

async function applyRole(userId: number) {
  await assignAdminUserRole(userId, roleAssignments[userId])
  await loadData()
}

onMounted(loadData)
</script>

<style scoped>
.section-block { display:flex; flex-direction:column; gap:14px; padding:18px; border-radius:14px; border:1px solid rgba(56,189,248,0.12); background:rgba(15,23,42,0.72); }
.form-grid { display:grid; gap:12px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
.field,.mini-field { padding:10px 12px; border-radius:10px; border:1px solid rgba(148,163,184,0.18); background:rgba(15,23,42,0.9); color:#e2e8f0; }
.table-wrap { overflow:auto; }
.table { width:100%; border-collapse: collapse; }
.table th,.table td { padding:12px; border-bottom:1px solid rgba(148,163,184,0.12); color:#e2e8f0; text-align:left; }
.actions-cell { display:flex; gap:8px; flex-wrap:wrap; }
</style>
