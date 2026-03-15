<template>
  <WorkbenchShell
    icon="🔐"
    title="修改密码"
    subtitle="首次登录或密码被重置后，请先完成安全收口，再回到各自角色工作台。"
    :loading="loading"
    :error="error"
    :last-updated="lastUpdated"
    :data-quality="error ? 'low' : 'high'"
  >
    <section class="section-block">
      <div class="section-header">
        <h3>安全提示</h3>
        <p>建议使用至少 8 位、包含大小写字母、数字或符号的新密码。</p>
      </div>
      <div class="notice-card" :class="{ 'notice-card--ok': success }">
        {{ success || '修改后将立即解除“需改密”状态。' }}
      </div>
    </section>

    <section class="section-block">
      <div class="form-grid">
        <input v-model="form.currentPassword" class="field" type="password" placeholder="当前密码" autocomplete="current-password" />
        <input v-model="form.newPassword" class="field" type="password" placeholder="新密码" autocomplete="new-password" />
        <input v-model="form.confirmPassword" class="field" type="password" placeholder="确认新密码" autocomplete="new-password" />
      </div>
      <div class="action-row">
        <button class="primary-btn" :disabled="loading" @click="submit">确认修改</button>
        <button class="secondary-btn" :disabled="loading" @click="router.push(auth.homePath)">返回工作台</button>
      </div>
    </section>
  </WorkbenchShell>
</template>

<script setup lang="ts">
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import { changeCurrentPassword } from '@/api/authService'
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import WorkbenchShell from '@/components/workbench/WorkbenchShell.vue'
import { useAuthStore } from '@/stores/auth'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const auth = useAuthStore()
const loading = ref(false)
const error = ref('')
const success = ref('')
const lastUpdated = ref('—')
const form = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

async function submit() {
  error.value = ''
  success.value = ''

  if (!form.currentPassword || !form.newPassword || !form.confirmPassword) {
    error.value = '请完整填写当前密码、新密码和确认密码。'
    return
  }
  if (form.newPassword !== form.confirmPassword) {
    error.value = '两次输入的新密码不一致。'
    return
  }

  loading.value = true
  try {
    const profile = await changeCurrentPassword({
      currentPassword: form.currentPassword,
      newPassword: form.newPassword,
    })
    auth.applyProfile(profile)
    success.value = '密码修改成功，安全状态已更新。'
    lastUpdated.value = new Date().toLocaleString('zh-CN', { hour12: false })
    form.currentPassword = ''
    form.newPassword = ''
    form.confirmPassword = ''
    globalThis.setTimeout(() => {
      router.push(auth.homePath)
    }, 600)
  } catch (err: any) {
    error.value = err?.response?.data?.detail || err?.message || '密码修改失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.section-block { display:flex; flex-direction:column; gap:14px; padding:18px; border-radius:14px; border:1px solid rgba(56,189,248,0.12); background:rgba(15,23,42,0.72); }
.section-header p { color:#94a3b8; }
.notice-card { padding:14px 16px; border-radius:12px; border:1px solid rgba(56,189,248,0.16); background:rgba(15,23,42,0.88); color:#bfdbfe; }
.notice-card--ok { border-color:rgba(16,185,129,0.35); background:rgba(6,78,59,0.32); color:#d1fae5; }
.form-grid { display:grid; gap:12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
.field { padding:10px 12px; border-radius:10px; border:1px solid rgba(148,163,184,0.18); background:rgba(15,23,42,0.9); color:#e2e8f0; }
.action-row { display:flex; gap:10px; flex-wrap:wrap; }
.primary-btn,.secondary-btn { padding:10px 14px; border-radius:10px; border:1px solid rgba(56,189,248,0.2); cursor:pointer; }
.primary-btn { background:linear-gradient(90deg,#0f766e,#2563eb); color:#f8fafc; }
.secondary-btn { background:rgba(15,23,42,0.72); color:#e2e8f0; }
</style>
