<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1>AI Trading</h1>
        <div class="header-tools">
          <button class="tool-btn" @click="toggleTheme" :title="$t('auth.switch_theme')">{{ themeLabel }}</button>
          <button class="tool-btn" @click="toggleLanguage" :title="$t('auth.switch_language')">{{ currentLocaleLabel }}</button>
        </div>
      </div>
      <p class="sidebar-subtitle">{{ $t('nav.control_tower') }}</p>

      <nav class="nav-menu">
        <!-- Dashboard 独立入口 -->
        <router-link to="/dashboard" class="nav-button" active-class="active">
          <span class="nav-icon">📈</span>
          <span class="nav-label">Dashboard</span>
        </router-link>

        <!-- 分组导航 -->
        <div v-for="group in navGroups" :key="group.title" class="nav-group">
          <button class="group-header" @click="toggleGroup(group.title)">
            <span class="group-title">{{ group.title }}</span>
            <span class="group-arrow" :class="{ open: openGroups[group.title] }">▸</span>
          </button>
          <transition name="slide">
            <div v-show="openGroups[group.title]" class="group-items">
              <router-link
                v-for="item in group.items"
                :key="item.path"
                :to="item.path"
                class="nav-button sub"
                active-class="active"
              >
                <span class="nav-icon">{{ item.icon }}</span>
                <span class="nav-label">{{ item.label }}</span>
              </router-link>
            </div>
          </transition>
        </div>
      </nav>

      <div v-if="showExpiryBanner" class="expiry-banner">
        <span>{{ $t('expiry.banner_text', { time: expiryText }) }}</span>
        <div class="expiry-actions">
          <button class="small-btn" @click="dismissBanner">{{ $t('common.confirm') }}</button>
          <button class="small-btn" @click="openTokenModal">{{ $t('common.edit') }}</button>
        </div>
      </div>

      <div class="auth-block">
        <div v-if="loggedIn" class="user-info" @click="openTokenModal" role="button" tabindex="0">
          <div class="avatar" :title="username || $t('auth.admin')">
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
            <div class="user-name">{{ username || $t('auth.admin') }}</div>
            <div class="token-expiry" v-if="expiryText">Token: {{ expiryText }}</div>
          </div>
          <div class="user-actions">
            <button class="small-btn" @click.stop="onLogout">{{ $t('auth.logout') }}</button>
          </div>
          <div v-if="expiringSoon" class="expiry-badge" :title="$t('auth.token_expiring_soon')">⚠️</div>
        </div>
        <div v-else>
          <router-link to="/login" class="small-btn">{{ $t('auth.login') }}</router-link>
        </div>

        <!-- Token / User modal -->
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
          {{ $t('footer.version') }}<br />
          {{ $t('footer.description') }}
        </p>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import router from './router';
import { useRoute } from 'vue-router';
import { isLoggedIn, logout, getCurrentUsername, getTokenExpiryMs, getAuthToken, getTokenPayload, isTokenExpired } from './api/client';
import AdminInfoModal from './components/AdminInfoModal.vue';

const { t, locale } = useI18n();
const route = useRoute()

interface NavItem { path: string; label: string; icon: string }
interface NavGroup { title: string; items: NavItem[] }

const navGroups = computed<NavGroup[]>(() => [
  {
    title: t('nav.group_realtime'),
    items: [
      { path: '/positions', label: t('nav.positions'), icon: '📊' },
      { path: '/ai-advisor', label: t('nav.ai_advisor'), icon: '🧠' },
      { path: '/journal', label: t('nav.journal'), icon: '📓' },
      { path: '/alerts', label: t('nav.alerts'), icon: '🔔' },
      { path: '/quant-loop', label: t('nav.quant_loop'), icon: '🔄' },
    ],
  },
  {
    title: t('nav.group_analysis'),
    items: [
      { path: '/hotspots', label: t('nav.hotspots'), icon: '🔥' },
      { path: '/macro', label: t('nav.macro'), icon: '🌍' },
      { path: '/advice', label: t('nav.advice'), icon: '🤖' },
      { path: '/strategies', label: t('nav.strategies'), icon: '📚' },
      { path: '/opportunities', label: t('nav.opportunities'), icon: '🔍' },
      { path: '/behavior', label: t('nav.behavior'), icon: '🎯' },
    ],
  },
  {
    title: t('nav.group_config'),
    items: [
      { path: '/system', label: t('nav.system'), icon: '🩺' },
    ],
  },
])

// --- Collapsible nav groups ---
const openGroups = reactive<Record<string, boolean>>({})

// Initialize openGroups based on navGroups titles
watch(navGroups, (newGroups) => {
  newGroups.forEach(group => {
    if (openGroups[group.title] === undefined) {
      openGroups[group.title] = group.title === t('nav.group_realtime')
    }
  })
}, { immediate: true })

