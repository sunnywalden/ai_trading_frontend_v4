# AI Trading Frontend V3.2 - 测试验收文档

## 1. 概览

本文档提供 V3.2 版本响应式设计的全面测试和验收标准。

### 1.1 测试目标

- ✅ 确保所有设备类型的用户体验质量
- ✅ 验证关键交互功能在移动端的可用性
- ✅ 确认性能指标满足目标要求
- ✅ 保证可访问性标准合规

### 1.2 测试范围

| 组件 | 测试优先级 | 状态 |
|------|-----------|------|
| CycleControlPanel | P0 | ✅ 已实现 |
| PendingSignalsTable/Mobile | P0 | ✅ 已实现 |
| QuantLoopDashboard | P0 | ✅ 已实现 |
| SystemStatusCard | P1 | ✅ 已实现 |
| SignalPipelineChart | P1 | ✅ 已实现 |
| PerformanceChart | P1 | ✅ 已实现 |
| OptimizationPanel | P1 | ✅ 已实现 |

## 2. 设备矩阵测试

### 2.1 手机端测试 (Portrait)

#### iPhone SE (375×667px)
**测试用例:**
```
1. 打开量化闭环页面
   ✓ 页面加载完整，无水平滚动
   ✓ 顶部标题和副标题清晰可读
   
2. 测试 CycleControlPanel
   ✓ "执行真实交易"复选框可点击（触摸目标 ≥ 56px）
   ✓ 所有复选框标签和提示文字清晰可见
   ✓ "运行完整周期"和"仅运行优化"按钮全宽显示
   ✓ 按钮点击时有视觉反馈（scale 0.98）
   
3. 测试信号列表
   ✓ 显示卡片式布局（非表格）
   ✓ 每个信号卡片显示完整信息
   ✓ 复选框位于卡片左上角，易于点击
   ✓ 操作按钮（详情、执行、拒绝）高度 ≥ 48px
   
4. 测试批量操作
   ✓ 选中信号后底部工具栏出现
   ✓ 批量执行/拒绝按钮易于点击
   ✓ 工具栏考虑安全区域（safe-area-inset-bottom）
   
5. 测试其他组件
   ✓ SystemStatusCard 垂直布局，信息完整
   ✓ SignalPipelineChart 各阶段垂直排列
   ✓ PerformanceChart 图表高度适中（200px）
   ✓ OptimizationPanel 建议卡片单列显示
```

#### iPhone 14 (390×844px)
**测试用例:**
```
1. 页面布局
   ✓ 所有组件适应更大屏幕
   ✓ 内容间距一致且舒适
   
2. 交互测试
   ✓ 所有触摸目标符合 iOS 标准（≥ 44px）
   ✓ 长内容滚动流畅
   ✓ 无意外的横向滚动
   
3. 性能测试
   ✓ 页面加载时间 < 2s
   ✓ 交互响应时间 < 100ms
   ✓ 滚动帧率 ≥ 60 FPS
```

#### Samsung Galaxy S21 (360×800px)
**测试用例:**
```
1. Android 特定测试
   ✓ 触摸反馈正常（-webkit-tap-highlight-color: transparent）
   ✓ 滚动行为流畅（-webkit-overflow-scrolling: touch）
   ✓ 字体在 Android 上清晰可读
   
2. 浏览器兼容性
   ✓ Chrome Mobile 渲染正确
   ✓ Samsung Internet 渲染正确
   ✓ CSS Grid/Flexbox 布局正常
```

### 2.2 平板端测试

#### iPad Air (820×1180px Portrait)
**测试用例:**
```
1. 布局测试
   ✓ 使用平板优化布局（部分2列网格）
   ✓ SystemStatusCard 和其他卡片合理分布
   ✓ 图表组件高度增加到 250px
   
2. 信号表格
   ✓ 根据屏幕宽度决定显示表格或卡片
   ✓ 1024px 是切换断点
   
3. 交互测试
   ✓ 支持触摸和鼠标操作
   ✓ 悬停效果在非触摸设备上正常
```

