# 多套 UI 主题切换系统设计

**日期：** 2026-07-04
**范围：** `apps/forge-web`（前端工程）
**目标：** 为前端工程开发多套 UI，用户可自主切换

---

## 1. 背景与现状

### 当前样式架构

forge-web 当前已有以下基础设施：

- **明暗切换**：基于 Element Plus dark 模式 + `data-theme` 属性 + `.dark` class，已通过 `pageConfig` store 持久化到 localStorage
- **CSS 变量**：`src/styles/var.css` 定义了部分业务变量（侧栏色、logo 高度等），但**部分硬编码**仍存在于 `BasicLayout.vue`（如 `#304156`、`#bfcbd9`、`#409EFF`）
- **单一布局**：`BasicLayout.vue`（侧边栏 220/64px + 顶部 40px + 可选标签页 + 主内容区），移动端切到 `MobileMenu`
- **设置面板**：`SettingsPanel.vue` 已存在，可扩展为入口
- **组件库**：Element Plus + vxe-table

### 用户需求

| 维度 | 选择 |
|---|---|
| 多套 UI 含义 | 多套配色主题 + 多种布局结构 + 多种风格皮肤 |
| 组合方式 | **预设套餐**（4 套），而非三维度正交 |
| 持久化方式 | localStorage（沿用现有模式，零后端改动） |
| 明暗关系 | 每个套餐都保留 light/dark 双版本 |

---

## 2. 总体架构

### 三层抽象模型

```
套餐 preset = 调色板 palette + 布局 layout + 风格 style
  "geek"    =   "purple"     +   "top"    +   "glass"
```

三维度在内部正交解耦，但**对用户只暴露 4 个套餐**。后期可加"高级设置"独立暴露三维度（YAGNI，第一版不实现 UI，仅留接口）。

### 4 个预设套餐

| 套餐 ID | 名称 | 调色板 | 布局 | 风格 | 主色（亮/暗） |
|---|---|---|---|---|---|
| `default` | 默认 | blue | sidebar | flat | `#409EFF` / `#3a8ee6` |
| `geek` | 极客紫 | purple | top | glass | `#722ed1` / `#9254de` |
| `business` | 商务器 | green | sidebar | card | `#52c41a` / `#389e0d` |
| `dark-pro` | 酷暗黑 | crimson | sidebar | compact | `#f5222d` / `#cf1322` |

每个套餐都有 light / dark 双版本，**总共 8 种视觉状态**。

### CSS 变量分两阶

```
┌─────────────────────────────────────────────┐
│ 第一阶：业务语义变量 (tokens.scss 定义默认值) │
│   --app-bg, --app-sidebar-bg,                │
│   --app-radius-base, --app-shadow-card,      │
│   --app-density-pad                          │
└────────────────┬────────────────────────────┘
                 │ 由 [data-palette] + [data-style] 覆盖
                 ▼
┌─────────────────────────────────────────────┐
│ 第二阶：Element Plus / vxe-table 变量        │
│   --el-color-primary, --el-bg-color,         │
│   --el-border-radius-base, ...               │
└─────────────────────────────────────────────┘
```

业务组件**只引用第一阶变量**；主题文件负责把第一阶桥接到第二阶。加新套餐不会污染业务代码。

### 文件结构