function toggleGroup(title: string) {
  openGroups[title] = !openGroups[title]
}

// Auto-expand the group containing the current route
function autoExpandGroup() {
  const currentPath = route.path
  for (const group of navGroups.value) {
    if (group.items.some(item => currentPath.startsWith(item.path))) {
      openGroups[group.title] = true
    }
  }
}
watch(() => route.path, autoExpandGroup, { immediate: true })

const loggedIn = computed(() => isLoggedIn());
const username = ref(getCurrentUsername());
const expiryText = ref('');
const theme = ref(localStorage.getItem('theme') || 'dark');
const themeLabel = computed(() => theme.value === 'dark' ? t('auth.light_mode') : t('auth.dark_mode'));

const currentLocaleLabel = computed(() => locale.value === 'zh-CN' ? 'EN' : 'CN');

function toggleLanguage() {
  locale.value = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN';
  localStorage.setItem('locale', locale.value);
}

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
  if (diff <= 0) return t('expiry.expired');
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return t('expiry.mins_left', { n: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('expiry.hours_left', { n: hours });
  return t('expiry.days_left', { n: Math.floor(hours / 24) });
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
    const n = new Notification(t('expiry.banner_title'), { body: t('expiry.banner_body', { time: expiryText.value }) });
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
  grid-template-columns: 240px minmax(0, 1fr);
  min-height: 100vh;
  background: var(--bg-main);
  color: var(--text-color);
}

.sidebar {
  padding: 20px 14px;
  border-right: 1px solid rgba(30, 64, 175, 0.12);
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  background: var(--sidebar-bg);
  flex-shrink: 0;
}

.sidebar h1 { font-size: 1.05rem; margin: 0; }
.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}
.header-tools {
  display: flex;
  gap: 4px;
}
.tool-btn {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #9ca3af;
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
}
.tool-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
.sidebar-subtitle {
  font-size: 0.75rem;
  color: #6b7280;
  margin: 0 0 8px;
}

.nav-menu {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 4px 0;
}

/* --- Group header --- */
.nav-group { margin-top: 4px; }
.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 6px 12px;
  background: none;
  border: none;
  color: #6b7280;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  cursor: pointer;
  transition: color 0.15s;
}
.group-header:hover { color: #9ca3af; }
.group-arrow {
  font-size: 0.7rem;
  transition: transform 0.2s ease;
  display: inline-block;
}
.group-arrow.open { transform: rotate(90deg); }

.group-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
}

/* --- Nav buttons --- */
.nav-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: rgba(31, 41, 55, 0.4);
  border: 1px solid rgba(55, 65, 81, 0.6);
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.85rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}
.nav-button.sub {
  padding: 8px 14px 8px 20px;
  font-size: 0.82rem;
  background: rgba(31, 41, 55, 0.25);
  border-color: rgba(55, 65, 81, 0.4);
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

.nav-icon { font-size: 1rem; }
.nav-label { flex: 1; }

/* --- Slide transition --- */
.slide-enter-active, .slide-leave-active {
  transition: max-height 0.25s ease, opacity 0.2s ease;
  max-height: 400px;
  opacity: 1;
}
.slide-enter-from, .slide-leave-to {
  max-height: 0;
  opacity: 0;
}

.footer {
  margin-top: auto;
  padding: 20px 24px;
  border-top: 1px solid rgba(31, 41, 55, 0.8);
  font-size: 0.78rem;
  color: #6b7280;
}

.auth-block {
  margin-top: auto;
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
  width: 40px;
  height: 40px;
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
.user-meta { flex: 1; min-width: 0; }
.user-name { font-weight: 600; color: var(--text-color); font-size: 0.9rem; }
.token-expiry { color: var(--muted-color); font-size: 0.75rem; }
.user-actions { display: flex; gap: 6px; }
.small-btn {
  display: inline-block;
  padding: 5px 8px;
  border-radius: 6px;
  background: rgba(56,189,248,0.08);
  color: var(--accent1);
  border: 1px solid rgba(56,189,248,0.12);
  text-decoration: none;
  font-size: 0.78rem;
}
.expiry-banner {
  background: linear-gradient(90deg, rgba(255, 236, 179, 0.06), rgba(255, 236, 179, 0.03));
  border: 1px solid rgba(255, 205, 54, 0.12);
  color: #ffcd34;
  padding: 8px 10px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}
.expiry-actions { display: flex; gap: 6px; }
.expiry-badge { margin-left: 8px; color: #ffcd34; font-weight: 700; }

.fade-enter-active,
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

@media (max-width: 900px) {
  .layout { grid-template-columns: minmax(0, 1fr); }
  .sidebar { border-right: none; border-bottom: 1px solid rgba(30, 64, 175, 0.6); }
}
</style>
