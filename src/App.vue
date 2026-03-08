<template>
  <div class="layout" :class="{ 'no-sidebar': !loggedIn }">
    <aside v-if="loggedIn" class="sidebar">
      <div class="sidebar-header">
        <h1>AI Quant</h1>
        <div class="header-tools">
          <button class="tool-btn" @click="toggleTheme" :title="$t('auth.switch_theme')">{{ themeLabel }}</button>
          <button class="tool-btn" @click="toggleLanguage" :title="$t('auth.switch_language')">{{ currentLocaleLabel }}</button>
        </div>
      </div>
      <p class="sidebar-subtitle">{{ $t('nav.control_tower') }}</p>

      <nav class="nav-menu">
        <!-- 指挥室 独立顶级入口 -->
        <router-link to="/dashboard" class="nav-button command-room" active-class="active">
          <span class="nav-icon">🏛️</span>
          <div class="nav-label-block">
            <span class="nav-label">{{ $t('nav.module_command') }}</span>
            <span class="nav-subdesc">{{ $t('nav.module_command_desc') }}</span>
          </div>
        </router-link>

        <!-- 三大模块分组 -->
        <div v-for="group in navGroups" :key="group.title" class="nav-group">
          <button class="group-header" @click="toggleGroup(group.title)">
            <div class="group-title-block">
              <span class="group-title">{{ group.title }}</span>
              <span v-if="group.desc" class="group-desc">{{ group.desc }}</span>
            </div>
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
        <div v-if="loggedIn" class="user-info">
          <button type="button" class="user-summary-btn" @click="openTokenModal">
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
            <div v-if="expiringSoon" class="expiry-badge" :title="$t('auth.token_expiring_soon')">⚠️</div>
          </button>
          <div class="user-actions">
            <button class="small-btn" @click.stop="onLogout">{{ $t('auth.logout') }}</button>
          </div>
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
      <SituationalAwarenessBar v-if="loggedIn" />
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

  <!-- V10.4 M3: 全局 Copilot 悬浮助手（任何页面均可 ⌘K 唤起） -->
  <CopilotFloatingWidget />
  <!-- V10.4.4: 全局仓位详情抽屉 -->
  <PositionDetailModal />
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { getAuthToken, getCurrentUsername, getTokenExpiryMs, getTokenPayload, isLoggedIn, isTokenExpired, logout } from './api/client';
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import AdminInfoModal from './components/AdminInfoModal.vue';
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import CopilotFloatingWidget from './components/CopilotFloatingWidget.vue';
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import PositionDetailModal from './components/PositionDetailModal.vue';
// @ts-ignore Vue SFC default export is provided by the Vue compiler.
import SituationalAwarenessBar from './components/SituationalAwarenessBar.vue';
import router from './router';
import { useWebSocketStore } from './stores/websocket';

const { t, locale } = useI18n();
const route = useRoute()
const wsStore = useWebSocketStore();

interface NavItem { path: string; label: string; icon: string }
interface NavGroup { title: string; desc?: string; items: NavItem[] }

