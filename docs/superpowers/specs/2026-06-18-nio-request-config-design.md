# NIO 请求配置参数模块设计

## 背景

项目当前在 `src/App.tsx` 的 `updateFromAPI` 和 `api/push.ts` 中硬编码了 NIO Widget API 的 query 参数和请求头。用户希望把“从 NIO app 中读取请求”的相关参数做成页面上可编辑、可测试、可保存的配置模块。

本设计聚焦第一版：编辑 NIO 请求参数和请求头，不做多配置预设、账号体系或服务端持久化。

## 目标

- 在现有仪表盘页面中加入可折叠的“请求配置”面板。
- 允许编辑 NIO 请求的 query 参数和 headers。
- 配置保存到浏览器 `localStorage`。
- 支持常用字段表单编辑和高级 JSON 编辑。
- 允许高级 JSON 中的未知字段保存并参与请求。
- 提供“测试请求”按钮，成功后更新当前 widgets。
- 现有“从 NIO API 更新数据”按钮改为读取同一份配置。

## 非目标

- 不实现多个配置预设。
- 不实现导入/导出配置。
- 不实现从 curl 自动解析配置。
- 不把配置保存到后端或 Vercel 环境变量。
- 不改动 dot-mindreset 推送配置模块，除非复用已有 UI 状态。

## 页面结构

在现有顶部工具栏下方新增一个可折叠面板：

- 折叠标题：`请求配置`
- 展开后显示：
  - 常用 Query 参数表单
  - 常用 Headers 表单
  - `Authorization` password 输入框和“显示/隐藏”按钮
  - “高级 JSON”折叠区
  - “保存配置”“重置默认”“测试请求”按钮
  - 状态提示：保存成功、测试成功、JSON 错误、请求失败等

面板默认收起，避免影响现有 widget 预览区域。

## 数据模型

新增前端类型：

```ts
interface NioRequestConfig {
  query: Record<string, string>;
  headers: Record<string, string>;
}
```

默认配置从当前硬编码请求迁移而来，但敏感字段不在 UI 中明文展示为普通文本。`Authorization` 使用 password 输入框保存和编辑。

建议常用 query 字段：

- `lang`
- `app_id`
- `timestamp`
- `app_ver`
- `device_id`
- `widget_functions`
- `widget_size`
- `region`
- `vehicle_id`
- `sign`

建议常用 headers 字段：

- `Accept`
- `User-Agent`
- `Authorization`
- `Accept-Language`

高级 JSON 支持编辑完整 `query` 和 `headers`。未知字段允许保存，并参与实际请求。

## 存储

使用 `localStorage`：

- key：`nio_dashboard_request_config`
- value：序列化后的 `NioRequestConfig`

加载顺序：

1. 优先读取 `localStorage`。
2. 如果不存在或解析失败，使用默认配置。
3. 保存时覆盖该 key。
4. 重置默认时删除该 key 并恢复默认配置。

## 数据流

### 更新 widgets

1. 用户点击“从 NIO API 更新数据”或“测试请求”。
2. 页面读取当前 `NioRequestConfig`。
3. 用 `query` 构造 `/nio-api/app/api/icar/v2/widget/info?...`。
4. 用 `headers` 发起 GET 请求。
5. 请求成功且 `result_code === 'success'` 时，调用现有 NIO 数据映射逻辑更新 `widgetData`。
6. 更新 `lastUpdate` 和状态提示。

### 表单与 JSON 同步

- 表单字段修改时，立即更新内存中的 `NioRequestConfig`。
- 高级 JSON 打开时显示当前配置的格式化 JSON。
- 高级 JSON 保存时先解析和校验：
  - 必须是对象。
  - `query` 和 `headers` 必须是对象。
  - 值统一转换为字符串。
- JSON 无效时不覆盖当前配置，显示错误信息。

## 组件拆分

为避免 `src/App.tsx` 继续膨胀，新增独立模块：

- `src/config/nioRequestConfig.ts`
  - 默认配置
  - `loadNioRequestConfig`
  - `saveNioRequestConfig`
  - `resetNioRequestConfig`
  - `buildNioRequestUrl`
  - `normalizeNioRequestConfig`

- `src/components/NioRequestConfigPanel.tsx`
  - 可折叠 UI
  - 表单编辑
  - Authorization 显示/隐藏
  - 高级 JSON 编辑
  - 保存、重置、测试按钮

- `src/utils/mapNioApiData.ts`
  - 抽出现有 NIO API 数据到 `WidgetDataState` 的映射逻辑
  - `App.tsx` 和测试请求复用同一逻辑

`App.tsx` 只负责持有 `widgetData`、展示 widgets，并把“测试请求成功后的数据”接入现有状态。

## 错误处理

- `localStorage` JSON 解析失败：回退默认配置，并提示“本地配置损坏，已使用默认配置”。
- 高级 JSON 格式错误：不保存，显示具体解析错误。
- 必填字段缺失：阻止测试请求，提示缺失字段，例如 `Authorization` 或 `vehicle_id`。
- NIO 请求 HTTP 非 2xx：显示状态码和响应摘要。
- NIO 返回 `result_code !== 'success'`：显示返回的错误内容摘要。
- 网络失败：显示“请求失败，请检查网络、代理或 Authorization”。

## 安全与隐私

- `Authorization` 默认使用 password 输入框。
- 提供“显示/隐藏”按钮，默认隐藏。
- 不在控制台打印完整 `Authorization`。
- 不把请求配置提交到仓库。
- 本版仍使用浏览器 `localStorage` 保存敏感信息；这是用户选择的权衡。后续如需更安全，可迁移到 Vercel 环境变量或服务端代理配置。

## 测试策略

- 运行 TypeScript 构建，确保类型正确。
- 手动验证：
  - 打开页面，展开请求配置面板。
  - 修改常用 query/header 字段并保存。
  - 刷新页面后配置仍存在。
  - 高级 JSON 添加未知字段后保存，字段保留并参与请求。
  - 输入非法 JSON 时显示错误且不覆盖原配置。
  - 点击“测试请求”成功后 widgets 更新。
  - 点击现有“从 NIO API 更新数据”使用同一配置。

## 后续可选增强

- 多配置预设。
- 导入/导出 JSON。
- 从 curl 自动解析请求。
- 敏感字段迁移到 Vercel 环境变量。
- 将 NIO 请求统一走后端 API，避免浏览器暴露 headers。
