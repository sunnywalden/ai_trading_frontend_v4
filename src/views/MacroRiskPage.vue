<template>
  <div class="page-container">
    <section class="section-header">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2>{{ $t('macro.title') }}</h2>
          <p>{{ $t('macro.subtitle') }}</p>
        </div>
        <button class="refresh-button" @click="onRefreshMacro" :disabled="loading">
          {{ loading ? $t('macro.refreshing') : $t('macro.refresh') }}
        </button>
      </div>
    </section>

    <p v-if="errorMsg" class="error-message">{{ errorMsg }}</p>
    <p v-else-if="loading" class="loading-message">{{ $t('macro.loading') }}</p>
    
    <div v-else-if="macroRiskData">
      <MacroRiskDigestCard :data="macroRiskData" />
      <details class="detail-accordion">
        <summary>{{ $t('macro.expand') }}</summary>
        <MacroRiskDashboard :data="macroRiskData" />
      </details>
      <MacroRiskGuideline />
    </div>
    <p v-else class="info-message">{{ $t('macro.empty') }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import MacroRiskDashboard from '../components/MacroRiskDashboard.vue';
import MacroRiskDigestCard from '../components/MacroRiskDigestCard.vue';
import MacroRiskGuideline from '../components/MacroRiskGuideline.vue';
import { 
  fetchMacroRiskOverview, 
  type MacroRiskOverviewResponse,
  refreshMacroData
} from '../api/client';

const { t } = useI18n();
const macroRiskData = ref<MacroRiskOverviewResponse | null>(null);
const loading = ref(false);
const errorMsg = ref('');

async function loadMacroRiskData() {
  loading.value = true;
  errorMsg.value = '';
  try {
    macroRiskData.value = await fetchMacroRiskOverview();
  } catch (e: any) {
    console.error('加载宏观风险失败:', e);
    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      errorMsg.value = t('positions.error_timeout');
    } else if (e.code === 'ERR_NETWORK' || e.message?.includes('Network Error')) {
      errorMsg.value = t('positions.error_network');
    } else {
      errorMsg.value = t('macro.error_load');
    }
  } finally {
    loading.value = false;
  }
}

async function onRefreshMacro() {
  try {
    const result = await refreshMacroData();
    console.log(result.message);
    await loadMacroRiskData();
  } catch (e: any) {
    console.error('刷新宏观数据失败:', e);
    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      errorMsg.value = t('positions.refresh_error_timeout');
    } else if (e.code === 'ERR_NETWORK' || e.message?.includes('Network Error')) {
      errorMsg.value = t('positions.refresh_error_network');
    } else {
      errorMsg.value = t('macro.error_refresh');
    }
  }
}

onMounted(() => {
  loadMacroRiskData();
});
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px 24px;
}

.section-header {
  margin-bottom: 8px;
}

.section-header h2 {
  margin: 0 0 8px 0;
  font-size: 1.5rem;
  color: #e5e7eb;
}

.section-header p {
  margin: 0;
  font-size: 0.9rem;
  color: #9ca3af;
}

.refresh-button {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.4);
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.refresh-button:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.6);
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  padding: 12px 16px;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  color: #fca5a5;
  font-size: 0.9rem;
}

.loading-message {
  padding: 12px 16px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  color: #93c5fd;
  font-size: 0.9rem;
}

.info-message {
  padding: 12px 16px;
  background: rgba(107, 114, 128, 0.1);
  border: 1px solid rgba(107, 114, 128, 0.3);
  border-radius: 8px;
  color: #9ca3af;
  font-size: 0.9rem;
  text-align: center;
}

.detail-accordion {
  margin-top: 12px;
  padding: 12px 16px;
  border-radius: 10px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.detail-accordion summary {
  cursor: pointer;
  color: #9ca3af;
  font-size: 0.85rem;
  margin-bottom: 8px;
}
</style>
