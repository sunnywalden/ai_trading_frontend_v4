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
      <p class="hint">示例：{ "symbol": "AAPL", "intent": "adjust_position" }</p>
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

.hint {
  margin: 0;
  font-size: 0.78rem;
  color: #9ca3af;
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
