<template>
  <WorkbenchShell
    icon="👥"
    title="用户管理"
    subtitle="角色、启停与账户授权统一收口，避免权限和数据范围各说各话。"
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
      <div class="section-header">
        <h3>用户列表</h3>
        <p>选择某个用户后，可在下方继续配置账户访问范围。</p>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>用户名</th>
              <th>角色</th>
              <th>状态</th>
              <th>种子账号</th>
              <th>需改密</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>
                <div class="cell-title">{{ user.display_name || user.username }}</div>
                <div class="cell-subtitle">{{ user.username }}</div>
              </td>
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
                <PermissionButton :permissions="['admin.user.manage']" @click="selectUser(user)">账户授权</PermissionButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="selectedUser" class="section-block">
      <div class="section-header">
        <h3>账户授权</h3>
        <p>
          当前用户：
          <strong>{{ selectedUser.display_name || selectedUser.username }}</strong>
        </p>
      </div>
      <div class="grant-form">
        <select v-model.number="grantForm.broker_account_id" class="field">
          <option :value="0">选择账户</option>
          <option v-for="account in accounts" :key="account.id" :value="account.id">
            {{ account.display_name || account.account_id }} · {{ account.account_type }}
          </option>
        </select>
        <select v-model="grantForm.grant_level" class="field">
          <option value="VIEW">VIEW</option>
          <option value="ANALYZE">ANALYZE</option>
          <option value="OPERATE">OPERATE</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <PermissionButton :permissions="['admin.user.manage']" @click="saveGrant">新增授权</PermissionButton>
      </div>

      <div class="grant-list">
        <article v-for="grant in grants" :key="grant.id" class="grant-card">
          <div class="grant-card__main">
            <div class="cell-title">{{ grant.display_name || grant.account_id }}</div>
            <div class="cell-subtitle">{{ grant.account_id }}</div>
          </div>
          <select v-model="grantLevels[grant.id]" class="mini-field mini-field--inline">
            <option value="VIEW">VIEW</option>
            <option value="ANALYZE">ANALYZE</option>
            <option value="OPERATE">OPERATE</option>
            <option value="ADMIN">ADMIN</option>
          </select>
          <div class="actions-cell">
            <PermissionButton :permissions="['admin.user.manage']" @click="updateGrant(grant.id)">更新</PermissionButton>
            <PermissionButton :permissions="['admin.user.manage']" @click="removeGrant(grant.id)">删除</PermissionButton>
          </div>
        </article>
        <div v-if="!grants.length" class="empty-state">当前用户还没有账户授权</div>
      </div>
    </section>
  </WorkbenchShell>
</template>

<script setup lang="ts">
import {
    createUserAccountGrant,
    deleteUserAccountGrant,
    listBrokerAccounts,
    listUserAccountGrants,
    updateUserAccountGrant,
    type BrokerAccountItem,
    type UserAccountGrantItem,
} from '@/api/adminBrokerAccountService'
import {
    assignAdminUserRole,
    createAdminUser,
    fetchAdminRoles,
    fetchAdminUsers,
    updateAdminUser,
    type AdminRoleItem,
    type AdminUserItem,
} from '@/api/adminRbacService'
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import PermissionButton from '@/components/auth/PermissionButton.vue'
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import WorkbenchShell from '@/components/workbench/WorkbenchShell.vue'
import { onMounted, reactive, ref } from 'vue'

const users = ref<AdminUserItem[]>([])
const roles = ref<AdminRoleItem[]>([])
const accounts = ref<BrokerAccountItem[]>([])
const grants = ref<UserAccountGrantItem[]>([])
const selectedUser = ref<AdminUserItem | null>(null)
const loading = ref(false)
const error = ref('')
const lastUpdated = ref('—')
const roleAssignments = reactive<Record<number, string>>({})
const grantLevels = reactive<Record<number, string>>({})

const form = reactive({
  username: '',
  display_name: '',
  password: '',
  role_code: 'RESEARCHER',
})

const grantForm = reactive({
  broker_account_id: 0,
  grant_level: 'VIEW',
})

async function loadUserGrants(userId: number) {
  grants.value = await listUserAccountGrants(userId)
  grants.value.forEach((item) => {
    grantLevels[item.id] = item.grant_level
  })
}

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    const [userItems, roleItems, accountItems] = await Promise.all([
      fetchAdminUsers(),
      fetchAdminRoles(),
      listBrokerAccounts(),
    ])
    users.value = userItems
    roles.value = roleItems
    accounts.value = accountItems.filter((item) => item.is_active)
    userItems.forEach((item) => {
      roleAssignments[item.id] = item.default_role
    })
    if (!form.role_code && roleItems[0]) {
      form.role_code = roleItems[0].code
    }
    if (selectedUser.value) {
      selectedUser.value = userItems.find((item) => item.id === selectedUser.value?.id) || null
      if (selectedUser.value) {
        await loadUserGrants(selectedUser.value.id)
      }
    }
    lastUpdated.value = new Date().toLocaleString('zh-CN', { hour12: false })
  } catch (err: any) {
    error.value = err?.response?.data?.detail || err?.message || '用户列表加载失败'
  } finally {
    loading.value = false
  }
}

function resetCreateForm() {
  form.username = ''
  form.display_name = ''
  form.password = ''
}

function resetGrantForm() {
  grantForm.broker_account_id = 0
  grantForm.grant_level = 'VIEW'
}

async function createUser() {
  await createAdminUser(form)
  resetCreateForm()
  await loadData()
}

async function toggleStatus(user: AdminUserItem) {
  await updateAdminUser(user.id, {
    status: user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE',
  })
  await loadData()
}

async function applyRole(userId: number) {
  await assignAdminUserRole(userId, roleAssignments[userId])
  await loadData()
}

async function selectUser(user: AdminUserItem) {
  selectedUser.value = user
  resetGrantForm()
  await loadUserGrants(user.id)
}

async function saveGrant() {
  if (!selectedUser.value || !grantForm.broker_account_id) return
  await createUserAccountGrant(selectedUser.value.id, {
    broker_account_id: grantForm.broker_account_id,
    grant_level: grantForm.grant_level,
  })
  resetGrantForm()
  await loadUserGrants(selectedUser.value.id)
}

async function updateGrant(grantId: number) {
  if (!selectedUser.value) return
  await updateUserAccountGrant(selectedUser.value.id, grantId, {
    grant_level: grantLevels[grantId] || 'VIEW',
  })
  await loadUserGrants(selectedUser.value.id)
}

async function removeGrant(grantId: number) {
  if (!selectedUser.value) return
  await deleteUserAccountGrant(selectedUser.value.id, grantId)
  await loadUserGrants(selectedUser.value.id)
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

.section-header {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-header h3,
.cell-title {
  margin: 0;
  color: #f8fafc;
}

.section-header p,
.cell-subtitle,
.empty-state {
  color: #94a3b8;
}

.form-grid,
.grant-form {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.field,
.mini-field {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.9);
  color: #e2e8f0;
}

.mini-field--inline {
  min-width: 140px;
}

.table-wrap {
  overflow: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 12px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.12);
  color: #e2e8f0;
  text-align: left;
  vertical-align: top;
}

.actions-cell {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.grant-list {
  display: grid;
  gap: 12px;
}

.grant-card {
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) 180px auto;
  align-items: center;
  padding: 14px;
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

@media (max-width: 900px) {
  .grant-card {
    grid-template-columns: 1fr;
  }
}
</style>
