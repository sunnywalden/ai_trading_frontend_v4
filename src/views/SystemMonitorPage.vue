<template>
  <div class="page-container">
    <section class="section-header">
      <div>
        <h2>系统监控</h2>
        <p>服务健康、交易生命周期、主数据流、API 配额与任务执行的一站式作战视图</p>
      </div>
      <button class="refresh-button" @click="onRefreshAll" :disabled="isRefreshing">
        {{ isRefreshing ? '刷新中...' : '🔄 刷新' }}
      </button>
    </section>

    <div class="tab-bar">
      <button :class="['tab-btn', { active: tab === 'health' }]" @click="tab = 'health'">🩺 服务健康</button>
      <button :class="['tab-btn', { active: tab === 'lifecycle' }]" @click="tab = 'lifecycle'">🧬 生命周期</button>
      <button :class="['tab-btn', { active: tab === 'data-flow' }]" @click="tab = 'data-flow'">🔀 数据流</button>
      <button :class="['tab-btn', { active: tab === 'api' }]" @click="tab = 'api'">📡 API 监控</button>
      <button :class="['tab-btn', { active: tab === 'tasks' }]" @click="tab = 'tasks'">📋 任务管理</button>
      <button :class="['tab-btn', { active: tab === 'live-safety' }]" @click="tab = 'live-safety'">🛡️ AI 安全</button>
    </div>

    <section v-if="summaryItems.length" class="summary-strip">
      <article v-for="item in summaryItems" :key="item.label" class="summary-card">
        <div class="summary-label">{{ item.label }}</div>
        <div class="summary-value">{{ item.value }}</div>
        <div class="summary-sub">{{ item.sub }}</div>
      </article>
    </section>

    <div v-if="tab === 'health'" class="tab-content">
      <p v-if="healthError" class="error-message">{{ healthError }}</p>
      <SystemHealthCard
        v-else
        :status="healthStatus"
        :monitoring-enabled="monitoringEnabled"
        :last-updated="lastUpdated"
        @retry="loadHealth"
      />

      <section class="monitor-section">
        <div class="sub-header">
          <h3 class="section-title">🔌 WebSocket 连接状态</h3>
          <span class="meta-chip" :class="wsStore.connected ? 'status-healthy' : 'status-critical'">
            {{ wsStore.connected ? 'LIVE' : 'DISCONNECTED' }}
          </span>
        </div>
        <div class="ws-status-bar" :class="wsStore.connected ? 'ws-ok' : 'ws-err'">
          <span class="ws-dot"></span>
          <span v-if="wsStore.connected">已连接，实时推送正常</span>
          <span v-else>
            已断线
            <template v-if="wsStore.reconnectAttempt > 0">
              · 第 {{ wsStore.reconnectAttempt }} 次重连
              <template v-if="wsStore.nextReconnectInMs > 0">（{{ (wsStore.nextReconnectInMs / 1000).toFixed(0) }}s 后）</template>
            </template>
          </span>
        </div>
      </section>

      <section class="monitor-section">
        <div class="sub-header">
          <h3 class="section-title">🤖 自主循环健康检查</h3>
          <span v-if="autonomyHealth" class="meta-chip" :class="statusClass(normalizeAutonomyStatus(autonomyHealth.overall_status))">
            {{ autonomyHealth.overall_status }}
          </span>
        </div>
        <div v-if="autonomyHealthLoading" class="loading-message">正在加载健康检查结果...</div>
        <div v-else-if="autonomyHealth" class="health-checks-grid">
          <article
            v-for="check in autonomyHealth.checks"
            :key="check.name"
            class="health-check-card"
            :class="statusClass(normalizeAutonomyStatus(check.status))"
          >
            <div class="check-name">{{ check.name }}</div>
            <div class="check-status-badge">{{ check.status }}</div>
            <div class="check-message">{{ check.message }}</div>
          </article>
        </div>
        <div v-else class="info-message">暂无健康检查数据（Job Watchdog 尚未回传最新快照）</div>
      </section>

      <section class="monitor-section">
        <div class="sub-header">
          <h3 class="section-title">🧩 模块与细粒度服务状态</h3>
          <span v-if="serviceOverview" class="meta-chip">{{ serviceOverview.modules.length }} 个模块</span>
        </div>
        <div v-if="serviceLoading" class="loading-message">正在加载模块树状态...</div>
        <p v-else-if="serviceError" class="error-message">{{ serviceError }}</p>
        <template v-else-if="serviceOverview">
          <div class="module-grid">
            <article v-for="module in serviceOverview.modules" :key="module.module_key" class="module-card">
              <div class="module-head">
                <div>
                  <div class="module-title">{{ module.module_label }}</div>
                  <div class="module-sub">{{ module.total_services }} 个服务 · 24h 错误 {{ module.error_count_24h }}</div>
                </div>
                <span class="status-pill" :class="statusClass(module.status)">{{ module.status }}</span>
              </div>
              <div class="module-metrics">
                <span>Healthy {{ module.healthy_count }}</span>
                <span>Warn {{ module.warn_count }}</span>
                <span>Critical {{ module.critical_count }}</span>
                <span>降级 {{ module.degraded_count }}</span>
              </div>
            </article>
          </div>

          <div class="table-card">
            <table class="data-table clickable-table">
              <thead>
                <tr>
                  <th>服务</th>
                  <th>模块</th>
                  <th>状态</th>
                  <th>延迟</th>
                  <th>24h 错误</th>
                  <th>降级</th>
                  <th>最近恢复</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="service in serviceOverview.services"
                  :key="service.service_key"
                  :class="{ selected: selectedServiceDetail?.service.service_key === service.service_key }"
                  @click="openServiceDetail(service.service_key)"
                >
                  <td>
                    <div class="primary-cell">{{ service.service_label }}</div>
                    <div class="secondary-cell">{{ service.service_kind }}</div>
                  </td>
                  <td>{{ moduleLabel(service.module_key) }}</td>
                  <td><span class="status-pill" :class="statusClass(service.status)">{{ service.status }}</span></td>
                  <td>{{ formatLatency(service.p95_latency_ms ?? service.latency_ms) }}</td>
                  <td>{{ service.error_count_24h }}</td>
                  <td>{{ service.degraded ? '是' : '否' }}</td>
                  <td>{{ formatDateTime(service.last_recovered_at) }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <section v-if="selectedServiceDetail" class="detail-panel">
            <div class="detail-header">
              <div>
                <h4>{{ selectedServiceDetail.service.service_label }}</h4>
                <p>{{ selectedServiceDetail.service.last_error_message || '最近未发现新的异常事件。' }}</p>
              </div>
              <span class="status-pill" :class="statusClass(selectedServiceDetail.service.status)">
                {{ selectedServiceDetail.service.status }}
              </span>
            </div>
            <div class="detail-grid two-col">
              <div class="detail-card">
                <div class="detail-card-title">依赖与责任域</div>
                <ul class="detail-list">
                  <li><strong>Dependencies：</strong>{{ joinList(selectedServiceDetail.service.dependencies) }}</li>
                  <li><strong>Owners：</strong>{{ joinList(selectedServiceDetail.service.owners) }}</li>
                  <li><strong>Tags：</strong>{{ joinList(selectedServiceDetail.service.tags) }}</li>
                </ul>
              </div>
              <div class="detail-card">
                <div class="detail-card-title">最近状态时间线</div>
                <ul class="timeline-list compact">
                  <li v-for="event in selectedServiceDetail.timeline" :key="`${selectedServiceDetail.service.service_key}-${event.occurred_at}`">
                    <span class="timeline-time">{{ formatDateTime(event.occurred_at) }}</span>
                    <span class="status-pill small" :class="statusClass(event.status)">{{ event.status }}</span>
                    <span class="timeline-text">{{ event.message || '状态更新' }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>
        </template>
      </section>
    </div>

    <div v-if="tab === 'lifecycle'" class="tab-content">
      <section class="monitor-section">
        <div class="sub-header wrap">
          <div>
            <h3 class="section-title">🧬 交易生命周期监测</h3>
            <p class="section-desc">17 阶段流水线、Plan/Position FSM 分布、异常跳转与 stuck intents。</p>
          </div>
          <div class="toolbar-inline">
            <select v-model="lifecycleWindow" class="time-range-select" @change="loadLifecycleOverview">
              <option :value="60">最近 1h</option>
              <option :value="180">最近 3h</option>
              <option :value="720">最近 12h</option>
              <option :value="1440">最近 24h</option>
            </select>
            <label class="toggle-inline">
              <input v-model="lifecycleOnlyExceptions" type="checkbox" @change="loadLifecycleOverview" />
              仅异常
            </label>
          </div>
        </div>

        <div v-if="lifecycleLoading" class="loading-message">正在加载生命周期视图...</div>
        <p v-else-if="lifecycleError" class="error-message">{{ lifecycleError }}</p>
        <template v-else-if="lifecycleOverview">
          <div class="headline-grid">
            <article class="headline-card">
              <div class="headline-label">活跃 intents</div>
              <div class="headline-value">{{ lifecycleOverview.headline.active_intents }}</div>
            </article>
            <article class="headline-card warn">
              <div class="headline-label">stuck intents</div>
              <div class="headline-value">{{ lifecycleOverview.headline.stuck_intents }}</div>
            </article>
            <article class="headline-card critical">
              <div class="headline-label">异常跳转</div>
              <div class="headline-value">{{ lifecycleOverview.headline.exception_count }}</div>
            </article>
            <article class="headline-card">
              <div class="headline-label">P95 阶段耗时</div>
              <div class="headline-value">{{ lifecycleOverview.headline.p95_stage_seconds.toFixed(0) }}s</div>
            </article>
            <!-- V10.4.4 Position-centric metrics -->
            <article class="headline-card pos-active">
              <div class="headline-label">活跃仓位</div>
              <div class="headline-value">{{ lifecycleOverview.headline.active_positions ?? 0 }}</div>
            </article>
            <article class="headline-card pos-exception">
              <div class="headline-label">异常仓位</div>
              <div class="headline-value">{{ lifecycleOverview.headline.exception_positions ?? 0 }}</div>
            </article>
            <article class="headline-card pos-stuck">
              <div class="headline-label">卡单切片</div>
              <div class="headline-value">{{ lifecycleOverview.headline.stuck_slices ?? 0 }}</div>
            </article>
          </div>

          <div class="pipeline-grid">
            <article
              v-for="stage in lifecycleOverview.pipeline"
              :key="stage.stage_id"
              class="pipeline-stage-card"
              :class="pipelineStageTone(stage)"
            >
              <div class="pipeline-stage-top">
                <span class="pipeline-stage-index">{{ stage.stage_id }}</span>
                <span class="pipeline-stage-name">{{ stage.stage_label }}</span>
              </div>
              <div class="pipeline-stage-main">{{ stage.active_count }} 笔</div>
              <div class="pipeline-stage-sub">P95 {{ formatDuration(stage.p95_seconds) }}</div>
              <div class="pipeline-stage-flags">
                <span>Warn {{ stage.warn_count }}</span>
                <span>Critical {{ stage.critical_count }}</span>
                <span>Stuck {{ stage.stuck_count }}</span>
              </div>
            </article>
          </div>

          <div class="detail-grid two-col">
            <div class="detail-card">
              <div class="detail-card-title">Plan FSM 分布</div>
              <div class="fsm-list">
                <div v-for="item in lifecycleOverview.plan_fsm" :key="item.state_key" class="fsm-row">
                  <span>{{ item.state_label }}</span>
                  <span class="fsm-right">
                    <span class="status-pill small" :class="statusClass(item.status)">{{ item.status }}</span>
                    <strong>{{ item.count }}</strong>
                  </span>
                </div>
              </div>
            </div>
            <div class="detail-card">
              <div class="detail-card-title">Position FSM 分布</div>
              <div class="fsm-list">
                <div v-for="item in lifecycleOverview.position_fsm" :key="item.state_key" class="fsm-row">
                  <span>{{ item.state_label }}</span>
                  <span class="fsm-right">
                    <span class="status-pill small" :class="statusClass(item.status)">{{ item.status }}</span>
                    <strong>{{ item.count }}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="table-card">
            <div class="table-title">异常列表</div>
            <table class="data-table clickable-table">
              <thead>
                <tr>
                  <th>Intent</th>
                  <th>标的</th>
                  <th>当前阶段</th>
                  <th>停留时长</th>
                  <th>最近错误</th>
                  <th>责任服务</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="item in lifecycleOverview.exceptions"
                  :key="item.intent_id"
                  :class="{ selected: selectedLifecycleDetail?.intent_id === item.intent_id }"
                  @click="openLifecycleDetail(item.intent_id)"
                >
                  <td>#{{ item.intent_id }}</td>
                  <td>{{ item.symbol || '-' }}</td>
                  <td>
                    <div class="primary-cell">{{ item.current_stage_label || '-' }}</div>
                    <div class="secondary-cell">{{ item.execution_path || '-' }}</div>
                  </td>
                  <td>{{ formatDuration(item.stayed_seconds) }}</td>
                  <td>{{ item.last_error_message || '-' }}</td>
                  <td>{{ item.owner_service || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <section v-if="selectedLifecycleDetail" class="detail-panel">
            <div class="detail-header">
              <div>
                <h4>Intent #{{ selectedLifecycleDetail.intent_id }} · {{ selectedLifecycleDetail.symbol || '-' }}</h4>
                <p>
                  {{ selectedLifecycleDetail.current_stage_label || '-' }} ·
                  {{ selectedLifecycleDetail.execution_path || 'UNKNOWN' }} ·
                  {{ selectedLifecycleDetail.plan_fsm_state || 'N/A' }}
                </p>
              </div>
              <span class="meta-chip">{{ selectedLifecycleDetail.autonomy_level || 'UNKNOWN' }}</span>
            </div>
            <div class="detail-grid two-col">
              <div class="detail-card">
                <div class="detail-card-title">阶段轨迹</div>
                <ul class="timeline-list">
                  <li v-for="event in selectedLifecycleDetail.timeline" :key="`${selectedLifecycleDetail.intent_id}-${event.seq}`">
                    <span class="timeline-time">{{ event.stage_label }}</span>
                    <span class="timeline-text">{{ formatDateTime(event.entered_at) }} → {{ formatDateTime(event.exited_at) }}</span>
                    <span class="timeline-duration">{{ formatDuration(event.duration_seconds) }}</span>
                  </li>
                </ul>
              </div>
              <div class="detail-card">
                <div class="detail-card-title">最近异常</div>
                <ul v-if="selectedLifecycleDetail.latest_errors.length" class="detail-list">
                  <li v-for="error in selectedLifecycleDetail.latest_errors" :key="`${selectedLifecycleDetail.intent_id}-${error.last_error_code}`">
                    <strong>{{ error.last_error_code || 'UNKNOWN' }}</strong>
                    <span>{{ error.last_error_message || '-' }}</span>
                  </li>
                </ul>
                <div v-else class="empty-inline">最近没有额外错误事件。</div>
              </div>
            </div>
          </section>
        </template>
      </section>
    </div>

    <div v-if="tab === 'data-flow'" class="tab-content">
      <section class="monitor-section">
        <div class="sub-header wrap">
          <div>
            <h3 class="section-title">🔀 主数据流链路监测</h3>
            <p class="section-desc">覆盖 DataHub → Signal → Decision → Risk → Execution → Attribution / Post-Mortem。</p>
          </div>
          <select v-model="dataFlowWindow" class="time-range-select" @change="loadDataFlowOverview">
            <option :value="60">最近 1h</option>
            <option :value="180">最近 3h</option>
            <option :value="720">最近 12h</option>
            <option :value="1440">最近 24h</option>
          </select>
        </div>

        <div v-if="dataFlowLoading" class="loading-message">正在加载数据流状态...</div>
        <p v-else-if="dataFlowError" class="error-message">{{ dataFlowError }}</p>
        <template v-else-if="dataFlowOverview">
          <div class="flow-grid">
            <article
              v-for="flow in dataFlowOverview.flows"
              :key="flow.flow_name"
              class="flow-card"
              :class="{ active: selectedFlowDetail?.flow_name === flow.flow_name }"
              @click="openFlowDetail(flow.flow_name)"
            >
              <div class="flow-head">
                <div>
                  <div class="module-title">{{ flow.flow_label }}</div>
                  <div class="module-sub">{{ flow.total_nodes }} 节点 · avg lag {{ formatDuration(flow.avg_lag_seconds) }}</div>
                </div>
                <span class="status-pill" :class="statusClass(flow.status)">{{ flow.status }}</span>
              </div>
              <div class="flow-arrow-row">
                <span v-for="node in flow.nodes.slice(0, 5)" :key="`${flow.flow_name}-${node.node_key}`">
                  {{ node.node_label }}
                </span>
              </div>
              <div class="module-metrics">
                <span>Warn {{ flow.warn_nodes }}</span>
                <span>Critical {{ flow.critical_nodes }}</span>
                <span>Trend {{ flow.trend }}</span>
              </div>
            </article>
          </div>

          <section v-if="selectedFlowDetail" class="detail-panel">
            <div class="detail-header">
              <div>
                <h4>{{ selectedFlowDetail.flow_label }}</h4>
                <p>当前状态 {{ selectedFlowDetail.status }}，最近失败样本 {{ selectedFlowDetail.failures.length }} 条。</p>
              </div>
              <span class="status-pill" :class="statusClass(selectedFlowDetail.status)">{{ selectedFlowDetail.status }}</span>
            </div>

            <div class="detail-grid two-col">
              <div class="detail-card">
                <div class="detail-card-title">节点详情</div>
                <table class="data-table compact-table">
                  <thead>
                    <tr>
                      <th>节点</th>
                      <th>状态</th>
                      <th>lag</th>
                      <th>queue</th>
                      <th>最近成功</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="node in selectedFlowDetail.nodes" :key="node.node_key">
                      <td>{{ node.node_label }}</td>
                      <td><span class="status-pill small" :class="statusClass(node.status)">{{ node.status }}</span></td>
                      <td>{{ formatDuration(node.lag_seconds) }}</td>
                      <td>{{ node.queue_depth ?? '-' }}</td>
                      <td>{{ formatDateTime(node.last_success_at) }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div class="detail-card">
                <div class="detail-card-title">最近失败样本</div>
                <ul v-if="selectedFlowDetail.failures.length" class="detail-list">
                  <li v-for="failure in selectedFlowDetail.failures" :key="failure.sample_id">
                    <strong>{{ failure.error_code || 'UNKNOWN' }}</strong>
                    <span>{{ failure.error_message || '-' }}</span>
                    <small>{{ formatDateTime(failure.occurred_at) }}</small>
                  </li>
                </ul>
                <div v-else class="empty-inline">最近没有失败样本，链路像咖啡机一样安静。</div>
              </div>
            </div>
          </section>
        </template>
      </section>
    </div>

    <div v-if="tab === 'api'" class="tab-content">
      <p v-if="loadingApi && !report" class="loading-message">正在加载监控数据...</p>
      <p v-else-if="apiError" class="error-message">{{ apiError }}</p>

      <template v-else-if="report">
        <HealthStatusBar
          :summary="report.summary"
          :generated-at="report.generated_at"
          :monitoring-enabled="monitoringEnabled"
        />

        <section class="monitor-section">
          <div class="sub-header">
            <h3 class="section-title">API 提供商状态</h3>
            <select v-model="timeRange" class="time-range-select" @change="loadStats">
              <option value="day">日统计</option>
              <option value="hour">时统计</option>
              <option value="minute">分统计</option>
            </select>
          </div>
          <div class="providers-grid">
            <ApiProviderCard
              v-for="stats in providerStats?.length ? providerStats : report.daily_stats"
              :key="stats.provider"
              :stats="stats"
              :policy="report.rate_limit_policies[stats.provider] || {}"
            />
          </div>
        </section>

        <section class="monitor-section">
          <AlertsPanel
            :critical-alerts="report.critical_alerts"
            :warnings="report.warnings"
            :recent-errors="report.recent_errors"
          />
        </section>

        <section class="monitor-section">
          <div class="sub-header">
            <h3 class="section-title">🤖 LLM 调用统计</h3>
            <select v-model="llmHours" class="time-range-select" @change="loadLlmStats">
              <option :value="6">近 6h</option>
              <option :value="24">近 24h</option>
              <option :value="72">近 72h</option>
              <option :value="168">近 7d</option>
            </select>
          </div>
          <div v-if="llmStats" class="llm-stats-body">
            <div class="llm-kpi-row">
              <div class="llm-kpi">
                <div class="llm-kpi-label">总调用</div>
                <div class="llm-kpi-value">{{ llmStats.total }}</div>
              </div>
              <div class="llm-kpi">
                <div class="llm-kpi-label">成功率</div>
                <div class="llm-kpi-value" :class="llmStats.total ? (llmStats.success / llmStats.total >= 0.95 ? 'ok' : 'warn') : ''">
                  {{ llmStats.total ? ((llmStats.success / llmStats.total) * 100).toFixed(1) + '%' : '-' }}
                </div>
              </div>
              <div class="llm-kpi">
                <div class="llm-kpi-label">超时</div>
                <div class="llm-kpi-value" :class="llmStats.timeout > 0 ? 'warn' : ''">{{ llmStats.timeout }}</div>
              </div>
              <div class="llm-kpi">
                <div class="llm-kpi-label">错误</div>
                <div class="llm-kpi-value" :class="llmStats.error > 0 ? 'err' : ''">{{ llmStats.error }}</div>
              </div>
              <div class="llm-kpi">
                <div class="llm-kpi-label">降级</div>
                <div class="llm-kpi-value" :class="llmStats.degraded > 0 ? 'warn' : ''">{{ llmStats.degraded }}</div>
              </div>
              <div class="llm-kpi">
                <div class="llm-kpi-label">P50 延迟</div>
                <div class="llm-kpi-value">{{ llmStats.p50_latency_ms != null ? llmStats.p50_latency_ms + 'ms' : '-' }}</div>
              </div>
              <div class="llm-kpi">
                <div class="llm-kpi-label">P95 延迟</div>
                <div class="llm-kpi-value" :class="llmStats.p95_latency_ms != null && llmStats.p95_latency_ms > 5000 ? 'warn' : ''">
                  {{ llmStats.p95_latency_ms != null ? llmStats.p95_latency_ms + 'ms' : '-' }}
                </div>
              </div>
            </div>
            <div v-if="llmStats.total === 0" class="llm-empty">⏳ 暂无 LLM 调用记录（近 {{ llmHours }}h）。</div>
            <div v-else-if="llmStats.by_model?.length" class="llm-breakdown">
              <div class="llm-breakdown-title">按模型分布</div>
              <div class="llm-model-row" v-for="m in llmStats.by_model" :key="m.model">
                <span class="llm-model-name">{{ m.model }}</span>
                <div class="llm-model-bar-wrap">
                  <div class="llm-model-bar" :style="{ width: (m.count / llmStats.total * 100).toFixed(1) + '%' }"></div>
                </div>
                <span class="llm-model-count">{{ m.count }}</span>
              </div>
            </div>
          </div>
          <div v-else class="llm-loading">加载中...</div>
        </section>
      </template>

      <p v-else class="info-message">暂无监控数据</p>
    </div>

    <div v-if="tab === 'tasks'" class="tab-content">
      <TaskManagementPage />
    </div>

    <!-- V10.5.1: AI 安全 Tab -->
    <div v-if="tab === 'live-safety'" class="tab-content">
      <section class="monitor-section">
        <div class="sub-header">
          <h3 class="section-title">🛡️ 自主度节流状态</h3>
          <span v-if="lsThrottle" class="meta-chip"
            :class="lsThrottle.recommended_level === 'FULL' ? 'status-healthy'
              : lsThrottle.recommended_level === 'SEMI' ? 'status-warn'
              : 'status-critical'">
            {{ lsThrottle.recommended_level }}
          </span>
          <router-link to="/live-safety" class="see-all-link">完整看板 →</router-link>
        </div>
        <div v-if="lsLoading" class="loading-message">加载中...</div>
        <template v-else-if="lsThrottle">
          <div class="headline-grid" style="margin-bottom:12px">
            <article class="headline-card" :class="lsThrottle.downgrade_needed ? 'critical' : ''">
              <div class="headline-label">建议级别</div>
              <div class="headline-value">{{ lsThrottle.recommended_level }}</div>
            </article>
            <article class="headline-card" :class="lsThrottle.downgrade_needed ? 'warn' : ''">
              <div class="headline-label">需要降级</div>
              <div class="headline-value">{{ lsThrottle.downgrade_needed ? '是' : '否' }}</div>
            </article>
            <article class="headline-card">
              <div class="headline-label">可以升级</div>
              <div class="headline-value">{{ lsThrottle.upgrade_possible ? '是' : '否' }}</div>
            </article>
          </div>
          <div v-if="lsThrottle.reasons?.length" class="detail-card" style="margin-bottom:16px">
            <div class="detail-card-title">触发原因</div>
            <ul class="detail-list">
              <li v-for="r in lsThrottle.reasons" :key="r">{{ r }}</li>
            </ul>
          </div>
        </template>
        <div v-else class="info-message">暂无节流数据</div>
      </section>

      <section class="monitor-section">
        <div class="sub-header">
          <h3 class="section-title">📉 模型退化监控</h3>
          <span v-if="lsDegradation" class="meta-chip"
            :class="lsDegradation.overall_severity === 'OK' ? 'status-healthy'
              : lsDegradation.overall_severity === 'WARNING' ? 'status-warn'
              : 'status-critical'">
            {{ lsDegradation.overall_severity }}
          </span>
        </div>
        <div v-if="lsLoading" class="loading-message">加载中...</div>
        <template v-else-if="lsDegradation">
          <div class="module-grid">
            <article
              v-for="m in lsDegradation.metrics"
              :key="m.metric_name"
              class="module-card"
              :class="m.severity === 'OK' ? 'tone-healthy' : m.severity === 'WARNING' ? 'tone-warn' : 'tone-critical'"
            >
              <div class="module-head">
                <div>
                  <div class="module-title">{{ m.metric_name }}</div>
                  <div class="module-sub">当前 {{ m.current_value?.toFixed(3) ?? '—' }} / 基准 {{ m.baseline_value?.toFixed(3) ?? '—' }}</div>
                </div>
                <span class="status-pill" :class="statusClass(m.severity)">{{ m.severity }}</span>
              </div>
              <div class="module-metrics">
                <span>漂移 {{ m.drift?.toFixed(3) ?? '—' }}</span>
                <span>方向 {{ m.drift_direction ?? '—' }}</span>
              </div>
            </article>
          </div>
        </template>
        <div v-else class="info-message">暂无退化数据</div>
      </section>

      <section class="monitor-section">
        <div class="sub-header">
          <h3 class="section-title">⏱ 数据陈旧矩阵</h3>
          <span v-if="lsFreshness?.freeze_new_open" class="meta-chip status-critical">FREEZE NEW OPEN</span>
        </div>
        <div v-if="lsLoading" class="loading-message">加载中...</div>
        <template v-else-if="lsFreshness">
          <div class="table-card">
            <table class="data-table">
              <thead>
                <tr>
                  <th>数据源</th>
                  <th>最近更新</th>
                  <th>当前延迟(h)</th>
                  <th>警戒(h)</th>
                  <th>临界(h)</th>
                  <th>状态</th>
                  <th>触发动作</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="entry in lsFreshness.matrix" :key="entry.source">
                  <td>{{ entry.source }}</td>
                  <td>{{ formatDateTime(entry.last_seen) }}</td>
                  <td :class="entry.status === 'OK' ? '' : entry.status === 'WARNING' ? 'warn-cell' : 'crit-cell'">
                    {{ entry.age_hours?.toFixed(1) ?? '—' }}
                  </td>
                  <td class="dim-cell">{{ entry.warn_threshold_hours }}</td>
                  <td class="dim-cell">{{ entry.crit_threshold_hours }}</td>
                  <td><span class="status-pill small" :class="statusClass(entry.status)">{{ entry.status }}</span></td>
                  <td class="dim-cell">{{ entry.action_on_critical }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </template>
        <div v-else class="info-message">暂无陈旧度数据</div>
      </section>
    </div>

    <div v-if="successMsg" class="success-toast">{{ successMsg }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import {
  fetchAutonomyHealth,
  fetchLlmStats,
  fetchMonitoringHealth,
  fetchMonitoringReport,
  fetchMonitoringStats,
  type ApiStats,
  type AutonomyHealthReport,
  type LlmStats,
  type MonitoringReport,
} from '../api/client';
import { liveSafetyApi, type DegradationReport, type FreshnessMatrix, type ThrottleStatus } from '../api/liveSafetyService'; // V10.5.1
import {
  fetchSystemDataFlowDetail,
  fetchSystemDataFlowOverview,
  fetchSystemLifecycleDetail,
  fetchSystemLifecycleOverview,
  fetchSystemServiceDetail,
  fetchSystemServiceOverview,
} from '../api/systemMonitorService';
import AlertsPanel from '../components/AlertsPanel.vue';
import ApiProviderCard from '../components/ApiProviderCard.vue';
import HealthStatusBar from '../components/HealthStatusBar.vue';
import SystemHealthCard from '../components/SystemHealthCard.vue';
import { useWebSocketStore } from '../stores/websocket';
import type {
  DataFlowDetailResponse,
  DataFlowOverviewResponse,
  LifecycleIntentDetailResponse,
  LifecycleOverviewResponse,
  MonitorStatus,
  ServiceDetailResponse,
  ServiceOverviewResponse,
} from '../types/systemMonitor';
import TaskManagementPage from './TaskManagementPage.vue';

const wsStore = useWebSocketStore()
const tab = ref<'health' | 'lifecycle' | 'data-flow' | 'api' | 'tasks' | 'live-safety'>('health')

const loadingHealth = ref(false)
const healthError = ref('')
const healthStatus = ref('unknown')
const monitoringEnabled = ref(false)
const lastUpdated = ref('-')

const loadingApi = ref(false)
const apiError = ref('')
const report = ref<MonitoringReport | null>(null)
const timeRange = ref<'day' | 'hour' | 'minute'>('day')
const providerStats = ref<ApiStats[] | null>(null)
const successMsg = ref('')

const llmStats = ref<LlmStats | null>(null)
const llmHours = ref(24)

const autonomyHealth = ref<AutonomyHealthReport | null>(null)
const autonomyHealthLoading = ref(false)

const lifecycleLoading = ref(false)
const lifecycleError = ref('')
const lifecycleWindow = ref(60)
const lifecycleOnlyExceptions = ref(false)
const lifecycleOverview = ref<LifecycleOverviewResponse | null>(null)
const selectedLifecycleDetail = ref<LifecycleIntentDetailResponse | null>(null)

const dataFlowLoading = ref(false)
const dataFlowError = ref('')
const dataFlowWindow = ref(60)
const dataFlowOverview = ref<DataFlowOverviewResponse | null>(null)
const selectedFlowDetail = ref<DataFlowDetailResponse | null>(null)

const serviceLoading = ref(false)
const serviceError = ref('')
const serviceOverview = ref<ServiceOverviewResponse | null>(null)
const selectedServiceDetail = ref<ServiceDetailResponse | null>(null)

const isRefreshing = computed(
  () => loadingHealth.value || loadingApi.value || autonomyHealthLoading.value || lifecycleLoading.value || dataFlowLoading.value || serviceLoading.value || lsLoading.value,
)

// V10.5.1 Live Safety data
const lsLoading = ref(false)
const lsThrottle = ref<ThrottleStatus | null>(null)
const lsDegradation = ref<DegradationReport | null>(null)
const lsFreshness = ref<FreshnessMatrix | null>(null)

async function loadLiveSafety() {
  lsLoading.value = true
  try {
    const [tRes, dRes, fRes] = await Promise.all([
      liveSafetyApi.getThrottle('FULL'),
      liveSafetyApi.getDegradation(),
      liveSafetyApi.getFreshness(),
    ])
    lsThrottle.value = tRes.data
    lsDegradation.value = dRes.data
    lsFreshness.value = fRes.data
  } catch { /* silent */ } finally {
    lsLoading.value = false
  }
}

const summaryItems = computed(() => {
  const items: Array<{ label: string; value: string; sub: string }> = []
  if (serviceOverview.value) {
    const critical = serviceOverview.value.services.filter(item => item.status === 'CRITICAL').length
    const degraded = serviceOverview.value.services.filter(item => item.degraded).length
    items.push({ label: '核心模块健康', value: `${serviceOverview.value.modules.length} 模块`, sub: `${critical} critical / ${degraded} degraded` })
  }
  if (lifecycleOverview.value) {
    items.push({ label: '交易生命周期', value: `${lifecycleOverview.value.headline.active_intents} 活跃`, sub: `stuck ${lifecycleOverview.value.headline.stuck_intents}` })
    items.push({ label: '异常跳转', value: `${lifecycleOverview.value.headline.exception_count}`, sub: `P95 ${lifecycleOverview.value.headline.p95_stage_seconds.toFixed(0)}s` })
  }
  if (dataFlowOverview.value) {
    const warnFlows = dataFlowOverview.value.flows.filter(item => item.status !== 'HEALTHY').length
    const maxLag = Math.max(...dataFlowOverview.value.flows.map(item => item.max_lag_seconds ?? 0), 0)
    items.push({ label: '主数据流', value: `${dataFlowOverview.value.flows.length} 条`, sub: `${warnFlows} 条异常 · max lag ${formatDuration(maxLag)}` })
  }
  return items
})

function normalizeAutonomyStatus(status?: string): MonitorStatus {
  const normalized = String(status || '').toUpperCase()
  if (normalized === 'OK') return 'HEALTHY'
  if (normalized === 'ERROR') return 'CRITICAL'
  if (normalized === 'WARN' || normalized === 'CRITICAL') return normalized as MonitorStatus
  return 'UNKNOWN'
}

function statusClass(status?: string): string {
  const normalized = String(status || 'UNKNOWN').toLowerCase()
  return `status-${normalized}`
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

function formatDuration(value?: number | null): string {
  if (value == null) return '-'
  if (value < 1) return `${Math.round(value * 1000)}ms`
  if (value < 60) return `${value.toFixed(value >= 10 ? 0 : 1)}s`
  const mins = Math.floor(value / 60)
  const secs = Math.round(value % 60)
  return `${mins}m ${secs}s`
}

function formatLatency(value?: number | null): string {
  if (value == null) return '-'
  return `${Math.round(value)}ms`
}

function joinList(items: string[]): string {
  return items.length ? items.join(' / ') : '-'
}

function moduleLabel(moduleKey: string): string {
  return serviceOverview.value?.modules.find(item => item.module_key === moduleKey)?.module_label || moduleKey
}

function pipelineStageTone(stage: LifecycleOverviewResponse['pipeline'][number]): string {
  if (stage.critical_count > 0 || stage.stuck_count > 0) return 'tone-critical'
  if (stage.warn_count > 0) return 'tone-warn'
  return 'tone-healthy'
}

async function loadHealth() {
  loadingHealth.value = true
  healthError.value = ''
  try {
    const health = await fetchMonitoringHealth()
    healthStatus.value = health.status || 'unknown'
    monitoringEnabled.value = !!(health.monitoring_active ?? health.monitoring_enabled ?? health.redis_enabled)
    lastUpdated.value = health.last_updated || health.timestamp || new Date().toISOString()
  } catch (e: any) {
    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      healthError.value = '⏱️ 请求超时，请稍后再试！'
    } else if (e.code === 'ERR_NETWORK' || e.message?.includes('Network Error')) {
      healthError.value = '🌐 网络连接失败，请检查后端服务状态'
    } else {
      healthError.value = '❌ 获取系统健康失败'
    }
  } finally {
    loadingHealth.value = false
  }
}

async function loadLlmStats() {
  try {
    llmStats.value = await fetchLlmStats(llmHours.value)
  } catch {
    llmStats.value = {
      window_hours: llmHours.value,
      since: '',
      total: 0,
      success: 0,
      timeout: 0,
      rate_limited: 0,
      error: 0,
      degraded: 0,
      error_rate_pct: 0,
      avg_latency_ms: null,
      p50_latency_ms: null,
      p95_latency_ms: null,
      by_model: [],
      by_caller: [],
    }
  }
}

async function loadAutonomyHealth() {
  autonomyHealthLoading.value = true
  try {
    autonomyHealth.value = await fetchAutonomyHealth()
  } catch {
    autonomyHealth.value = null
  } finally {
    autonomyHealthLoading.value = false
  }
}

async function loadMonitoringData() {
  loadingApi.value = true
  apiError.value = ''
  try {
    report.value = await fetchMonitoringReport()
    await Promise.all([loadStats(), loadLlmStats()])
  } catch (e: any) {
    if (e.code === 'ECONNABORTED' || e.message?.includes('timeout')) {
      apiError.value = '⏱️ 请求超时，请稍后再试！'
    } else if (e.code === 'ERR_NETWORK' || e.message?.includes('Network Error')) {
      apiError.value = '🌐 网络连接失败，请检查后端服务状态'
    } else {
      apiError.value = '❌ 获取监控数据失败'
    }
  } finally {
    loadingApi.value = false
  }
}

async function loadStats() {
  try {
    providerStats.value = await fetchMonitoringStats(timeRange.value)
  } catch {
    providerStats.value = null
  }
}

async function loadLifecycleOverview() {
  lifecycleLoading.value = true
  lifecycleError.value = ''
  try {
    lifecycleOverview.value = await fetchSystemLifecycleOverview({
      window_minutes: lifecycleWindow.value,
      only_exceptions: lifecycleOnlyExceptions.value,
    })
    const firstException = lifecycleOverview.value.exceptions[0]
    if (firstException) {
      await openLifecycleDetail(firstException.intent_id)
    } else {
      selectedLifecycleDetail.value = null
    }
  } catch (e: any) {
    lifecycleError.value = e?.message || '❌ 获取生命周期监控失败'
  } finally {
    lifecycleLoading.value = false
  }
}

async function openLifecycleDetail(intentId: number) {
  try {
    selectedLifecycleDetail.value = await fetchSystemLifecycleDetail(intentId)
  } catch (e: any) {
    lifecycleError.value = e?.message || '❌ 获取 intent 详情失败'
  }
}

async function loadDataFlowOverview() {
  dataFlowLoading.value = true
  dataFlowError.value = ''
  try {
    dataFlowOverview.value = await fetchSystemDataFlowOverview({ window_minutes: dataFlowWindow.value })
    const firstFlow = dataFlowOverview.value.flows[0]
    if (firstFlow) {
      await openFlowDetail(firstFlow.flow_name)
    } else {
      selectedFlowDetail.value = null
    }
  } catch (e: any) {
    dataFlowError.value = e?.message || '❌ 获取数据流监控失败'
  } finally {
    dataFlowLoading.value = false
  }
}

async function openFlowDetail(flowName: string) {
  try {
    selectedFlowDetail.value = await fetchSystemDataFlowDetail(flowName)
  } catch (e: any) {
    dataFlowError.value = e?.message || '❌ 获取数据流详情失败'
  }
}

async function loadServiceOverview() {
  serviceLoading.value = true
  serviceError.value = ''
  try {
    serviceOverview.value = await fetchSystemServiceOverview({ window_minutes: lifecycleWindow.value })
    const firstService = serviceOverview.value.services[0]
    if (firstService) {
      await openServiceDetail(firstService.service_key)
    } else {
      selectedServiceDetail.value = null
    }
  } catch (e: any) {
    serviceError.value = e?.message || '❌ 获取服务状态失败'
  } finally {
    serviceLoading.value = false
  }
}

async function openServiceDetail(serviceName: string) {
  try {
    selectedServiceDetail.value = await fetchSystemServiceDetail(serviceName)
  } catch (e: any) {
    serviceError.value = e?.message || '❌ 获取服务详情失败'
  }
}

async function onRefreshAll() {
  await Promise.all([
    loadHealth(),
    loadAutonomyHealth(),
    loadMonitoringData(),
    loadLifecycleOverview(),
    loadDataFlowOverview(),
    loadServiceOverview(),
    loadLiveSafety(),
  ])
  successMsg.value = '✅ 刷新成功'
  setTimeout(() => {
    successMsg.value = ''
  }, 2000)
}

onMounted(() => {
  loadHealth()
  loadAutonomyHealth()
  loadMonitoringData()
  loadLifecycleOverview()
  loadDataFlowOverview()
  loadServiceOverview()
  loadLiveSafety()  // V10.5.1
})
</script>

<style scoped>
.page-container {
  padding: 20px;
  max-width: 1600px;
  margin: 0 auto;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0 0 6px;
  font-size: 1.5rem;
  color: #e5e7eb;
}

.section-header p,
.section-desc {
  margin: 0;
  font-size: 0.9rem;
  color: #9ca3af;
}

.tab-bar {
  display: flex;
  gap: 4px;
  margin-bottom: 20px;
  background: rgba(31, 41, 55, 0.5);
  border-radius: 10px;
  padding: 4px;
  flex-wrap: wrap;
}

.tab-btn {
  flex: 1;
  min-width: 120px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: #e5e7eb;
}

.tab-btn.active {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  font-weight: 600;
}

.summary-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.summary-card,
.monitor-section,
.flow-card,
.module-card,
.headline-card,
.pipeline-stage-card,
.detail-card,
.table-card {
  background: rgba(17, 24, 39, 0.74);
  border: 1px solid rgba(55, 65, 81, 0.7);
  border-radius: 14px;
}

.summary-card {
  padding: 16px 18px;
}

.summary-label,
.module-sub,
.secondary-cell,
.llm-kpi-label,
.check-name {
  color: #9ca3af;
  font-size: 0.78rem;
}

.summary-value,
.headline-value {
  margin-top: 6px;
  color: #f9fafb;
  font-size: 1.5rem;
  font-weight: 700;
}

.summary-sub {
  margin-top: 4px;
  color: #cbd5e1;
  font-size: 0.85rem;
}

.monitor-section {
  padding: 20px;
}

.sub-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.sub-header.wrap {
  flex-wrap: wrap;
}

.section-title {
  margin: 0;
  color: #e5e7eb;
  font-size: 1.15rem;
  font-weight: 600;
}

.toolbar-inline {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.toggle-inline {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #d1d5db;
}

.refresh-button,
.time-range-select {
  border-radius: 8px;
  font-size: 0.9rem;
}

.refresh-button {
  padding: 10px 20px;
  background: linear-gradient(135deg, #38bdf8, #0ea5e9);
  border: 1px solid rgba(56, 189, 248, 0.5);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.refresh-button:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(56, 189, 248, 0.4);
}

.refresh-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.time-range-select {
  padding: 8px 14px;
  background: rgba(31, 41, 55, 0.8);
  border: 1px solid rgba(55, 65, 81, 0.8);
  color: #e5e7eb;
  cursor: pointer;
}

.time-range-select:hover {
  border-color: rgba(56, 189, 248, 0.5);
}

.meta-chip,
.status-pill,
.check-status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
}

.status-pill.small {
  padding: 2px 8px;
  font-size: 0.68rem;
}

.status-healthy {
  background: rgba(52, 211, 153, 0.18);
  color: #34d399;
}

.status-warn {
  background: rgba(251, 191, 36, 0.18);
  color: #fbbf24;
}

.status-critical {
  background: rgba(248, 113, 113, 0.18);
  color: #f87171;
}

.status-unknown {
  background: rgba(148, 163, 184, 0.18);
  color: #cbd5e1;
}

.providers-grid,
.module-grid,
.flow-grid,
.headline-grid,
.pipeline-grid,
.health-checks-grid,
.detail-grid {
  display: grid;
  gap: 16px;
}

.providers-grid {
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
}

.module-grid,
.flow-grid,
.headline-grid {
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.pipeline-grid {
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
}

.health-checks-grid {
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
}

.detail-grid.two-col {
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
}

.module-card,
.flow-card,
.headline-card,
.pipeline-stage-card,
.detail-card {
  padding: 16px;
}

.module-head,
.flow-head,
.detail-header,
.pipeline-stage-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.module-title,
.table-title,
.detail-card-title,
.primary-cell {
  color: #f3f4f6;
  font-weight: 600;
}

.module-metrics,
.pipeline-stage-flags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  margin-top: 12px;
  color: #d1d5db;
  font-size: 0.82rem;
}

.flow-card {
  cursor: pointer;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.flow-card.active,
.flow-card:hover {
  border-color: rgba(56, 189, 248, 0.55);
  transform: translateY(-1px);
}

.flow-arrow-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
  color: #93c5fd;
  font-size: 0.82rem;
}

.flow-arrow-row span:not(:last-child)::after {
  content: '→';
  margin-left: 6px;
  color: #64748b;
}

.headline-card.warn {
  border-color: rgba(251, 191, 36, 0.4);
}

.headline-card.critical {
  border-color: rgba(248, 113, 113, 0.45);
}

/* V10.4.4 position headline variants */
.headline-card.pos-active {
  border-color: rgba(52, 211, 153, 0.4);
}
.headline-card.pos-exception {
  border-color: rgba(248, 113, 113, 0.45);
}
.headline-card.pos-stuck {
  border-color: rgba(251, 191, 36, 0.4);
}

.headline-label {
  color: #9ca3af;
  font-size: 0.82rem;
}

.pipeline-stage-card.tone-healthy {
  border-color: rgba(52, 211, 153, 0.35);
}

.pipeline-stage-card.tone-warn {
  border-color: rgba(251, 191, 36, 0.35);
}

.pipeline-stage-card.tone-critical {
  border-color: rgba(248, 113, 113, 0.45);
}

.pipeline-stage-index {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(56, 189, 248, 0.18);
  color: #7dd3fc;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}

.pipeline-stage-name {
  flex: 1;
  color: #e5e7eb;
  font-size: 0.88rem;
  font-weight: 600;
}

.pipeline-stage-main {
  margin-top: 14px;
  font-size: 1.4rem;
  font-weight: 700;
  color: #f9fafb;
}

.pipeline-stage-sub {
  color: #cbd5e1;
  font-size: 0.82rem;
  margin-top: 4px;
}

.fsm-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.fsm-row,
.timeline-list li,
.detail-list li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.fsm-row {
  padding: 10px 0;
  border-bottom: 1px solid rgba(55, 65, 81, 0.45);
  color: #e5e7eb;
}

.fsm-row:last-child {
  border-bottom: none;
}

.fsm-right {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.table-card {
  padding: 16px;
  overflow-x: auto;
}

.table-title {
  margin-bottom: 12px;
  font-size: 0.95rem;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  color: #e5e7eb;
  font-size: 0.88rem;
}

.data-table th,
.data-table td {
  padding: 12px 10px;
  border-bottom: 1px solid rgba(55, 65, 81, 0.45);
  text-align: left;
  vertical-align: top;
}

.data-table th {
  color: #94a3b8;
  font-size: 0.76rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.clickable-table tbody tr {
  cursor: pointer;
  transition: background 0.2s ease;
}

.clickable-table tbody tr:hover,
.clickable-table tbody tr.selected {
  background: rgba(56, 189, 248, 0.08);
}

.compact-table th,
.compact-table td {
  padding: 10px 8px;
}

.detail-panel {
  padding: 18px;
  border: 1px solid rgba(56, 189, 248, 0.28);
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.88);
}

.detail-header h4 {
  margin: 0 0 4px;
  color: #f8fafc;
}

.detail-header p {
  margin: 0;
  color: #9ca3af;
  font-size: 0.88rem;
}

.detail-card-title {
  margin-bottom: 12px;
  font-size: 0.9rem;
}

.detail-list,
.timeline-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.timeline-list.compact {
  gap: 8px;
}

.timeline-time,
.timeline-duration {
  color: #93c5fd;
  font-size: 0.8rem;
  flex-shrink: 0;
}

.timeline-text {
  flex: 1;
  color: #d1d5db;
}

.detail-list li {
  flex-direction: column;
  color: #d1d5db;
  padding: 10px 0;
  border-bottom: 1px solid rgba(55, 65, 81, 0.4);
}

.detail-list li:last-child {
  border-bottom: none;
}

.empty-inline,
.loading-message,
.info-message,
.llm-loading,
.llm-empty {
  color: #9ca3af;
}

.loading-message,
.info-message,
.error-message {
  text-align: center;
  padding: 42px 20px;
  border-radius: 12px;
}

.loading-message,
.info-message {
  background: rgba(31, 41, 55, 0.5);
  border: 1px dashed rgba(107, 114, 128, 0.5);
}

.error-message {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
}

/* V10.5.1 Live Safety tab helpers */
.warn-cell { color: #fcd34d; }
.crit-cell { color: #f87171; font-weight: 600; }
.dim-cell  { color: #64748b; }

.ws-status-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 500;
}

.ws-ok {
  background: rgba(52, 211, 153, 0.12);
  color: #34d399;
  border: 1px solid rgba(52, 211, 153, 0.3);
}

.ws-err {
  background: rgba(248, 113, 113, 0.12);
  color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.3);
}

.ws-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
  background: currentColor;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

.health-check-card {
  border-left: 4px solid transparent;
  padding: 14px 16px;
}

.llm-stats-body {
  margin-top: 12px;
}

.llm-kpi-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 16px 0;
}

.llm-kpi {
  background: rgba(31, 41, 55, 0.8);
  border: 1px solid rgba(55, 65, 81, 0.5);
  border-radius: 10px;
  padding: 14px 20px;
  min-width: 100px;
  flex: 1;
  text-align: center;
}

.llm-kpi-value {
  font-size: 1.4rem;
  font-weight: 700;
  color: #e5e7eb;
}

.llm-kpi-value.ok {
  color: #34d399;
}

.llm-kpi-value.warn {
  color: #fbbf24;
}

.llm-kpi-value.err {
  color: #f87171;
}

.llm-breakdown {
  margin-top: 16px;
}

.llm-breakdown-title {
  font-size: 0.85rem;
  font-weight: 600;
  color: #9ca3af;
  margin-bottom: 10px;
}

.llm-model-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.llm-model-name {
  width: 160px;
  font-size: 0.85rem;
  color: #d1d5db;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
}

.llm-model-bar-wrap {
  flex: 1;
  height: 8px;
  background: rgba(55, 65, 81, 0.6);
  border-radius: 4px;
  overflow: hidden;
}

.llm-model-bar {
  height: 100%;
  background: linear-gradient(90deg, #38bdf8, #0ea5e9);
  border-radius: 4px;
  min-width: 2px;
}

.llm-model-count {
  width: 40px;
  text-align: right;
  font-size: 0.85rem;
  color: #9ca3af;
}

.success-toast {
  position: fixed;
  top: 80px;
  right: 20px;
  padding: 16px 24px;
  background: rgba(34, 197, 94, 0.95);
  color: #fff;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  font-weight: 600;
  z-index: 1000;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@media (max-width: 900px) {
  .page-container {
    padding: 16px;
  }

  .providers-grid,
  .module-grid,
  .flow-grid,
  .headline-grid,
  .pipeline-grid,
  .detail-grid.two-col {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
