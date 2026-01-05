<template>
  <div class="scheduler-config">
    <div class="config-header">
      <h3>⏰ 定时任务配置</h3>
      <button class="refresh-btn" @click="loadJobs" :disabled="loading">
        {{ loading ? '加载中...' : '🔄 刷新' }}
      </button>
    </div>

    <div v-if="errorMsg" class="error-message">{{ errorMsg }}</div>

    <div v-if="!loading && opportunitiesJob" class="job-card">
      <div class="job-header">
        <div class="job-info">
          <span class="job-name">{{ opportunitiesJob.name }}</span>
          <span class="job-id">{{ opportunitiesJob.id }}</span>
        </div>
        <div class="job-status" :class="jobStatusClass">
          {{ jobStatusText }}
        </div>
      </div>

      <div class="job-details">
        <div class="detail-row">
          <span class="detail-label">下次运行</span>
          <span class="detail-value">{{ formatDateTime(opportunitiesJob.next_run_time) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">触发器</span>
          <span class="detail-value trigger-text">{{ opportunitiesJob.trigger }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">时区</span>
          <span class="detail-value">{{ currentTimezone }}</span>
        </div>
      </div>

      <div class="config-section">
        <h4>修改执行时间</h4>
        <div class="time-config">
          <div class="time-input-group">
            <label>时区</label>
            <select v-model="scheduleConfig.timezone" class="timezone-select">
              <option value="Asia/Shanghai">Asia/Shanghai (北京时间 UTC+8)</option>
              <option value="America/New_York">America/New_York (纽约 UTC-5/-4)</option>
              <option value="Europe/London">Europe/London (伦敦 UTC+0/+1)</option>
              <option value="Asia/Tokyo">Asia/Tokyo (东京 UTC+9)</option>
              <option value="UTC">UTC (协调世界时)</option>
            </select>
          </div>

          <div class="time-input-group">
            <label>小时 (0-23)</label>
            <input 
              type="number" 
              v-model.number="scheduleConfig.hour" 
              min="0" 
              max="23"
              class="time-input"
            />
          </div>

          <div class="time-input-group">
            <label>分钟 (0-59)</label>
            <input 
              type="number" 
              v-model.number="scheduleConfig.minute" 
              min="0" 
              max="59"
              class="time-input"
            />
          </div>
        </div>

        <div class="preview-time">
          <span class="preview-label">预览:</span>
          <span class="preview-value">
            每天 {{ String(scheduleConfig.hour).padStart(2, '0') }}:{{ String(scheduleConfig.minute).padStart(2, '0') }} 
            ({{ scheduleConfig.timezone }})
          </span>
        </div>

        <div class="config-actions">
          <button 
            class="save-btn" 
            @click="saveSchedule" 
            :disabled="saving || !isConfigChanged"
          >
            {{ saving ? '保存中...' : '💾 保存配置' }}
          </button>
          <button 
            class="reset-btn" 
            @click="resetConfig"
            :disabled="!isConfigChanged"
          >
            ↩️ 重置
          </button>
        </div>
      </div>

      <div v-if="successMsg" class="success-message">{{ successMsg }}</div>
    </div>

    <div v-else-if="loading" class="loading-message">
      正在加载定时任务信息...
    </div>

    <div class="config-hint">
      <p>💡 <strong>提示：</strong></p>
      <ul>
        <li>修改后将在下一个周期生效</li>
        <li>建议选择市场非交易时段，避免影响实时数据</li>
        <li>北京时间 20:30 对应美股盘后，适合扫描次日机会</li>
        <li>时区变更会影响任务触发时间，请仔细核对</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import {
  fetchSchedulerJobsList,
  updateJobSchedule,
  type SchedulerJobDetail,
  type UpdateJobScheduleRequest
} from '../api/client';

const opportunitiesJob = ref<SchedulerJobDetail | null>(null);
const loading = ref(false);
const saving = ref(false);
const errorMsg = ref('');
const successMsg = ref('');

const scheduleConfig = ref<UpdateJobScheduleRequest>({
  hour: 20,
  minute: 30,
  timezone: 'Asia/Shanghai'
});

const originalConfig = ref<UpdateJobScheduleRequest | null>(null);

const currentTimezone = computed(() => {
  return opportunitiesJob.value?.timezone || scheduleConfig.value.timezone;
});

const jobStatusClass = computed(() => {
  if (!opportunitiesJob.value) return '';
  const status = opportunitiesJob.value.status?.toLowerCase();
  if (status === 'running' || status === 'active') return 'status-active';
  if (status === 'paused') return 'status-paused';
  return 'status-unknown';
});

const jobStatusText = computed(() => {
  if (!opportunitiesJob.value) return '未知';
  const status = opportunitiesJob.value.status?.toLowerCase();
  if (status === 'running' || status === 'active') return '运行中';
  if (status === 'paused') return '已暂停';
  return '未知';
});

const isConfigChanged = computed(() => {
  if (!originalConfig.value) return false;
  return (
    scheduleConfig.value.hour !== originalConfig.value.hour ||
    scheduleConfig.value.minute !== originalConfig.value.minute ||
    scheduleConfig.value.timezone !== originalConfig.value.timezone
  );
});

async function loadJobs() {
  loading.value = true;
  errorMsg.value = '';
  
  try {
    const response = await fetchSchedulerJobsList();
    const job = response.jobs.find(j => j.id === 'scan_daily_opportunities_tech');
    
    if (job) {
      opportunitiesJob.value = job;
      
      // 从 trigger 中解析当前配置
      const triggerMatch = job.trigger.match(/hour='(\d+)',\s*minute='(\d+)'/);
      if (triggerMatch) {
        scheduleConfig.value.hour = parseInt(triggerMatch[1]);
        scheduleConfig.value.minute = parseInt(triggerMatch[2]);
      }
      
      if (job.timezone) {
        scheduleConfig.value.timezone = job.timezone;
      }
      
      originalConfig.value = { ...scheduleConfig.value };
    } else {
      errorMsg.value = '未找到潜在机会扫描任务';
    }
  } catch (e: any) {
    console.error('加载定时任务失败:', e);
    errorMsg.value = '❌ 加载定时任务配置失败';
  } finally {
    loading.value = false;
  }
}

async function saveSchedule() {
  if (!opportunitiesJob.value) return;
  
  saving.value = true;
  errorMsg.value = '';
  successMsg.value = '';
  
  try {
    const response = await updateJobSchedule(
      opportunitiesJob.value.id,
      scheduleConfig.value
    );
    
    successMsg.value = '✅ 配置已保存！' + response.message;
    originalConfig.value = { ...scheduleConfig.value };
    
    // 刷新任务信息
    setTimeout(() => {
      loadJobs();
      successMsg.value = '';
    }, 3000);
  } catch (e: any) {
    console.error('保存配置失败:', e);
    if (e.response?.status === 404) {
      errorMsg.value = '❌ 该 API 端点尚未实现，请联系后端开发人员添加';
    } else {
      errorMsg.value = '❌ 保存配置失败: ' + (e.message || '未知错误');
    }
  } finally {
    saving.value = false;
  }
}

function resetConfig() {
  if (originalConfig.value) {
    scheduleConfig.value = { ...originalConfig.value };
  }
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

onMounted(() => {
  loadJobs();
});
</script>

<style scoped>
.scheduler-config {
  padding: 20px;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 12px;
  margin-top: 20px;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.config-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: #38bdf8;
}

.refresh-btn {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.4);
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.refresh-btn:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.6);
}

.refresh-btn:disabled {
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
  margin-bottom: 16px;
}

.success-message {
  padding: 12px 16px;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 8px;
  color: #86efac;
  font-size: 0.9rem;
  margin-top: 16px;
}

.loading-message {
  padding: 40px;
  text-align: center;
  color: #9ca3af;
  font-size: 0.9rem;
}

.job-card {
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(71, 85, 105, 0.5);
  border-radius: 10px;
  padding: 20px;
}

.job-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(55, 65, 81, 0.5);
}

.job-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.job-name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #e5e7eb;
}