```
apps/forge-web/src/
├── themes/                          ← 新增
│   ├── index.ts                     # 套餐注册表（export PRESETS）
│   ├── types.ts                     # Palette/Layout/Style 类型
│   ├── tokens.scss                  # 第一阶业务变量默认值
│   ├── palettes/
│   │   ├── blue.scss                # 默认
│   │   ├── purple.scss              # 极客紫
│   │   ├── green.scss               # 商务器
│   │   └── crimson.scss             # 酷暗黑
│   ├── layouts/
│   │   ├── LayoutSidebar.vue        # 抽自现有 BasicLayout
│   │   ├── LayoutTop.vue            # 新增（顶栏导航）
│   │   └── shared/                  # 共享子组件
│   │       ├── AppLogo.vue
│   │       ├── AppHeader.vue
│   │       ├── AppSidebar.vue
│   │       ├── TopNav.vue
│   │       ├── TabsView.vue         # 从 src/components/TabsView.vue 移入
│   │       └── MobileMenu.vue       # 从 src/components/MobileMenu.vue 移入
│   └── styles/                      # 风格 mixin
│       ├── _flat.scss
│       ├── _glass.scss
│       ├── _card.scss
│       └── _compact.scss
├── layouts/
│   └── BasicLayout.vue              # 改成"分发器"，按 preset 渲染对应 LayoutXxx
├── components/
│   └── SettingsPanel.vue            # 扩展：增加"套餐切换"区块
└── stores/
    └── pageConfig.ts                # 增加 preset 字段，沿用 localStorage
```

### 切换机制（无刷新）

```ts
// pageConfig.applyPreset('geek')
document.documentElement.setAttribute('data-palette', 'purple')
document.documentElement.setAttribute('data-layout', 'top')
document.documentElement.setAttribute('data-style', 'glass')
// 布局组件切换通过 <component :is="currentLayout"> 完成
```

切换不刷新页面、不重发请求，仅靠 CSS 变量重计算 + Vue 响应式组件切换。

---

## 3. 组件与状态机

### 套餐注册表 `themes/index.ts`

```ts
export type Palette = 'blue' | 'purple' | 'green' | 'crimson'
export type LayoutKind = 'sidebar' | 'top'
export type StyleKind = 'flat' | 'glass' | 'card' | 'compact'

export interface Preset {
  id: string
  name: string               // 显示名"默认"
  palette: Palette
  layout: LayoutKind
  style: StyleKind
  thumbnail?: string         // 预览缩略图（可选，后期补）
}

export const PRESETS: Preset[] = [
  { id: 'default',   name: '默认',     palette: 'blue',    layout: 'sidebar', style: 'flat' },
  { id: 'geek',      name: '极客紫',   palette: 'purple',  layout: 'top',     style: 'glass' },
  { id: 'business',  name: '商务器',   palette: 'green',   layout: 'sidebar', style: 'card' },
  { id: 'dark-pro',  name: '酷暗黑',   palette: 'crimson', layout: 'sidebar', style: 'compact' },
]

export const getPreset = (id: string): Preset =>
  PRESETS.find(p => p.id === id) ?? PRESETS[0]
```

### `pageConfig` store 扩展

新增字段 `preset`，默认值 `'default'`。新增方法 `applyPreset` / `changePreset`：

```ts
interface PageConfig {
  // 现有字段保留
  theme: ThemeType
  preset: string              // 新增：套餐 ID
  // 其他现有字段...
}

const applyPreset = (presetId: string) => {
  const preset = getPreset(presetId)
  config.value.preset = presetId
  document.documentElement.setAttribute('data-palette', preset.palette)
  document.documentElement.setAttribute('data-layout', preset.layout)
  document.documentElement.setAttribute('data-style', preset.style)
}

const changePreset = (presetId: string) => {
  applyPreset(presetId)
  // theme 保留当前值（明/暗独立切换）
}
```

**localStorage 兼容**：旧数据无 `preset` 字段时 `{ ...defaultConfig, ...parsed }` 回落到 `'default'`，无破坏性升级。

### 布局组件拆分

```
themes/layouts/
├── LayoutSidebar.vue   ← 从现有 BasicLayout 抽出（去掉分发逻辑）
├── LayoutTop.vue       ← 新增
└── shared/
    ├── AppLogo.vue             # Logo + 标题
    ├── AppHeader.vue           # 顶部条（折叠按钮 + 面包屑 + 通知 + 主题 + 设置 + 用户）
    ├── AppSidebar.vue          # 侧栏（el-menu + 菜单数据）
    ├── TopNav.vue              # 顶部导航（el-menu 横向）
    ├── TabsView.vue            # 从 src/components/TabsView.vue 移入
    └── MobileMenu.vue          # 从 src/components/MobileMenu.vue 移入
```