const navGroups = computed<NavGroup[]>(() => [
  {
    // 交易中枢：交易台 + 可观测性 & War Room（V10.4 4-group spec）
    title: t('nav.module_desk'),
    desc: t('nav.module_desk_desc'),
    items: [
      { path: '/positions',                label: t('nav.positions'),           icon: '📊' },
      { path: '/position-evaluation',      label: t('nav.position_evaluation'), icon: '🔬' },
      { path: '/events',                   label: t('nav.events'),              icon: '📅' },
      { path: '/quant-loop',               label: t('nav.quant_loop'),          icon: '🔄' },
      { path: '/paper',                    label: t('nav.paper'),               icon: '🧪' },
      { path: '/attribution',              label: t('nav.attribution'),         icon: '🎯' },
      { path: '/trade-lifecycle',          label: t('nav.trade_lifecycle'),     icon: '�' },
      { path: '/order-book',               label: t('nav.order_book'),          icon: '📋' },
      { path: '/observability/execution',  label: t('nav.exec_microscope'),     icon: '🔬' },
      { path: '/execution-policy',         label: 'Execution Policy',           icon: '🧠' },
      { path: '/observability/signal',     label: t('nav.signal_intelligence'), icon: '📡' },
      { path: '/observability/risk',       label: t('nav.risk_cluster'),        icon: '⚡' },
      { path: '/war-room',                 label: t('nav.war_room'),            icon: '⚔️' },
      { path: '/signal-watchtower',           label: t('nav.signal_watchtower'),   icon: '🔭' },  // V10.4.2
    ],
  },
  {
    // 研究 & 分析
    title: t('nav.module_research'),
    desc: t('nav.module_research_desc'),
    items: [
      { path: '/opportunities', label: t('nav.opportunities'), icon: '🔍' },
      { path: '/macro',         label: t('nav.macro'),         icon: '🌍' },
      { path: '/strategies',    label: t('nav.strategies'),    icon: '📚' },
      { path: '/etf-pool',      label: t('nav.etf_pool'),      icon: '📊' },
      { path: '/backtest',      label: t('nav.backtest'),      icon: '📈' },
      { path: '/alpha-lab',     label: 'Alpha Lab',            icon: '🧭' },
      { path: '/portfolio',     label: t('nav.portfolio'),     icon: '⚖️' },
      { path: '/options',       label: t('nav.options'),       icon: '💎' },
    ],
  },
  {
    // AI 洞察 & 系统：AI中枢 + 系统区（regime / alerts / system-monitor）
    title: t('nav.module_ai'),
    desc: t('nav.module_ai_desc'),
    items: [
      { path: '/autonomy',           label: t('nav.autonomy'),        icon: '🤖' },
      { path: '/copilot',            label: t('nav.copilot'),         icon: '💬' },
      { path: '/evolution',          label: t('nav.evolution'),       icon: '🧬' },
      { path: '/journal',            label: t('nav.journal'),         icon: '📓' },
      { path: '/ai-hub/agents',      label: t('nav.multi_agent'),     icon: '🤝' },
      { path: '/ai-hub/calibration', label: t('nav.calibration'),     icon: '🎯' },
      { path: '/ai-hub/weights',     label: t('nav.factor_weights'),  icon: '⚖️' },
      { path: '/ai-hub/post-mortem', label: t('nav.post_mortem'),     icon: '🔭' },
      { path: '/governance/pipeline', label: 'Promotion Pipeline',    icon: '🛡️' },
      { path: '/live-safety',        label: 'Live Safety Guard',      icon: '🔒' },
      { path: '/regime',             label: t('nav.regime'),          icon: '🌊' },
      { path: '/alerts',             label: t('nav.alerts'),          icon: '🔔' },
      { path: '/system-monitor',     label: '系统监控',               icon: '🖥️' },
    ],
  },
])

// --- Collapsible nav groups ---
const openGroups = reactive<Record<string, boolean>>({})