#### iPad Pro (1024×1366px)
**测试用例:**
```
1. 桌面级体验
   ✓ 显示完整桌面布局
   ✓ PendingSignalsTable 表格视图显示
   ✓ 多列网格布局充分利用空间
   
2. 性能
   ✓ 图表渲染流畅
   ✓ 大数据集滚动无卡顿
```

### 2.3 桌面端测试

#### MacBook (1440×900px)
**测试用例:**
```
1. 桌面布局
   ✓ 完整的多列网格布局
   ✓ 悬停效果正常工作
   ✓ 鼠标点击精确
   
2. 键盘导航
   ✓ Tab 键可以遍历所有交互元素
   ✓ Enter/Space 可以激活按钮和复选框
   ✓ 焦点指示器清晰可见
```

#### 4K Monitor (3840×2160px)
**测试用例:**
```
1. 高分辨率适配
   ✓ 字体和图标清晰锐利
   ✓ 布局不会过度拉伸
   ✓ 最大宽度限制合理
```

## 3. 功能测试

### 3.1 关键交互测试（P0）

#### T1: 执行真实交易复选框
```
前置条件: 用户在移动设备上访问量化闭环页面

步骤:
1. 滚动到 CycleControlPanel
2. 点击"执行真实交易"复选框
3. 观察复选框状态变化

预期结果:
✓ 复选框容器高度 ≥ 56px
✓ 点击响应灵敏，无需多次尝试
✓ 复选框状态立即切换
✓ 有触摸反馈（背景色变化或轻微缩放）

实际结果: [待填写]
状态: [通过/失败]
```

#### T2: 移动端信号列表操作
```
前置条件: 有待执行的交易信号

步骤:
1. 在手机上打开信号列表
2. 选中一个或多个信号
3. 点击底部工具栏的"批量执行"

预期结果:
✓ 信号以卡片形式显示，不是表格
✓ 每个卡片的复选框易于点选
✓ 选中后底部工具栏从屏幕底部滑入
✓ 工具栏按钮高度 ≥ 48px，易于点击
✓ 在有 Home Indicator 的设备上，工具栏不被遮挡

实际结果: [待填写]
状态: [通过/失败]
```

#### T3: 页面横向滚动问题
```
前置条件: 使用手机访问量化闭环页面

步骤:
1. 打开页面
2. 尝试横向滑动
3. 检查所有组件

预期结果:
✓ 页面宽度不超过视口宽度
✓ 无法横向滚动
✓ 所有内容在视口内可见
✓ 无内容被截断

实际结果: [待填写]
状态: [通过/失败]
```

### 3.2 布局响应测试（P1）

#### T4: viewport 切换
```
测试工具: Chrome DevTools Responsive Mode

步骤:
1. 从 375px 宽度开始
2. 逐步增加到 1920px
3. 观察布局变化

断点检查:
✓ 768px: 从移动布局切换到平板布局
  - 内边距从 16px 增加到 20px
  - 字体大小适当增加
  
✓ 1024px: 从卡片切换到表格（信号列表）
  - PendingSignalsTableMobile → PendingSignalsTable
  - 图表高度从 220px → 250px
  
✓ 1280px: 桌面优化
  - 间距进一步增大
  - 多列网格充分利用空间

实际结果: [待填写]
状态: [通过/失败]
```

#### T5: 组件独立响应
```
对每个核心组件单独测试:

CycleControlPanel:
✓ 767px 以下: 按钮全宽，垂直堆叠
✓ 768px 以上: 按钮并排，固定宽度

SystemStatusCard:
✓ 767px 以下: 状态项垂直排列
✓ 768px 以上: 状态项水平排列

SignalPipelineChart:
✓ 767px 以下: 管道阶段垂直排列
✓ 768px 以上: 管道阶段水平排列

PerformanceChart:
✓ 480px: 图表高度 200px，指标单列
✓ 768px: 图表高度 220px，指标2列
✓ 1024px: 图表高度 250px，指标自适应

OptimizationPanel:
✓ 480px: 模式统计单列
✓ 768px: 模式统计2列
✓ 1024px: 模式统计2列

实际结果: [待填写]
状态: [通过/失败]
```