**移动端固定走 LayoutSidebar**（顶栏布局在小屏体验差），由分发器统一处理。

### BasicLayout 改为分发器

```vue
<!-- layouts/BasicLayout.vue（重写为分发器） -->
<template>
  <component :is="currentLayout" />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { usePageConfigStore } from '@/stores/pageConfig'
import { useResponsive } from '@/composables/useResponsive'
import { getPreset } from '@/themes'
import LayoutSidebar from '@/themes/layouts/LayoutSidebar.vue'
import LayoutTop from '@/themes/layouts/LayoutTop.vue'

const { config } = usePageConfigStore()
const { isMobile } = useResponsive()

const currentLayout = computed(() => {
  if (isMobile.value) return LayoutSidebar         // 移动端强制侧栏
  return getPreset(config.preset).layout === 'top' ? LayoutTop : LayoutSidebar
})
</script>
```

### 状态机视角

```
                    ┌─────────────┐
   localStorage ───►│ loadConfig  │──► { preset, theme, ... }
                    └─────┬───────┘
                          │
              ┌───────────┼────────────┐
              ▼           ▼            ▼
       applyPreset   applyTheme   (其他配置)
              │           │
              ▼           ▼
    [data-palette]  [data-theme]
    [data-layout]   .light/.dark
    [data-style]    VxeUI.setTheme()
              │
              ▼
    <component :is="currentLayout">
```

### SettingsPanel 扩展

在设置面板顶部新增"主题套餐"区块：

```
[主题套餐]
┌─────────────┬─────────────┐
│  [缩略图]    │  [缩略图]    │
│  默认        │  极客紫      │
└─────────────┴─────────────┘
┌─────────────┬─────────────┐
│  [缩略图]    │  [缩略图]    │
│  商务器      │  酷暗黑      │
└─────────────┴─────────────┘

[明暗模式]  ☀️ 明亮 / 🌙 暗黑  （沿用现有切换）
[其他设置]  标签页/面包屑/...    （现有）
```

第一版缩略图用 SVG 内联，避免引入图片资源；后期可换真实截图。

---

## 4. 数据流与 CSS 变量桥接

### 第一阶业务变量清单 `themes/tokens.scss`

```scss
:root {
  // ─── 调色板相关（由 palette 覆盖） ───
  --app-color-primary: #409EFF;
  --app-color-success: #67c23a;
  --app-color-warning: #e6a23c;
  --app-color-danger:  #f56c6c;

  --app-sidebar-bg:    #304156;
  --app-sidebar-text:  #bfcbd9;
  --app-sidebar-active:#409EFF;

  --app-header-bg:     #ffffff;

  // ─── 风格相关（由 style 覆盖） ───
  --app-radius-sm:     2px;
  --app-radius-base:   4px;
  --app-radius-lg:     8px;

  --app-shadow-card:   0 1px 4px rgba(0, 21, 41, 0.08);
  --app-shadow-popover:0 2px 12px rgba(0, 0, 0, 0.12);

  --app-gap-page:      10px;
  --app-gap-card:      10px;
  --app-density-pad:   10px;
}

[data-theme='dark'] {
  --app-header-bg: var(--el-bg-color);
  --app-shadow-card: 0 1px 4px rgba(0, 0, 0, 0.3);
}
```

### 调色板示例 `themes/palettes/blue.scss`

