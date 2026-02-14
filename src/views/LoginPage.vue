<template>
  <div class="login-page">
    <div class="login-card">
      <div class="brand">
        <svg class="logo" viewBox="0 0 120 120" aria-hidden="true">
          <defs>
            <linearGradient id="lg" x1="0" x2="1">
              <stop offset="0" stop-color="var(--accent1)" />
              <stop offset="1" stop-color="var(--accent2)" />
            </linearGradient>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <g transform="translate(60,60)">
            <circle class="ring ring-1" r="30" fill="none" stroke="url(#lg)" stroke-width="3" stroke-linecap="round"/>
            <circle class="ring ring-2" r="44" fill="none" stroke="rgba(56,189,248,0.08)" stroke-width="2"/>
            <circle class="core" r="20" fill="url(#lg)" filter="url(#glow)"/>
            <path class="spark" d="M-18 8 C -10 2, 10 -12, 22 -6" stroke="rgba(255,255,255,0.15)" stroke-width="2" fill="none" stroke-linecap="round"/>
          </g>
        </svg>
        <h1>AI Trading</h1>
        <p class="subtitle">{{ t('login.subtitle') }}</p>
      </div>

      <form @submit.prevent="onSubmit" class="login-form" novalidate>
        <div class="field">
          <label class="label">{{ t('login.username') }}</label>
          <input v-model="username" type="text" class="input" :placeholder="t('login.username_placeholder')" autocomplete="username" required />
        </div>

        <div class="field">
          <label class="label">{{ t('login.password') }}</label>
          <div class="password-wrapper">
            <input :type="showPassword ? 'text' : 'password'" v-model="password" class="input" :placeholder="t('login.password_placeholder')" autocomplete="current-password" required />
            <button type="button" class="toggle" @click="showPassword = !showPassword" :aria-pressed="showPassword" :title="showPassword ? t('login.hide_password') : t('login.show_password')">{{ showPassword ? '🙈' : '👁️' }}</button>
          </div>
        </div>

        <div class="extras">
          <label class="remember"><input type="checkbox" v-model="remember" /> {{ t('login.remember_me') }}</label>
          <a class="help" href="#" @click.prevent="onHelp">{{ t('login.forgot_password') }}</a>
        </div>

        <button class="btn" :class="{loading: loading}" :disabled="loading">
          <span v-if="loading" class="spinner" aria-hidden="true"></span>
          <span class="btn-text">{{ t('login.login_btn') }}</span>
        </button>

        <p class="hint" v-html="t('login.dev_hint', {auth: '<strong>admin / admin</strong>'})"></p>

        <p v-if="error" class="error">{{ error }}</p>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { loginUser } from '../api/client';

const { t } = useI18n();
const username = ref('admin');
const password = ref('');
const error = ref('');
const loading = ref(false);
const showPassword = ref(false);
const remember = ref(true);
const router = useRouter();

async function onSubmit() {
  loading.value = true;
  error.value = '';
  try {
    const data = await loginUser(username.value, password.value, remember.value);
    if (data && data.access_token) {
      // 登录成功，跳转到首页
      router.push({ path: '/' });
    } else {
      error.value = t('login.login_failed');
    }
  } catch (e: any) {
    const detail = e?.response?.data?.detail || e?.message;
    error.value = detail ? t('login.run_result', { detail }) : t('login.login_error');
  } finally {
    loading.value = false;
  }
}

function onHelp() {
  alert(t('login.help_msg'));
}
</script>

<style scoped>
.login-page {
  min-height: calc(100vh - 40px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background: linear-gradient(180deg, rgba(2,6,23,1) 0%, rgba(6,10,24,1) 100%);
}

.login-card {
  width: 420px;
  padding: 28px;
  border-radius: 14px;
  background: var(--card-bg);
  box-shadow: 0 8px 30px rgba(2,6,23,0.35);
  border: 1px solid rgba(255,255,255,0.03);
}

.brand h1 {
  margin: 0 0 6px 0;
  font-size: 1.4rem;
  color: var(--text-color);
}
.brand .subtitle {
  margin: 0 0 18px 0;
  font-size: 0.85rem;
  color: var(--muted-color);
}

.logo {
  width: 76px;
  height: 76px;
  margin-bottom: 8px;
  display: block;
}
.ring { transform-origin: center; }
.ring-1 { stroke-dasharray: 190; stroke-dashoffset: 0; animation: dash 3.6s ease-in-out infinite; }
@keyframes dash { 0% { stroke-dashoffset: 190; transform: rotate(0deg);} 50% { stroke-dashoffset: 0; transform: rotate(140deg);} 100% { stroke-dashoffset: 190; transform: rotate(360deg);} }
.core { transform-origin: center; animation: pulse 2.8s ease-in-out infinite; }
@keyframes pulse { 0% { transform: scale(0.98);} 50% { transform: scale(1.06);} 100% { transform: scale(0.98);} }
.spark { opacity: 0.9; animation: flutter 4s linear infinite; }
@keyframes flutter { 0% { transform: translateY(0);} 50% { transform: translateY(-4px);} 100% { transform: translateY(0);} }
.login-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field .label {
  display: block;
  font-size: 0.85rem;
  color: #cbd5e1;
  margin-bottom: 6px;
}

.input {
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255,255,255,0.06);
  background: rgba(8,12,20,0.4);
  color: #e5e7eb;
  outline: none;
  transition: box-shadow 0.15s ease, border-color 0.12s ease;
}
.input:focus {
  border-color: rgba(56,189,248,0.6);
  box-shadow: 0 0 0 4px rgba(56,189,248,0.06);
}

.password-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toggle {
  border: none;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  font-size: 1rem;
}

.extras {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.remember {
  color: #9ca3af;
  font-size: 0.9rem;
}
.help {
  color: #60a5fa;
  font-size: 0.9rem;
  text-decoration: none;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 14px;
  border-radius: 10px;
  background: linear-gradient(90deg,#0284c7,#2563eb);
  color: #fff;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.12s ease, transform 0.06s ease;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn .spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(255,255,255,0.25);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.hint {
  font-size: 0.8rem;
  color: #9ca3af;
  margin: 6px 0 0 0;
}

.error {
  color: #ff8b8b;
  margin-top: 6px;
}
</style>