// Initialize: auto-expand first group, or whichever matches current route
watch(navGroups, (newGroups) => {
  newGroups.forEach((group, idx) => {
    if (openGroups[group.title] === undefined) {
      openGroups[group.title] = idx === 0
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

const loggedIn = ref(isLoggedIn());
const username = ref(getCurrentUsername());
const expiryText = ref('');
const theme = ref(localStorage.getItem('theme') || 'dark');
const themeLabel = computed(() => theme.value === 'dark' ? t('auth.light_mode') : t('auth.dark_mode'));

const currentLocaleLabel = computed(() => locale.value === 'zh-CN' ? 'EN' : 'CN');

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

function readBannerDismissUntil(): number {
  try {
    return Number(sessionStorage.getItem(bannerDismissUntilKey) || '0');
  } catch (error) {
    console.warn('[App] failed to read expiry banner dismissal', error);
    return 0;
  }
}

function requestExpiryNotificationIfNeeded() {
  if (typeof Notification === 'undefined') return;
  try {
    if (Notification.permission === 'default') {
      Notification.requestPermission().then((permission) => {
        if (permission === 'granted') sendExpiryNotification();
      });
      return;
    }
    if (Notification.permission === 'granted') {
      sendExpiryNotification();
    }
  } catch (error) {
    console.warn('[App] failed to request expiry notification permission', error);
  }
}

function syncExpiryBanner() {
  const shouldShowBanner = expiringSoon.value && Date.now() > readBannerDismissUntil();
  showExpiryBanner.value = shouldShowBanner;
  if (shouldShowBanner) requestExpiryNotificationIfNeeded();
}

function updateExpiry() {
  const ms = getTokenExpiryMs();
  expiryText.value = formatExpiryText(ms);
  expiringSoon.value = ms ? (ms - Date.now() < 5 * 60 * 1000) : false; // <5min
  syncExpiryBanner();

  // auto logout when expired (only when a token exists)
  if (getAuthToken() && isTokenExpired()) {
    logout();
  }
}

function sendExpiryNotification() {
  try {
    const n = new Notification(t('expiry.banner_title'), { body: t('expiry.banner_body', { time: expiryText.value }) });
    n.onclick = () => {
      openTokenModal();
      if (typeof globalThis.focus === 'function') globalThis.focus();
    };
  } catch (error) {
    console.warn('[App] failed to send expiry notification', error);
  }
}

function dismissBanner() {
  // 不再弹出 3 分钟
  try {
    sessionStorage.setItem(bannerDismissUntilKey, String(Date.now() + 3 * 60 * 1000));
  } catch (error) {
    console.warn('[App] failed to persist expiry banner dismissal', error);
  }
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
  router.push('/login');
}

let timer: number | undefined;
onMounted(() => {
  timer = globalThis.setInterval(() => {
    username.value = getCurrentUsername();
    loggedIn.value = isLoggedIn();
    updateExpiry();
  }, 1000);
  updateExpiry();
  applyTheme();

  // Listen for auth-logout events dispatched by API layer and navigate via router
  globalThis.addEventListener('auth-logout', handleAuthLogout);

  // V10.4 M4: 启动 WebSocket 指数退避重连（已登录时连接）
  if (isLoggedIn()) {
    wsStore.connect();
  }
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
  wsStore.disconnect();
  globalThis.removeEventListener('auth-logout', handleAuthLogout);
});

function onLogout() { logout(); router.push('/login'); }
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', theme.value);
  applyTheme();
}
function toggleLanguage() {
  locale.value = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN';
  localStorage.setItem('locale', locale.value);
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

.layout.no-sidebar {
  grid-template-columns: 1fr;
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
  background: rgba(15, 23, 42, 0.96);
  border: 1px solid rgba(148, 163, 184, 0.35);
  color: #f1f5f9;
  font-size: 0.65rem;
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
}
.tool-btn:hover {
  background: rgba(51, 65, 85, 0.85);
  color: #f8fafc;
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
  background: #164e63;
  border-color: #67e8f9;
  color: #f8fafc;
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
.user-summary-btn {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  padding: 0;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  text-align: left;
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
  background: linear-gradient(90deg, rgba(146, 64, 14, 0.62), rgba(120, 53, 15, 0.52));
  border: 1px solid rgba(255, 205, 54, 0.12);
  color: #fde68a;
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

/* ── Command Room (指挥室) special style ── */
.nav-button.command-room {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.12), rgba(99, 102, 241, 0.08));
  border-color: rgba(56, 189, 248, 0.35);
  padding: 10px 14px;
  margin-bottom: 4px;
}
.nav-button.command-room:hover {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(99, 102, 241, 0.15));
  border-color: rgba(56, 189, 248, 0.65);
}
.nav-button.command-room.active {
  background: linear-gradient(135deg, rgba(8, 145, 178, 0.62), rgba(67, 56, 202, 0.5));
  border-color: #38bdf8;
  color: #bae6fd;
}
.nav-label-block {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}
.nav-subdesc {
  font-size: 0.68rem;
  color: #6b7280;
  font-weight: 400;
}
.nav-button.command-room .nav-subdesc { color: rgba(186, 230, 253, 0.8); }

/* ── Module group header with desc ── */
.group-title-block {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.3;
}
.group-desc {
  font-size: 0.65rem;
  color: #4b5563;
  font-weight: 400;
  letter-spacing: 0;
  text-transform: none;
}

/* ── System section (底部弱化区域，折叠/展开与其他模块一致) ── */
.nav-system-section {
  margin-top: 12px;
  padding-top: 8px;
  border-top: 1px solid rgba(55, 65, 81, 0.35);
}
.system-items {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.nav-button.sub.sys {
  opacity: 0.7;
  font-size: 0.78rem;
  padding: 6px 14px 6px 24px;
}
.nav-button.sub.sys:hover { opacity: 1; }
.nav-button.sub.sys.active { opacity: 1; }
</style>