```scss
[data-palette='blue'] {
  --app-color-primary: #409EFF;
  --app-color-success: #67c23a;
  --app-color-warning: #e6a23c;
  --app-color-danger:  #f56c6c;

  // 桥接到 Element Plus（核心）
  --el-color-primary: var(--app-color-primary);
  --el-color-success: var(--app-color-success);
  --el-color-warning: var(--app-color-warning);
  --el-color-danger:  var(--app-color-danger);
  --el-color-primary-light-3: #79bbff;
  --el-color-primary-light-5: #a0cfff;
  --el-color-primary-light-7: #c6e2ff;
  --el-color-primary-light-9: #ecf5ff;
  --el-color-primary-dark-2:  #337ecc;

  // 桥接到 vxe-table
  --vxe-ui-primary-color: var(--app-color-primary);

  // 侧栏（仅在 sidebar 布局下生效）
  [data-layout='sidebar'] & {
    --app-sidebar-bg:    #304156;
    --app-sidebar-text:  #bfcbd9;
    --app-sidebar-active:var(--app-color-primary);
  }
}

// 暗色版：色相略微提升饱和度，避免暗背景上发灰
[data-palette='blue'][data-theme='dark'] {
  --app-color-primary: #3a8ee6;
  --el-color-primary-light-3: #1d6dbf;
}
```

其他三个调色板（purple/green/crimson）结构完全一致，仅色值不同。

### 风格 mixin `themes/styles/_glass.scss`

```scss
@mixin glass-surface {
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(12px) saturate(180%);
  border-radius: var(--app-radius-lg);
  box-shadow: var(--app-shadow-card);

  [data-theme='dark'] & {
    background: rgba(30, 30, 40, 0.65);
  }
}

[data-style='glass'] {
  --app-radius-base: 8px;
  --app-radius-lg:   12px;
  --app-shadow-card: 0 4px 16px rgba(0, 0, 0, 0.08);
  --app-gap-page:    16px;

  .el-card { @include glass-surface; }
}
```

其他三个风格（flat/card/compact）同理：每个 mixin 集中处理**圆角/阴影/间距/密度**四个维度。

### 风格对变量影响对照

| 变量 | flat | glass | card | compact |
|---|---|---|---|---|
| `--app-radius-base` | 4px | 12px | 8px | 2px |
| `--app-radius-lg` | 8px | 16px | 12px | 4px |
| `--app-shadow-card` | 弱 | 强+柔 | 中 | 极弱 |
| `--app-gap-page` | 10px | 16px | 12px | 6px |
| `--app-density-pad` | 标准 | 标准 | 宽松 | 紧凑 |

### 完整切换数据流

```
用户点击"极客紫"
       │
       ▼
SettingsPanel.emit('change', 'geek')
       │
       ▼
pageConfigStore.changePreset('geek')
       │
       ├─► config.value.preset = 'geek'
       │
       └─► applyPreset('geek')
              ├─► documentElement.setAttribute('data-palette', 'purple')
              ├─► documentElement.setAttribute('data-layout', 'top')
              └─► documentElement.setAttribute('data-style', 'glass')
       │
       ▼
浏览器重新匹配 [data-palette='purple'][data-style='glass'] 选择器
       │
       ▼
--app-color-primary 等变量更新 → --el-color-primary 等通过 var() 同步更新
       │
       ▼
所有 .el-* / .vxe-* 组件视觉立即变化（无重渲染）
       │
       ▼
同时：<component :is> 由 sidebar 切换为 top
       │
       ▼
LayoutTop 组件挂载，LayoutSidebar 卸载
（router-view 内 keepAlive 缓存的页面保留状态）
       │
       ▼
watch(config, deep) 触发 → saveConfig() 写入 localStorage
```

### 兼容性处理

- **BasicLayout 中硬编码的 `#304156` / `#bfcbd9` / `#409EFF`**：全部替换为 `var(--app-sidebar-bg)` 等业务变量。必要重构。
- **`var.css` 已有变量**：保留作为 `:root` 默认值来源，被 `themes/tokens.scss` 合并或引用。
- **`html.dark` 选择器**：与 `[data-theme='dark']` 共存（同时设置，保证现有 dark 样式不破坏）。

---

## 5. 错误处理与降级

### 5.1 配置加载失败

