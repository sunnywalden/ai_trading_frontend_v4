// 全局配置
export const globalConfig = {
  // 数据窗口天数 - 用于行为评分和持仓评估
  windowDays: 15,
  
  // API配置
  api: {
    baseURL: import.meta.env.DEV ? '/api' : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:8088'),
    timeout: 30000
  },
  
  // 刷新间隔（毫秒）
  refreshInterval: {
    behavior: 60000,      // 行为评分：1分钟
    positions: 300000,    // 持仓评估：5分钟
    macro: 600000         // 宏观风险：10分钟
  }
};

// 导出可响应式的配置
import { reactive } from 'vue';

export const appConfig = reactive({
  windowDays: globalConfig.windowDays
});

// 更新window_days的方法
export function updateWindowDays(days: number) {
  if (days >= 1 && days <= 365) {
    appConfig.windowDays = days;
    return true;
  }
  return false;
}
