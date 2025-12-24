<template>
  <div class="card">
    <div class="header">
      <h2>Greeks 风险水位</h2>
      <span class="equity">账户权益约 {{ exposure.equity_usd.toFixed(0) }} USD</span>
    </div>

    <div class="row">
      <div class="label">
        <span>Delta</span>
        <small>{{ (exposure.delta_pct * 100).toFixed(2) }}% / 权益</small>
      </div>
      <div class="bar">
        <div class="fill delta" :style="{ width: clampPct(Math.abs(exposure.delta_pct) * 100) + '%' }"></div>
      </div>
    </div>

    <div class="row">
      <div class="label">
        <span>Gamma</span>
        <small>{{ (exposure.gamma_pct * 100).toFixed(2) }}% / 限额 {{ (limits.max_total_gamma_pct * 100).toFixed(1) }}%</small>
      </div>
      <div class="bar">
        <div
          class="fill"
          :class="gammaClass"
          :style="{ width: clampPct(Math.abs(exposure.gamma_pct) / limits.max_total_gamma_pct * 100) + '%' }"
        ></div>
      </div>
    </div>

    <div class="row">
      <div class="label">
        <span>Vega</span>
        <small>{{ (exposure.vega_pct * 100).toFixed(2) }}% / 限额 {{ (limits.max_total_vega_pct * 100).toFixed(1) }}%</small>
      </div>
      <div class="bar">
        <div
          class="fill"
          :class="vegaClass"
          :style="{ width: clampPct(Math.abs(exposure.vega_pct) / limits.max_total_vega_pct * 100) + '%' }"
        ></div>
      </div>
    </div>

    <div class="row">
      <div class="label">
        <span>Theta</span>
        <small>{{ (exposure.theta_pct * 100).toFixed(2) }}% / 限额 {{ (limits.max_total_theta_pct * 100).toFixed(1) }}%</small>
      </div>
      <div class="bar">
        <div
          class="fill"
          :class="thetaClass"
          :style="{ width: clampPct(Math.abs(exposure.theta_pct) / limits.max_total_theta_pct * 100) + '%' }"
        ></div>
      </div>
    </div>

    <p class="hint">
      进度条越接近 100%，说明当前 Greeks 暴露越接近风险阈值。颜色从绿色 → 橙色 → 红色渐变，对应安全区、关注区和警戒区。
      短到期期权的额外 Gamma / Theta 暴露（short DTE）已纳入风险评分，但此处只展示汇总水位。
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { LimitsView, ExposureView } from "../api/client";

interface Props {
  limits: LimitsView;
  exposure: ExposureView;
}

const props = defineProps<Props>();

function clampPct(v: number): number {
  if (!Number.isFinite(v) || v < 0) return 0;
  if (v > 100) return 100;
  return v;
}

function levelClass(ratio: number): string {
  if (ratio < 0.6) return "safe";
  if (ratio < 0.9) return "warn";
  return "danger";
}

const gammaClass = computed(() => levelClass(Math.abs(props.exposure.gamma_pct) / props.limits.max_total_gamma_pct));
const vegaClass = computed(() => levelClass(Math.abs(props.exposure.vega_pct) / props.limits.max_total_vega_pct));
const thetaClass = computed(() => levelClass(Math.abs(props.exposure.theta_pct) / props.limits.max_total_theta_pct));
</script>

<style scoped>
.card {
  background: rgba(15, 23, 42, 0.9);
  border-radius: 16px;
  padding: 18px 18px 14px;
  border: 1px solid rgba(55, 65, 81, 0.9);
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}
.header h2 {
  margin: 0;
  font-size: 1rem;
}
.equity {
  font-size: 0.8rem;
  color: #9ca3af;
}
.row {
  margin: 8px 0;
}
.label {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #9ca3af;
  margin-bottom: 4px;
}
.bar {
  position: relative;
  height: 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.9);
  overflow: hidden;
  border: 1px solid rgba(55, 65, 81, 0.9);
}
.fill {
  height: 100%;
  border-radius: inherit;
  transition: width 0.3s ease-out;
  background: linear-gradient(90deg, #22c55e, #16a34a);
}
.fill.safe {
  background: linear-gradient(90deg, #22c55e, #16a34a);
}
.fill.warn {
  background: linear-gradient(90deg, #f97316, #ea580c);
}
.fill.danger {
  background: linear-gradient(90deg, #ef4444, #b91c1c);
}
.fill.delta {
  background: linear-gradient(90deg, #38bdf8, #0ea5e9);
}
.hint {
  margin-top: 10px;
  font-size: 0.74rem;
  color: #9ca3af;
  line-height: 1.4;
}
</style>