**场景**：localStorage 数据被手动篡改、JSON 解析失败、字段类型不对。

```ts
const loadConfig = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      config.value = { ...defaultConfig, ...parsed }
      if (!getPreset(parsed.preset)) {
        config.value.preset = 'default'
      }
    }
  } catch (error) {
    console.error('加载页面配置失败:', error)
    config.value = { ...defaultConfig }
  }
}
```

**策略**：任何异常都回落到 `defaultConfig`，不阻塞应用启动。

### 5.2 未知 preset ID

**场景**：用户从老版本升级、本地存储了已删除的套餐 ID。

`getPreset` 内置 fallback：未知 ID 一律回落到 `default`。

### 5.3 浏览器特性降级

**场景**：`geek`（玻璃拟态）依赖 `backdrop-filter`，部分浏览器不支持。

```scss
[data-style='glass'] {
  // 基础样式：不依赖 backdrop-filter 也能用
  background: rgba(255, 255, 255, 0.92);
  border-radius: var(--app-radius-lg);

  // 渐进增强：支持的浏览器再叠加模糊
  @supports (backdrop-filter: blur(12px)) {
    background: rgba(255, 255, 255, 0.65);
    backdrop-filter: blur(12px) saturate(180%);
  }
}
```

**策略**：`@supports` 检测，不支持时退化为半透明实色，**不报错、不切换风格**。

### 5.4 CSS 变量值非法

CSS 变量解析失败时浏览器忽略该声明，**视觉上保持上一个有效值或父级继承值**，不会导致 JS 报错或白屏。定位靠测试阶段视觉走查。

### 5.5 主题切换瞬态

**场景**：切换布局组件时旧组件卸载、新组件挂载，可能出现短暂闪烁。

**策略**：
- `<component :is>` 切换时 Vue 默认同步挂载，无空白帧
- `<router-view>` 内的页面不在切换范围内
- `<keep-alive>` 缓存的页面也保留状态
- 如出现闪烁，加 `<Transition mode="out-in" name="layout-fade">` 包裹（fallback 方案）

### 5.6 移动端布局异常

**场景**：用户在桌面端选了 `geek`（顶栏），然后缩小窗口到手机尺寸。

```ts
const currentLayout = computed(() => {
  if (isMobile.value) return LayoutSidebar         // 强制侧栏
  return getPreset(config.preset).layout === 'top' ? LayoutTop : LayoutSidebar
})
```

`isMobile` 由 `useResponsive` 监听窗口尺寸触发响应式重算，自动切回侧栏。窗口放大后自动恢复。

**`data-layout` 属性与组件分发解耦**：`data-layout` 始终等于套餐预设的 layout 值（不随窗口大小变化）。这意味着：
- 桌面端选 `geek`（`data-layout='top'`）→ 缩到手机尺寸 → 组件切回 LayoutSidebar，但 `data-layout` 仍为 `top`
- 此时 `[data-layout='sidebar'] &` 选择器不匹配，`--app-sidebar-bg` 走 `:root` 默认值（`#304156`）
- **意图**：移动端的侧栏色固定走默认值，不跟套餐调色板走；不同套餐在移动端视觉一致，符合"移动端固定侧栏"的语义

### 5.7 旧版本数据兼容

当前线上用户的 localStorage 有 `theme: 'light'` 但没有 `preset` 字段，`{ ...defaultConfig, ...parsed }` 自动补默认值，**用户无感知升级**。

### 5.8 localStorage 写入失败

隐私模式、配额满等情况，沿用现有 `saveConfig` 实现，失败仅 console、不弹窗。会话内主题切换仍生效（变量已应用到 DOM）。

### 5.9 错误处理边界总结

