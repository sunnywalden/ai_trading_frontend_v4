<template>
  <div class="layout">
    <aside class="sidebar">
      <h1>AI Trading · 控制塔</h1>
      <p class="desc">
        后端：风险因子 + 行为评分 + 自动对冲引擎<br>
        前端：实时状态总览 + 标的行为画像 + Greeks 风险水位（Vue3）
      </p>
      
      <nav class="nav-menu">
        <router-link
          v-for="route in routes"
          :key="route.path"
          :to="route.path"
          class="nav-button"
          active-class="active"
        >
          <span class="nav-icon">{{ route.icon }}</span>
          <span class="nav-label">{{ route.label }}</span>
        </router-link>
      </nav>

      <div v-if="showExpiryBanner" class="expiry-banner">
        <span>⚠️ Token 将在 {{ expiryText }} 到期</span>
        <div class="expiry-actions">
          <button class="small-btn" @click="dismissBanner">忽略</button>
          <button class="small-btn" @click="openTokenModal">查看</button>
        </div>
      </div>

      <div class="auth-block">
        <div v-if="loggedIn" class="user-info" @click="openTokenModal" role="button" tabindex="0">
          <div class="avatar" :title="username || '管理员'">
            <svg viewBox="0 0 24 24" class="avatar-svg" aria-hidden="true">
              <defs>
                <linearGradient id="grad1" x1="0" x2="1">
                  <stop offset="0" stop-color="var(--accent1)" />
                  <stop offset="1" stop-color="var(--accent2)" />
                </linearGradient>
              </defs>
              <circle cx="12" cy="8" r="3.2" fill="url(#grad1)"></circle>
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="1.2"/>
            </svg>
          </div>
          <div class="user-meta">
            <div class="user-name">{{ username || '管理员' }}</div>
            <div class="token-expiry" v-if="expiryText">Token: {{ expiryText }}</div>
          </div>
          <div class="user-actions">
            <button class="small-btn" @click.stop="onLogout">登出</button>
            <button class="small-btn" @click.stop="toggleTheme" title="切换主题">{{ themeLabel }}</button>
          </div>
          <div v-if="expiringSoon" class="expiry-badge" title="Token 即将过期">⚠️</div>
        </div>
        <div v-else>
          <router-link to="/login" class="small-btn">登录</router-link>
        </div>

        <!-- Token / User modal (reusable component) -->
        <AdminInfoModal
          :show="showTokenModal"
          :username="username || undefined"
          :expiryText="expiryText"
          :tokenPayload="tokenPayload"
          :maskedToken="maskedToken"
          :rawToken="getAuthToken() || undefined"
          :showRaw="showRaw"
          @close="closeTokenModal"
          @logout="onLogout"
          @copy="copyToken"
          @toggle-raw="toggleShowRawToken"
        />

      </div>
    </aside>
    <main class="main">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>

      <section class="footer">
        <p>
          当前版本：前后端物理分离 · REST 调用<br />
          行为评分与卖飞评分驱动每个标的的 ShockPolicy / EarningsPolicy；Greeks 暴露通过水位条形图展示与限额的相对关系。
        </p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">

const routes = [
  { path: '/behavior', label: '行为评分', icon: '🎯' },
  { path: '/positions', label: '持仓评估', icon: '📊' },
  { path: '/macro', label: '宏观提醒', icon: '🌍' },
  { path: '/opportunities', label: '执行列表', icon: '📌' },
  { path: '/advice', label: 'AI 建议', icon: '🤖' },
  { path: '/plans', label: '交易计划', icon: '🧭' },
  { path: '/api-monitoring', label: 'API 监控', icon: '📡' },
  { path: '/monitoring', label: '系统健康', icon: '🩺' }
];
import { computed, ref, onMounted, onUnmounted } from 'vue';
import router from './router';
import { isLoggedIn, logout, getCurrentUsername, getTokenExpiryMs, getAuthToken, getTokenPayload, isTokenExpired } from './api/client';
import AdminInfoModal from './components/AdminInfoModal.vue';

const loggedIn = computed(() => isLoggedIn());
const username = ref(getCurrentUsername());
const expiryText = ref('');
const theme = ref(localStorage.getItem('theme') || 'dark');
const themeLabel = computed(() => theme.value === 'dark' ? '浅色' : '深色');

const showTokenModal = ref(false);
const showRaw = ref(false);
const tokenPayload = ref<any | null>(null);
const maskedToken = ref('');
const expiringSoon = ref(false);
const showExpiryBanner = ref(false);
const bannerDismissUntilKey = 'expiry_banner_dismiss_until';

function formatExpiryText(ms: number | null) {
  if (!ms) return '';
  const diff = ms - Date.now();
  if (diff <= 0) return '已过期';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} 分钟后到期`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时后到期`;
  return `${Math.floor(hours / 24)} 天后到期`;
}

function updateExpiry() {
  const ms = getTokenExpiryMs();
  expiryText.value = formatExpiryText(ms);
  expiringSoon.value = ms ? (ms - Date.now() < 5 * 60 * 1000) : false; // <5min

  // show banner and notify when expiring soon and user hasn't dismissed recently
  try {
    const until = Number(sessionStorage.getItem(bannerDismissUntilKey) || '0');
    if (expiringSoon.value && Date.now() > until) {
      showExpiryBanner.value = true;
      // desktop notification
      if (typeof Notification !== 'undefined') {
        try {
          if (Notification.permission === 'default') {
            Notification.requestPermission().then((p) => { if (p === 'granted') sendExpiryNotification(); });
          } else if (Notification.permission === 'granted') {
            sendExpiryNotification();
          }
        } catch (e) {}
      }
    } else {
      showExpiryBanner.value = false;
    }
  } catch (e) {
    showExpiryBanner.value = expiringSoon.value;
  }

  // auto logout when expired (only when a token exists)
  if (getAuthToken() && isTokenExpired()) {
    logout();
  }
}

