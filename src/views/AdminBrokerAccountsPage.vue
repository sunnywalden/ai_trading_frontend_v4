<template>
  <WorkbenchShell
    icon="🏦"
    title="经纪账户管理"
    subtitle="统一登记 Tiger 账户、查看凭证配置状态，并控制哪些账户参与多账户调度。"
    :loading="loading"
    :error="error"
    :last-updated="lastUpdated"
    :data-quality="error ? 'low' : 'high'"
  >
    <template #summary-cards>
      <div class="summary-card">
        <span class="summary-label">总账户数</span>
        <strong>{{ accounts.length }}</strong>
      </div>
      <div class="summary-card">
        <span class="summary-label">活跃账户</span>
        <strong>{{ activeAccountCount }}</strong>
      </div>
      <div class="summary-card">
        <span class="summary-label">已配凭证</span>
        <strong>{{ credentialConfiguredCount }}</strong>
      </div>
    </template>

    <section class="section-block">
      <div class="section-header">
        <h3>注册新账户</h3>
        <p>新增账户后可继续录入 Tiger 凭证，并在用户页分配账户授权。</p>
      </div>
      <div class="form-grid">
        <input v-model="createForm.account_id" class="field" placeholder="Tiger Account ID" />
        <input v-model="createForm.display_name" class="field" placeholder="显示名称" />
        <select v-model="createForm.account_type" class="field">
          <option value="LIVE">LIVE</option>
          <option value="PAPER">PAPER</option>
        </select>
        <select v-model="createForm.market" class="field">
          <option value="US">US</option>
          <option value="HK">HK</option>
          <option value="CN">CN</option>
        </select>
        <input v-model="createForm.tiger_id" class="field" placeholder="Tiger Developer ID（可选）" />
      </div>
      <PermissionButton
        :permissions="['admin.broker_account.manage']"
        @click="createAccount"
      >
        创建账户
      </PermissionButton>
    </section>

    <section class="section-block">
      <div class="section-header">
        <h3>账户列表</h3>
        <p>支持切换活跃状态，并选择某个账户更新加密后的私钥凭证。</p>
      </div>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>账户</th>
              <th>市场</th>
              <th>类型</th>
              <th>凭证</th>
              <th>指纹</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="account in accounts" :key="account.id">
              <td>
                <div class="cell-title">{{ account.display_name || account.account_id }}</div>
                <div class="cell-subtitle">{{ account.account_id }}</div>
              </td>
              <td>{{ account.market }}</td>
              <td>{{ account.account_type }}</td>
              <td>{{ account.credential_configured ? '已配置' : '未配置' }}</td>
              <td>{{ account.key_fingerprint || '—' }}</td>
              <td>{{ account.is_active ? 'ACTIVE' : 'DISABLED' }}</td>
              <td class="actions-cell">
                <PermissionButton
                  :permissions="['admin.broker_account.manage']"
                  @click="selectCredentialAccount(account)"
                >
                  配置凭证
                </PermissionButton>
                <PermissionButton
                  :permissions="['admin.broker_account.manage']"
                  @click="toggleAccountStatus(account)"
                >
                  {{ account.is_active ? '停用' : '启用' }}
                </PermissionButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="selectedAccount" class="section-block">
      <div class="section-header">
        <h3>凭证配置</h3>
        <p>
          正在为
          <strong>{{ selectedAccount.display_name || selectedAccount.account_id }}</strong>
          更新 Tiger 凭证。
        </p>
      </div>
      <div class="form-grid form-grid--stacked">
        <input v-model="credentialForm.tiger_id" class="field" placeholder="Tiger Developer ID" />
        <textarea
          v-model="credentialForm.private_key_pem"
          class="field field--textarea"
          placeholder="粘贴 Tiger 私钥 PEM 内容"
        />
      </div>
      <div class="action-row">
        <PermissionButton
          :permissions="['admin.broker_account.manage']"
          @click="saveCredentials"
        >
          保存凭证
        </PermissionButton>
        <button class="reset-btn" @click="clearCredentialForm">取消</button>
      </div>
    </section>
  </WorkbenchShell>