| 错误类型 | 影响 | 处理 |
|---|---|---|
| localStorage 损坏 | 加载失败 | 回落 defaultConfig |
| 未知 preset ID | 套餐选错 | 回落 'default' |
| 不支持 backdrop-filter | glass 风格效果打折 | `@supports` 降级到半透明实色 |
| CSS 变量值非法 | 局部样式失效 | 浏览器忽略，靠走查发现 |
| 布局切换闪烁 | 视觉抖动 | 默认无；必要时加 Transition |
| 移动端顶栏 | 体验差 | 强制切回侧栏 |
| 跨版本升级 | 字段缺失 | 缺省回落默认 |
| localStorage 写失败 | 不持久 | 仅 console，会话内仍有效 |

**核心原则**：主题系统是**用户偏好层**，绝不能因为自身错误阻塞业务功能。所有失败都静默降级到可用状态。

---

## 6. 测试与验收

### 6.1 单元测试（vitest）

```ts
// themes.test.ts
import { PRESETS, getPreset } from '@/themes'

describe('套餐注册表', () => {
  it('注册了 4 个套餐', () => {
    expect(PRESETS).toHaveLength(4)
  })

  it('套餐三维度组合与设计一致', () => {
    expect(getPreset('default')).toMatchObject({ palette: 'blue',    layout: 'sidebar', style: 'flat'    })
    expect(getPreset('geek')).toMatchObject   ({ palette: 'purple',  layout: 'top',     style: 'glass'   })
    expect(getPreset('business')).toMatchObject({ palette: 'green',  layout: 'sidebar', style: 'card'    })
    expect(getPreset('dark-pro')).toMatchObject({ palette: 'crimson',layout: 'sidebar', style: 'compact' })
  })

  it('未知 ID 回落到默认', () => {
    expect(getPreset('unknown').id).toBe('default')
    expect(getPreset('').id).toBe('default')
  })
})

// pageConfig.test.ts
describe('pageConfig.applyPreset', () => {
  beforeEach(() => localStorage.clear())

  it('切换套餐时设置三个 data 属性', () => {
    const store = usePageConfigStore()
    store.applyPreset('geek')
    const html = document.documentElement
    expect(html.getAttribute('data-palette')).toBe('purple')
    expect(html.getAttribute('data-layout')).toBe('top')
    expect(html.getAttribute('data-style')).toBe('glass')
  })

  it('切换套餐不影响 theme（明暗独立）', () => {
    const store = usePageConfigStore()
    store.applyTheme('dark')
    store.applyPreset('business')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('localStorage 缺失 preset 字段时回落 default', () => {
    localStorage.setItem('forge_admin-page-config', JSON.stringify({ theme: 'dark' }))
    const store = usePageConfigStore()
    store.loadConfig()
    expect(store.config.preset).toBe('default')
  })

  it('localStorage 损坏时不抛错', () => {
    localStorage.setItem('forge_admin-page-config', '{not json')
    expect(() => {
      const store = usePageConfigStore()
      store.loadConfig()
    }).not.toThrow()
  })
})
```

### 6.2 视觉走查清单

```
基础场景：登录页、首页 Dashboard、用户列表（vxe-table）、表单页、详情页、对话框、抽屉
功能场景：标签页切换、面包屑、移动端菜单、设置面板本身

每个套餐 × 每个场景 × light/dark = 4 × 7 × 2 = 56 个视觉检查点
```

走查清单节选：

| 检查点 | default | geek | business | dark-pro |
|---|---|---|---|---|
| 主色按钮（`--el-color-primary`） | 蓝 | 紫 | 绿 | 红 |
| 侧栏背景 | #304156 | — | 跟主色调 | 黑红调 |
| 卡片圆角 | 4px | 12px+模糊 | 8px | 2px |
| 表格 hover 行 | 浅蓝 | 浅紫 | 浅绿 | 浅红 |
| 对话框阴影 | 弱 | 强+柔 | 中 | 极弱 |
| 顶栏（仅 geek） | — | ✓ | — | — |
| 移动端始终侧栏 | ✓ | ✓ | ✓ | ✓ |

**截屏对比**：每个套餐在 light/dark 各截一张首页图建立 baseline；后续 PR 触发截图回归（可选，第一版可手工）。