## 4. 性能测试

### 4.1 加载性能

#### Lighthouse Mobile 测试
```
测试条件:
- 设备: Moto G Power (模拟)
- 网络: Fast 3G
- CPU: 4x slowdown

目标指标:
✓ Performance Score: ≥ 80
✓ First Contentful Paint (FCP): < 2s
✓ Largest Contentful Paint (LCP): < 2.5s
✓ Time to Interactive (TTI): < 3.5s
✓ Total Blocking Time (TBT): < 300ms
✓ Cumulative Layout Shift (CLS): < 0.1

测试命令:
lighthouse https://your-domain.com/quant-loop \
  --emulated-form-factor=mobile \
  --throttling.cpuSlowdownMultiplier=4 \
  --output=html \
  --output-path=./lighthouse-mobile.html

实际结果: [待填写]
```

#### 真实设备测试
```
设备: [实际测试设备]
网络: [实际网络条件]

测量指标:
- 页面加载时间: [_____] ms (目标: < 2000ms)
- 首次交互时间: [_____] ms (目标: < 100ms)
- 图表渲染时间: [_____] ms (目标: < 500ms)

工具: Chrome DevTools Performance Tab
```

### 4.2 运行时性能

#### 滚动性能测试
```
测试场景: 在有 50+ 信号的列表中滚动

测量方法:
1. 打开 Chrome DevTools
2. 切换到 Performance 选项卡
3. 开始录制
4. 快速滚动页面 5 秒
5. 停止录制
6. 分析帧率

目标:
✓ 平均帧率: ≥ 60 FPS
✓ Dropped Frames: < 5%
✓ Scripting Time: < 50ms per frame
✓ Rendering Time: < 50ms per frame

实际结果: [待填写]
```

#### 动画性能测试
```
测试场景: 点击按钮、打开模态框、底部工具栏滑入

检查项:
✓ 所有动画使用 transform 和 opacity（GPU 加速）
✓ 没有使用 width、height、left、top 等触发 layout 的属性
✓ 应用了 will-change 提示（谨慎使用）
✓ 动画流畅，无掉帧

工具: Chrome DevTools Rendering Tab
- 启用 "Paint flashing" 检查重绘
- 启用 "Layer borders" 检查合成层
- 启用 "Frame Rendering Stats" 查看帧率

实际结果: [待填写]
```

### 4.3 内存测试

```
测试场景: 长时间使用应用

步骤:
1. 打开页面
2. 执行各种操作（切换面板、刷新数据、打开模态框）
3. 重复 10 分钟
4. 检查内存使用

工具: Chrome DevTools Memory Tab

目标:
✓ 无明显内存泄漏（内存使用趋于稳定）
✓ 页面卸载后内存正确释放
✓ 最大内存使用 < 100MB（移动设备）

实际结果: [待填写]
```

## 5. 可访问性测试

### 5.1 键盘导航

```
测试步骤:
1. 只使用键盘访问页面（不使用鼠标）
2. 按 Tab 键遍历所有交互元素
3. 使用 Enter/Space 激活按钮和复选框
4. 使用 Esc 关闭模态框

检查项:
✓ Tab 顺序符合逻辑（从上到下，从左到右）
✓ 焦点指示器清晰可见（focus-visible）
✓ 所有交互元素可以通过键盘访问
✓ 跳过导航链接可用（如有）
✓ 模态框打开时，焦点陷阱正常工作

实际结果: [待填写]
状态: [通过/失败]
```

### 5.2 屏幕阅读器

```
测试工具:
- iOS: VoiceOver
- Android: TalkBack
- Desktop: NVDA (Windows) / VoiceOver (Mac)

检查项:
✓ 所有图片有 alt 文本
✓ 按钮和链接有描述性文本
✓ 表单控件有关联的 label
✓ 状态变化有 aria-live 通知
✓ 模态框有正确的 ARIA 属性
✓ 页面结构清晰（heading 层级）

测试脚本:
1. 启动屏幕阅读器
2. 从页面顶部开始导航
3. 听取每个元素的读取内容
4. 执行关键操作（选中复选框、点击按钮）
5. 确认反馈清晰

实际结果: [待填写]
状态: [通过/失败]
```