</template>

<script setup lang="ts">
import {
    createBrokerAccount,
    listBrokerAccounts,
    updateBrokerAccount,
    uploadBrokerAccountCredentials,
    type BrokerAccountItem,
} from '@/api/adminBrokerAccountService'
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import PermissionButton from '@/components/auth/PermissionButton.vue'
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import WorkbenchShell from '@/components/workbench/WorkbenchShell.vue'
import { computed, onMounted, reactive, ref } from 'vue'

const accounts = ref<BrokerAccountItem[]>([])
const loading = ref(false)
const error = ref('')
const lastUpdated = ref('—')
const selectedAccount = ref<BrokerAccountItem | null>(null)

const createForm = reactive({
  account_id: '',
  display_name: '',
  account_type: 'LIVE',
  market: 'US',
  tiger_id: '',
})

const credentialForm = reactive({
  tiger_id: '',
  private_key_pem: '',
})

const activeAccountCount = computed(
  () => accounts.value.filter((item) => item.is_active).length,
)
const credentialConfiguredCount = computed(
  () => accounts.value.filter((item) => item.credential_configured).length,
)

async function loadData() {
  loading.value = true
  error.value = ''
  try {
    accounts.value = await listBrokerAccounts()
    lastUpdated.value = new Date().toLocaleString('zh-CN', { hour12: false })
  } catch (err: any) {
    error.value = err?.response?.data?.detail || err?.message || '经纪账户加载失败'
  } finally {
    loading.value = false
  }
}

function resetCreateForm() {
  createForm.account_id = ''
  createForm.display_name = ''
  createForm.account_type = 'LIVE'
  createForm.market = 'US'
  createForm.tiger_id = ''
}

function clearCredentialForm() {
  selectedAccount.value = null
  credentialForm.tiger_id = ''
  credentialForm.private_key_pem = ''
}

function selectCredentialAccount(account: BrokerAccountItem) {
  selectedAccount.value = account
  credentialForm.tiger_id = account.tiger_id || ''
  credentialForm.private_key_pem = ''
}

async function createAccount() {
  await createBrokerAccount({
    account_id: createForm.account_id,
    display_name: createForm.display_name || undefined,
    account_type: createForm.account_type,
    market: createForm.market,
    tiger_id: createForm.tiger_id || undefined,
  })
  resetCreateForm()
  await loadData()
}

async function toggleAccountStatus(account: BrokerAccountItem) {
  await updateBrokerAccount(account.id, { is_active: !account.is_active })
  await loadData()
  if (selectedAccount.value?.id === account.id) {
    selectedAccount.value = accounts.value.find((item) => item.id === account.id) || null
  }
}

async function saveCredentials() {
  if (!selectedAccount.value) return
  await uploadBrokerAccountCredentials(selectedAccount.value.id, {
    tiger_id: credentialForm.tiger_id,
    private_key_pem: credentialForm.private_key_pem,
  })
  await loadData()
  clearCredentialForm()
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

.section-header h3 {
  margin: 0;
  color: #f8fafc;
}

.section-header p,
.summary-label,
.cell-subtitle {
  color: #94a3b8;
}

.summary-card {
  padding: 16px;
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.72);
  border: 1px solid rgba(148, 163, 184, 0.16);
}

.summary-card strong {
  display: block;
  margin-top: 8px;
  font-size: 1.45rem;
  color: #f8fafc;
}

.form-grid {
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.form-grid--stacked {
  grid-template-columns: 1fr;
}

.field {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(15, 23, 42, 0.9);
  color: #e2e8f0;
}

.field--textarea {
  min-height: 180px;
  resize: vertical;
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

.cell-title {
  font-weight: 700;
  color: #f8fafc;
}

.actions-cell,
.action-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.reset-btn {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.18);
  background: rgba(30, 41, 59, 0.82);
  color: #e2e8f0;
  cursor: pointer;
}
</style>
