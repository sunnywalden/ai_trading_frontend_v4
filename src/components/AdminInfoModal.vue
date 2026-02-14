<template>
  <div v-if="show" class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <h3>{{ $t('auth.info_modal.title') }}</h3>
      <div class="modal-row"><strong>{{ $t('auth.info_modal.username') }}</strong><span>{{ username || '-' }}</span></div>
      <div class="modal-row"><strong>{{ $t('auth.info_modal.token_expiry') }}</strong><span>{{ expiryText || '-' }}</span></div>
      <div class="modal-row"><strong>{{ $t('auth.info_modal.payload') }}</strong>
        <pre class="payload">{{ tokenPayload ? JSON.stringify(tokenPayload, null, 2) : '-' }}</pre>
      </div>
      <div class="modal-row">
        <strong>{{ $t('auth.info_modal.raw_token') }}</strong>
        <div class="raw-token">
          <input readonly :value="showRaw ? rawToken : maskedToken" class="raw-input" />
          <button class="small-btn" @click="$emit('toggle-raw')">{{ showRaw ? $t('auth.info_modal.hide') : $t('auth.info_modal.show') }}</button>
          <button class="small-btn" @click="$emit('copy')">{{ $t('auth.info_modal.copy') }}</button>
        </div>
      </div>
      <div class="modal-actions">
        <button class="small-btn" @click="$emit('logout')">{{ $t('auth.info_modal.logout') }}</button>
        <button class="small-btn" @click="$emit('close')">{{ $t('auth.info_modal.close') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  show: { type: Boolean, default: false },
  username: { type: String, default: '' },
  expiryText: { type: String, default: '' },
  tokenPayload: { type: Object, default: null },
  maskedToken: { type: String, default: '' },
  rawToken: { type: String, default: '' },
  showRaw: { type: Boolean, default: false }
});
</script>

<style scoped>
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
</style>