### 5.3 色彩对比度

```
工具: axe DevTools / Lighthouse

检查项:
✓ 正常文本（< 18pt）对比度 ≥ 4.5:1
✓ 大号文本（≥ 18pt）对比度 ≥ 3:1
✓ 交互元素边界对比度 ≥ 3:1
✓ 焦点指示器对比度 ≥ 3:1
✓ 不依赖颜色传达重要信息

关键组件检查:
- 主要文本颜色 (#f1f5f9) vs 背景 (#1e293b): [____]
- 次要文本颜色 (#94a3b8) vs 背景 (#1e293b): [____]
- 按钮文字 vs 按钮背景: [____]
- 链接颜色 (#a78bfa) vs 背景: [____]

实际结果: [待填写]
状态: [通过/失败]
```

## 6. 浏览器兼容性测试

### 6.1 移动浏览器

| 浏览器 | 版本 | 操作系统 | 状态 | 备注 |
|--------|------|----------|------|------|
| Safari | 15+ | iOS 15+ | ⏳ | 主要测试对象 |
| Chrome Mobile | Latest | Android 10+ | ⏳ | |
| Samsung Internet | Latest | Android 10+ | ⏳ | Samsung 设备默认 |
| Firefox Mobile | Latest | Android 10+ | ⏳ | 次要浏览器 |

### 6.2 桌面浏览器

| 浏览器 | 版本 | 操作系统 | 状态 | 备注 |
|--------|------|----------|------|------|
| Chrome | Latest | macOS/Windows | ⏳ | 主要开发浏览器 |
| Safari | 15+ | macOS | ⏳ | 重要测试对象 |
| Firefox | Latest | macOS/Windows | ⏳ | |
| Edge | Latest | Windows | ⏳ | Chromium 内核 |

### 6.3 兼容性检查项

```
CSS 特性:
✓ CSS Grid - caniuse.com: 97%+ 支持
✓ CSS Flexbox - caniuse.com: 99%+ 支持
✓ CSS Custom Properties - caniuse.com: 97%+ 支持
✓ CSS calc() - caniuse.com: 99%+ 支持
✓ env(safe-area-inset-*) - Safari 11.1+

JavaScript 特性:
✓ ES6+ 语法（通过 Vite 转译）
✓ Vue 3 Composition API
✓ Async/Await
✓ Modules

浏览器 API:
✓ window.matchMedia（响应式检测）
✓ ResizeObserver（ECharts 自适应）
✓ IntersectionObserver（懒加载，如有）

实际结果: [待填写]
```

## 7. 回归测试

### 7.1 功能回归

```
确保现有功能未被响应式改造破坏:

量化闭环核心流程:
✓ 查看系统状态
✓ 手动触发周期执行
✓ 查看待执行信号
✓ 批量执行/拒绝信号
✓ 查看性能图表
✓ 查看优化建议

数据交互:
✓ API 调用正常
✓ 数据正确渲染
✓ 实时更新正常
✓ 错误处理正确

状态管理:
✓ Pinia store 状态正确
✓ 组件间状态同步
✓ 路由导航正常

实际结果: [待填写]
状态: [通过/失败]
```

### 7.2 桌面体验回归

```
确保桌面用户体验未受损:

布局检查:
✓ 桌面布局仍然是多列网格
✓ 表格视图正常显示（≥ 1024px）
✓ 悬停效果保留
✓ 间距和视觉层次保持一致

性能检查:
✓ 桌面加载速度未下降
✓ 图表渲染速度正常
✓ 无新增的性能瓶颈

实际结果: [待填写]
状态: [通过/失败]
```

## 8. 用户验收测试 (UAT)

### 8.1 真实场景测试

