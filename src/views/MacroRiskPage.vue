<template>
  <div class="page-container">
    <section class="section-header">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h2>🌍 宏观风险</h2>
          <p>货币政策、地缘政治、行业泡沫、经济周期、市场情绪</p>
        </div>
        <button class="refresh-button" @click="onRefreshMacro" :disabled="loading">
          {{ loading ? '刷新中...' : '刷新数据' }}
        </button>
      </div>
    </section>

    <p v-if="errorMsg" class="error-message">{{ errorMsg }}</p>
    <p v-else-if="loading" class="loading-message">正在加载宏观风险数据...</p>
    
    <div v-else-if="macroRiskData">
      <MacroRiskDashboard :data="macroRiskData" />
      <MacroRiskGuideline />
    </div>
    <p v-else class="info-message">暂无宏观风险数据</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import MacroRiskDashboard from '../components/MacroRiskDashboard.vue';
import MacroRiskGuideline from '../components/MacroRiskGuideline.vue';
import { 
  fetchMacroRiskOverview, 
  type MacroRiskOverviewResponse,
  refreshMacroData
} from '../api/client';

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
      errorMsg.value = '⏱️ 请求超时，请稍后再试！';
    } else if (e.code === 'ERR_NETWORK' || e.message?.includes('Network Error')) {
      errorMsg.value = '🌐 网络连接失败，请检查网络或后端服务状态';
    } else {
      errorMsg.value = '❌ 获取宏观风险数据失败';
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
      errorMsg.value = '⏱️ 刷新请求超时，请稍后再试！';
    } else if (e.code === 'ERR_NETWORK' || e.message?.includes('Network Error')) {
      errorMsg.value = '🌐 网络连接失败，无法刷新数据';
    } else {
      errorMsg.value = '❌ 刷新宏观数据失败';
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
</style>