### 6.3 集成测试（Playwright，第二阶段）

```
tests/e2e/theme-switch.spec.ts
- 登录 → 打开设置面板 → 切换套餐 → 断言 documentElement 三个 data 属性
- 断言 <html> 计算样式 getComputedStyle 中 --el-color-primary 已变
- 断言主内容区 <router-view> 未重新挂载（组件实例 id 保持）
```

第一版**不强制做**，先用单元 + 手工走查上线，第二阶段补 E2E。

### 6.4 回归测试

| 风险点 | 验证方式 |
|---|---|
| 现有 light/dark 切换 | 手工切 4 套餐，每套餐都切一次明暗 |
| vxe-table 主题跟随 | 任意套餐下表格视觉一致 |
| WebSocket 通知 | 套餐切换不弹通知丢失 |
| keep-alive 缓存页面 | 切套餐后已打开标签页状态保留 |
| 移动端响应式 | devtools 切手机视图，套餐布局回落侧栏 |
| BasicLayout 硬编码替换 | 切套餐时侧栏色变化（验证 `#304156` 已替换） |

### 6.5 验收标准

**功能验收（必须）：**
- [ ] 4 个套餐在设置面板可见，缩略图正确
- [ ] 切换套餐无刷新、无请求、无报错
- [ ] 切换明暗独立工作（4 套餐 × 2 明暗 = 8 种视觉都能呈现）
- [ ] 刷新页面后套餐保留
- [ ] 移动端始终是侧栏布局
- [ ] localStorage 清空后回落到 default + 跟随系统明暗

**视觉验收（必须）：**
- [ ] 4 个套餐的主色明显不同（蓝/紫/绿/红）
- [ ] 4 个套餐的圆角/阴影/密度明显不同
- [ ] dark 模式下文字对比度 ≥ 4.5:1（WCAG AA）
- [ ] 不支持 backdrop-filter 的浏览器降级到实色

**代码验收（必须）：**
- [ ] BasicLayout 中无硬编码颜色（全部走变量）
- [ ] `pnpm lint` 通过
- [ ] `pnpm test` 通过
- [ ] `pnpm build` 通过且产物大小涨幅 < 50KB（SCSS 增量）

### 6.6 性能预算

| 指标 | 预算 |
|---|---|
| 切换套餐的同步耗时 | < 16ms（一帧内） |
| 新增 CSS 产物（gzip） | < 8KB |
| 新增 JS 产物（gzip，含 LayoutTop） | < 5KB |
| localStorage 占用 | < 1KB |

---

## 7. 实现优先级

```
P0（必做）：
  1. themes/ 目录 + 套餐注册表
  2. 第一阶业务变量 + 4 个调色板 SCSS
  3. pageConfig.applyPreset + localStorage 持久化
  4. SettingsPanel 套餐选择 UI
  5. BasicLayout 硬编码颜色清理

P1（必做）：
  6. LayoutSidebar 从 BasicLayout 抽出
  7. LayoutTop 实现（el-menu 横向）
  8. 4 个风格 mixin（flat/glass/card/compact）

P2（可选，第一版后）：
  9. 截图回归测试
  10. E2E 集成测试
  11. 套餐缩略图（SVG 真实预览）
```

---

## 8. 不在本次范围内（YAGNI）

明确**不做**的事项，避免范围蔓延：

- **后端持久化**：本次仅 localStorage。后端 API 跨设备同步推迟到后续需求。
- **用户自定义色板**：不允许用户自己调色相饱和度。
- **路由级主题**：不支持不同路由用不同套餐。
- **小程序主题**：`apps/forge-miniapp` 不在本次范围。
- **后端管理界面主题**：服务端无任何变更。
- **完整设计 token 系统**：不引入 Style Dictionary 等构建管线。
- **三维度独立 UI**：高级设置里独立选 palette/layout/style 的 UI 暂不暴露。