```
场景 1: 移动端快速执行交易
角色: 外出的交易员
设备: iPhone 14
步骤:
1. 收到交易信号通知
2. 打开应用查看信号
3. 快速审阅信号详情
4. 勾选"执行真实交易"
5. 点击"运行完整周期"

预期:
- 所有操作可以单手完成
- 复选框和按钮易于点击
- 整个流程 < 30 秒

用户反馈: [待填写]
通过: [是/否]
```

```
场景 2: 平板端深度分析
角色: 策略分析师
设备: iPad Pro
步骤:
1. 打开量化闭环页面
2. 查看系统状态和管道流程
3. 分析性能图表
4. 阅读优化建议
5. 切换到信号列表

预期:
- 利用平板的大屏幕显示更多信息
- 图表和表格清晰可读
- 支持触摸和 Apple Pencil

用户反馈: [待填写]
通过: [是/否]
```

```
场景 3: 桌面端批量操作
角色: 交易经理
设备: MacBook Pro
步骤:
1. 打开信号列表
2. 使用表格视图筛选信号
3. 批量选择多个信号
4. 执行批量操作

预期:
- 表格视图功能完整
- 支持键盘快捷键
- 鼠标操作精确

用户反馈: [待填写]
通过: [是/否]
```

### 8.2 问题反馈收集

```
收集方式:
- 内部团队测试反馈
- Beta 用户反馈表单
- 用户访谈记录

分类标准:
- P0: 核心功能完全不可用，必须修复
- P1: 影响用户体验，应该修复
- P2: 小问题或改进建议，可以延后

反馈汇总表:
| ID | 问题描述 | 设备 | 优先级 | 状态 | 负责人 |
|----|---------|------|--------|------|--------|
| 1  | [描述] | [设备] | [P0/P1/P2] | [待修复/已修复/延后] | [姓名] |
| ... |

```

## 9. 验收标准

### 9.1 必须通过项 (P0)

- [ ] 移动端复选框问题完全解决（原始问题）
- [ ] 移动端页面无横向滚动
- [ ] 所有触摸目标 ≥ 44px（iOS 标准）
- [ ] CycleControlPanel 在所有设备上可用
- [ ] 信号列表在移动端以卡片形式显示
- [ ] 批量操作在移动端正常工作
- [ ] 无功能回归问题

### 9.2 应该通过项 (P1)

- [ ] Lighthouse Mobile Performance Score ≥ 80
- [ ] 所有断点切换流畅
- [ ] 图表组件响应式渲染正确
- [ ] 键盘导航完整可用
- [ ] 主流浏览器兼容性测试通过
- [ ] 真实设备测试通过（至少 3 台设备）

### 9.3 期望通过项 (P2)

- [ ] 屏幕阅读器支持良好
- [ ] 色彩对比度 100% 符合 WCAG AA
- [ ] 高级触摸手势支持（长按、滑动）
- [ ] 离线提示和错误处理优雅

## 10. 测试执行计划

### 10.1 时间表

| 阶段 | 活动 | 负责人 | 时间 |
|------|------|--------|------|
| 1 | 开发团队自测 | 开发者 | 1 天 |
| 2 | QA 功能测试 | QA | 2 天 |
| 3 | 性能和兼容性测试 | QA/开发者 | 1 天 |
| 4 | 真实设备测试 | 全团队 | 1 天 |
| 5 | UAT 用户验收 | 产品/用户 | 2 天 |
| 6 | 问题修复 | 开发者 | 1-2 天 |
| 7 | 最终验收 | 产品负责人 | 0.5 天 |

### 10.2 测试环境

```
开发环境:
- URL: http://localhost:5173
- 数据: Mock/测试数据

测试环境:
- URL: https://test.example.com
- 数据: 测试数据集

预生产环境:
- URL: https://staging.example.com
- 数据: 生产数据副本
```

### 10.3 测试工具清单

- [ ] Chrome DevTools
- [ ] Chrome DevTools Device Mode
- [ ] Lighthouse CI
- [ ] BrowserStack 或 Sauce Labs（真实设备）
- [ ] axe DevTools（可访问性）
- [ ] 真实设备（iPhone、iPad、Android）
- [ ] 屏幕阅读器（VoiceOver、TalkBack）