function sendExpiryNotification() {
  try {
    const n = new Notification('Token 快到期', { body: `Token 将在 ${expiryText.value} 到期，建议尽快续期` });
    n.onclick = () => { openTokenModal(); window.focus && window.focus(); };
  } catch (e) {}
}

function dismissBanner() {
  // 不再弹出 3 分钟
  try { sessionStorage.setItem(bannerDismissUntilKey, String(Date.now() + 3 * 60 * 1000)); } catch (e) {}
  showExpiryBanner.value = false;
}

function openTokenModal() {
  const token = getAuthToken();
  tokenPayload.value = getTokenPayload();
  maskedToken.value = token ? `${token.slice(0,8)}...${token.slice(-8)}` : '';
  showRaw.value = false;
  showTokenModal.value = true;
}
function closeTokenModal() { showTokenModal.value = false; }
function toggleShowRawToken() { showRaw.value = !showRaw.value; }
async function copyToken() {
  const t = getAuthToken();
  if (!t) return;
  try { await navigator.clipboard.writeText(t); alert('Token 已复制到剪贴板'); } catch { alert('复制失败'); }
}

function handleAuthLogout() {
  try {
    router.push('/login');
  } catch (e) {}
} 

let timer: number | undefined;
onMounted(() => {
  timer = window.setInterval(() => {
    username.value = getCurrentUsername();
    updateExpiry();
  }, 1000);
  updateExpiry();
  applyTheme();

  // Listen for auth-logout events dispatched by API layer and navigate via router
  try { window.addEventListener('auth-logout', handleAuthLogout); } catch (e) {}
});

onUnmounted(() => { if (timer) clearInterval(timer); try { window.removeEventListener('auth-logout', handleAuthLogout); } catch (e) {} });

function onLogout() { logout(); router.push('/login'); }
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', theme.value);
  applyTheme();
}
function applyTheme() {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.toggle('theme-light', theme.value === 'light');
    document.documentElement.classList.toggle('theme-dark', theme.value !== 'light');
  }
}

</script>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  min-height: 100vh;
  background: var(--bg-main);
  color: var(--text-color);
}

.sidebar {
  padding: 24px 20px;
  border-right: 1px solid rgba(30, 64, 175, 0.12);
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  background: var(--sidebar-bg);
  flex-shrink: 0;
}

.desc {
  font-size: 0.8rem;
  color: #9ca3af;
  line-height: 1.4;
  margin: 0;
  flex-shrink: 0;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 12px 0;
}

.nav-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: rgba(31, 41, 55, 0.5);
  border: 1px solid rgba(55, 65, 81, 0.8);
  border-radius: 10px;
  color: #9ca3af;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.nav-button:hover {
  background: rgba(31, 41, 55, 0.8);
  border-color: rgba(56, 189, 248, 0.5);
  color: #e5e7eb;
}

.nav-button.active {
  background: rgba(56, 189, 248, 0.15);
  border-color: rgba(56, 189, 248, 0.8);
  color: #38bdf8;
  font-weight: 600;
}

.nav-icon {
  font-size: 1.2rem;
}

.nav-label {
  flex: 1;
}

.guideline {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.footer {
  margin-top: auto;
  padding: 20px 24px;
  border-top: 1px solid rgba(31, 41, 55, 0.8);
  font-size: 0.78rem;
  color: #6b7280;
}

.auth-block {
  margin-top: 8px;
  padding-top: 10px;
  border-top: 1px solid rgba(31, 41, 55, 0.06);
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}
.avatar {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  overflow: hidden;
}
.avatar-svg {
  width: 100%;
  height: 100%;
  display: block;
  animation: bob 3s ease-in-out infinite;
}
@keyframes bob {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}
.user-meta {
  flex: 1;
  min-width: 0;
}
.user-name {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.95rem;
}
.token-expiry {
  color: var(--muted-color);
  font-size: 0.8rem;
}
.user-actions {
  display: flex;
  gap: 8px;
}
.small-btn {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(56,189,248,0.08);
  color: var(--accent1);
  border: 1px solid rgba(56,189,248,0.12);
  text-decoration: none;
}
.expiry-banner {
  margin-top: 12px;
  background: linear-gradient(90deg, rgba(255, 236, 179, 0.06), rgba(255, 236, 179, 0.03));
  border: 1px solid rgba(255, 205, 54, 0.12);
  color: #ffcd34;
  padding: 8px 10px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.expiry-actions { display: flex; gap: 8px; }

.expiry-badge {
  margin-left: 8px;
  color: #ffcd34;
  font-weight: 700;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(2,6,23,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
}
.modal {
  width: 480px;
  background: var(--card-bg);
  border-radius: 10px;
  padding: 18px;
  box-shadow: 0 12px 40px rgba(2,6,23,0.6);
}
.modal h3 { margin: 0 0 8px 0; }
.modal-row { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 10px; }
.modal-row strong { width: 110px; color: var(--muted-color); }
.modal-row span { flex: 1; color: var(--text-color); }
.payload { background: rgba(0,0,0,0.08); padding: 8px; border-radius: 6px; max-height: 160px; overflow: auto; }
.raw-token { display: flex; gap: 8px; align-items: center; }
.raw-input { flex: 1; padding: 8px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.06); background: rgba(8,12,20,0.3); color: var(--text-color); }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px; }


.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 900px) {
  .layout {
    grid-template-columns: minmax(0, 1fr);
  }
  .sidebar {
    border-right: none;
    border-bottom: 1px solid rgba(30, 64, 175, 0.6);
  }
}
</style>