.job-id {
  font-size: 0.75rem;
  color: #6b7280;
  font-family: monospace;
}

.job-status {
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 600;
}

.status-active {
  background: rgba(34, 197, 94, 0.2);
  color: #86efac;
  border: 1px solid rgba(34, 197, 94, 0.4);
}

.status-paused {
  background: rgba(245, 158, 11, 0.2);
  color: #fcd34d;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.status-unknown {
  background: rgba(107, 114, 128, 0.2);
  color: #9ca3af;
  border: 1px solid rgba(107, 114, 128, 0.4);
}

.job-details {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.detail-label {
  font-size: 0.85rem;
  color: #9ca3af;
  font-weight: 500;
}

.detail-value {
  font-size: 0.9rem;
  color: #e5e7eb;
  font-weight: 600;
}

.trigger-text {
  font-family: monospace;
  font-size: 0.75rem;
  color: #93c5fd;
}

.config-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid rgba(55, 65, 81, 0.5);
}

.config-section h4 {
  margin: 0 0 16px;
  font-size: 1rem;
  color: #e5e7eb;
}

.time-config {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.time-input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-input-group label {
  font-size: 0.8rem;
  color: #9ca3af;
  font-weight: 500;
}

.timezone-select,
.time-input {
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.7);
  background: #020617;
  color: #e5e7eb;
  font-size: 0.9rem;
}

.time-input {
  width: 100%;
}

.timezone-select {
  width: 100%;
  cursor: pointer;
}

.preview-time {
  padding: 12px 16px;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 8px;
  margin-bottom: 16px;
}

.preview-label {
  font-size: 0.8rem;
  color: #9ca3af;
  margin-right: 8px;
}

.preview-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: #93c5fd;
  font-family: monospace;
}

.config-actions {
  display: flex;
  gap: 12px;
}

.save-btn,
.reset-btn {
  padding: 10px 20px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.save-btn {
  flex: 1;
  background: linear-gradient(to right, #22c55e, #16a34a);
  color: #e5e7eb;
  box-shadow: 0 0 12px rgba(34, 197, 94, 0.3);
}

.save-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 0 18px rgba(34, 197, 94, 0.5);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  box-shadow: none;
}

.reset-btn {
  background: rgba(107, 114, 128, 0.2);
  color: #9ca3af;
  border: 1px solid rgba(107, 114, 128, 0.4);
}

.reset-btn:hover:not(:disabled) {
  background: rgba(107, 114, 128, 0.3);
  border-color: rgba(107, 114, 128, 0.6);
}

.reset-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.config-hint {
  margin-top: 20px;
  padding: 16px;
  background: rgba(59, 130, 246, 0.05);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 8px;
}

.config-hint p {
  margin: 0 0 8px;
  font-size: 0.85rem;
  color: #93c5fd;
}

.config-hint ul {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.config-hint li {
  position: relative;
  margin-bottom: 6px;
  padding-left: 12px;
  font-size: 0.8rem;
  color: #9ca3af;
  line-height: 1.5;
}

.config-hint li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #60a5fa;
}

@media (max-width: 768px) {
  .time-config {
    grid-template-columns: 1fr;
  }
}
</style>