## 11. 测试报告模板

```markdown
# V3.2 响应式设计测试报告

**测试日期**: [YYYY-MM-DD]
**测试人员**: [姓名]
**测试环境**: [开发/测试/预生产]

## 执行摘要

- 总测试用例数: [__]
- 通过: [__]
- 失败: [__]
- 阻塞: [__]
- 通过率: [__%]

## 关键发现

### 高优先级问题 (P0)
1. [问题描述]
   - 影响: [说明]
   - 设备: [受影响设备]
   - 截图: [附件]

### 中优先级问题 (P1)
...

### 低优先级问题 (P2)
...

## 性能指标

| 指标 | 目标 | 实际 | 状态 |
|------|------|------|------|
| Lighthouse Score | ≥80 | [__] | [✓/✗] |
| FCP | <2s | [__]s | [✓/✗] |
| LCP | <2.5s | [__]s | [✓/✗] |
| TTI | <3.5s | [__]s | [✓/✗] |

## 浏览器兼容性

| 浏览器 | 版本 | 状态 | 备注 |
|--------|------|------|------|
| Safari Mobile | 15.0 | [✓/✗] | [说明] |
| Chrome Mobile | 120.0 | [✓/✗] | [说明] |
| ... | ... | ... | ... |

## 验收决定

[ ] 通过验收，可以发布
[ ] 部分通过，需修复 P0 问题后发布
[ ] 未通过，需重新测试

## 签署

测试负责人: ________________  日期: ________
产品负责人: ________________  日期: ________
技术负责人: ________________  日期: ________
```

## 12. 附录

### 12.1 常见问题排查

**问题: 移动端复选框点不中**
```
排查步骤:
1. 检查复选框容器高度是否 ≥ 44px
2. 检查是否有其他元素覆盖
3. 检查 CSS touch-action 属性
4. 检查浏览器控制台是否有 JavaScript 错误
5. 使用 Chrome DevTools 查看元素的点击区域

解决方案: 见 CycleControlPanel.vue 优化
```

**问题: 页面可以横向滚动**
```
排查步骤:
1. 检查页面宽度是否设置为 100vw
2. 检查是否有固定宽度元素超出视口
3. 检查是否有 margin 导致溢出
4. 使用 box-sizing: border-box

解决方案: 在全局 CSS 设置 overflow-x: hidden（谨慎使用）
```

**问题: 图表在移动端显示异常**
```
排查步骤:
1. 检查图表容器宽度是否响应式
2. 检查 ECharts resize 是否被调用
3. 检查图表高度是否适配移动端
4. 检查是否有 window resize 监听器

解决方案: 见 PerformanceChart.vue 优化
```

### 12.2 测试数据准备

```javascript
// 生成测试信号数据
const generateTestSignals = (count = 50) => {
  const signals = []
  for (let i = 0; i < count; i++) {
    signals.push({
      id: `signal_${i}`,
      symbol: ['AAPL', 'TSLA', 'GOOGL', 'MSFT'][i % 4],
      direction: i % 2 === 0 ? 'LONG' : 'SHORT',
      signal_type: ['ALPHA', 'MACRO', 'HOTSPOT'][i % 3],
      position_size: Math.random() * 1000 + 100,
      strength: Math.random() * 10,
      confidence: Math.random(),
      expected_return: Math.random() * 0.1 - 0.05,
      created_at: new Date(Date.now() - Math.random() * 86400000).toISOString()
    })
  }
  return signals
}
```

### 12.3 参考资料

- [Apple Human Interface Guidelines - Touch Targets](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/adaptivity-and-layout/)
- [Material Design - Accessibility](https://material.io/design/usability/accessibility.html)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Web Docs - Responsive Design](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)
- [Web.dev - Mobile Performance](https://web.dev/mobile-first/)

---

**文档版本**: v1.0  
**最后更新**: 2024-01-XX  
**维护者**: 开发团队
