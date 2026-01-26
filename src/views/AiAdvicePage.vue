<template>
  <div class="page-container">
    <section class="section-header">
      <div>
        <h2>🤖 AI 建议</h2>
        <p>提交结构化请求，获取 AI 决策建议与订单草案</p>
      </div>
    </section>

    <p v-if="errorMsg" class="error-message">{{ errorMsg }}</p>

    <section class="panel">
      <div class="panel-header">
        <h3>请求体（JSON）</h3>
        <button class="send-button" @click="onSend" :disabled="loading">
          {{ loading ? '请求中...' : '发送请求' }}
        </button>
      </div>
      <textarea
        v-model="requestText"
        class="json-input"
        rows="10"
        placeholder="请输入 AI 建议请求 JSON"
      ></textarea>
      <div class="hint-section">
        <p class="hint">必填字段：goal (目标描述)</p>
        <p class="hint">可选字段：account_id, time_horizon ("INTRADAY"|"SWING"|"POSITION"), risk_preference, notes</p>
        <details class="example-details">
          <summary>查看完整示例</summary>
          <pre class="example-code">{
  "goal": "调整 META 仓位",
  "time_horizon": "SWING",
  "notes": "当前持仓 META，考虑调整"
}

或更详细的：
{
  "account_id": "demo-account",
  "goal": "持仓 META 待合结果出调整建议",
  "time_horizon": "POSITION",
  "risk_preference": {
    "level": "MEDIUM",
    "max_drawdown_pct": 0.2,
    "target_vol_pct": 0.25
  },
  "notes": "持仓 META，需要根据当前市场情况决定是否合并、减仓或卖出"
}</pre>
        </details>
      </div>
    </section>

    <section class="panel" v-if="responseText">
      <div class="panel-header">
        <h3>响应结果</h3>
      </div>
      <pre class="json-output">{{ responseText }}</pre>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { fetchAiAdvice } from '../api/client';

const requestText = ref('');
const responseText = ref('');
const loading = ref(false);
const errorMsg = ref('');

async function onSend() {
  errorMsg.value = '';
  responseText.value = '';
  let payload: any;
  try {
    payload = requestText.value ? JSON.parse(requestText.value) : {};
  } catch (e) {
    errorMsg.value = '❌ JSON 解析失败，请检查格式';
    return;
  }

  loading.value = true;
  try {
    const data = await fetchAiAdvice(payload);
    responseText.value = JSON.stringify(data, null, 2);
  } catch (e: any) {
    console.error(e);
    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      errorMsg.value = '⏱️ 请求超时，请稍后再试！';
    } else if (e.code === 'ERR_NETWORK' || e.message?.includes('Network Error')) {
      errorMsg.value = '🌐 网络连接失败，请检查网络或后端服务状态';
    } else if (e.response?.status === 422) {
      const detail = e.response?.data?.detail || '请求参数验证失败';
      errorMsg.value = `❌ 请求格式错误 (422): ${typeof detail === 'string' ? detail : JSON.stringify(detail)}\n\n必填字段：goal (字符串)`;
    } else {
      errorMsg.value = '❌ 获取 AI 建议失败';
    }
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.page-container {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px 24px;
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

.panel {
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 12px;
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h3 {
  margin: 0;
  font-size: 1rem;
  color: #e5e7eb;
}

.json-input {
  background: #020617;
  border: 1px solid rgba(148, 163, 184, 0.6);
  border-radius: 8px;
  color: #e5e7eb;
  font-size: 0.85rem;
  padding: 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}

.json-output {
  background: #020617;
  border: 1px solid rgba(148, 163, 184, 0.6);
  border-radius: 8px;
  color: #e5e7eb;
  font-size: 0.85rem;
  padding: 12px;
  white-space: pre-wrap;
}

.hint-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.hint {
  margin: 0;
  font-size: 0.78rem;
  color: #9ca3af;
}

.example-details {
  margin-top: 4px;
}

.example-details summary {
  cursor: pointer;
  color: #38bdf8;
  font-size: 0.8rem;
  padding: 4px 0;
  user-select: none;
}

.example-details summary:hover {
  color: #7dd3fc;
}

.example-code {
  margin: 8px 0 0 0;
  padding: 12px;
  background: #020617;
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 6px;
  color: #a5b4fc;
  font-size: 0.75rem;
  overflow-x: auto;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.send-button {
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.4);
  background: rgba(56, 189, 248, 0.1);
  color: #38bdf8;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
}

.send-button:disabled {
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
</style>
