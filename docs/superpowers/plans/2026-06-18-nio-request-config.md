# NIO 请求配置参数模块 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有 NIO Widget Dashboard 页面中加入可折叠请求配置模块，让用户可编辑 NIO API query 参数和 headers，保存到 localStorage，并用同一配置测试请求和更新 widgets。

**Architecture:** 将硬编码 NIO 请求拆成独立配置模块、数据映射模块和 UI 面板模块。`App.tsx` 保留页面编排和 widget 渲染职责，新增的 `NioRequestConfigPanel` 负责配置编辑、保存、JSON 校验和测试请求，`nioRequestConfig.ts` 负责配置默认值、持久化、URL 构造和规范化，`mapNioApiData.ts` 负责复用 NIO API 数据映射逻辑。

**Tech Stack:** React 18、TypeScript、Vite、localStorage、现有 `/nio-api` Vite/Vercel 反向代理、Tailwind CSS class。

---

## File Structure

- Create: `src/config/nioRequestConfig.ts`
  - 定义 `NioRequestConfig` 类型、默认 query/headers、localStorage 读写、配置规范化、URL 构造、必填项校验。
- Create: `src/utils/mapNioApiData.ts`
  - 定义 `WidgetDataState` 类型接口片段和 `mapNioApiDataToWidgetState(prev, apiData)`，把 `src/App.tsx` 中重复的 NIO 数据映射逻辑集中到一个函数。
- Create: `src/components/NioRequestConfigPanel.tsx`
  - 可折叠 UI、常用字段表单、Authorization 显示/隐藏、高级 JSON 编辑、保存/重置/测试按钮。
- Modify: `src/App.tsx`
  - 导入配置面板和映射函数，删除重复映射逻辑，让 `updateFromAPI` 使用配置模块构造 URL/headers，并在顶部工具栏下方渲染面板。
- Modify: `.gitignore`
  - 若尚未包含，确保 `node_modules/` 已忽略。本仓库当前已经包含。

---

### Task 1: Add NIO request config storage utilities

**Files:**
- Create: `src/config/nioRequestConfig.ts`

- [ ] **Step 1: Create config module with types and defaults**

Create `src/config/nioRequestConfig.ts` with this content:

```ts
export interface NioRequestConfig {
  query: Record<string, string>;
  headers: Record<string, string>;
}

export interface NioConfigValidationResult {
  valid: boolean;
  errors: string[];
}

export const NIO_REQUEST_CONFIG_STORAGE_KEY = 'nio_dashboard_request_config';

export const DEFAULT_NIO_REQUEST_CONFIG: NioRequestConfig = {
  query: {
    lang: 'zh-CN',
    app_id: '10002',
    timestamp: '1774198476',
    app_ver: '6.3.0',
    device_id: '14e3f556d3984993a59ad96e8af3ba2d',
    widget_functions: 'rvs_set_doorlock,rvs_set_air_conditioner,rvs_set_tailgate,rvs_exe_findme',
    widget_size: 'medium',
    region: 'cn',
    vehicle_id: 'c36736658c7b4b7e8d5a484b8f908b43',
    sign: '7165a503f129317c909169732c6260de',
  },
  headers: {
    Accept: 'application/json,text/json,text/plain',
    'User-Agent': 'VehicleWidgetExtension/6.3.0 (com.do1.WeiLaiApp.NIOVehicleWidget; build:2586; iOS 26.3.1) Alamofire/5.9.1',
    Authorization: 'Bearer 2.0IkLw1IayXSA5CD32/1MdpTe9sF9zhR5BPmTEA3a2JX0=',
    'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
  },
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const stringifyRecordValues = (value: Record<string, unknown>): Record<string, string> => {
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => key.trim().length > 0)
      .map(([key, item]) => [key, item == null ? '' : String(item)])
  );
};

export const normalizeNioRequestConfig = (value: unknown): NioRequestConfig => {
  if (!isRecord(value)) {
    return DEFAULT_NIO_REQUEST_CONFIG;
  }

  const query = isRecord(value.query)
    ? stringifyRecordValues(value.query)
    : DEFAULT_NIO_REQUEST_CONFIG.query;

  const headers = isRecord(value.headers)
    ? stringifyRecordValues(value.headers)
    : DEFAULT_NIO_REQUEST_CONFIG.headers;

  return { query, headers };
};

export const loadNioRequestConfig = (): NioRequestConfig => {
  try {
    const raw = window.localStorage.getItem(NIO_REQUEST_CONFIG_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_NIO_REQUEST_CONFIG;
    }

    return normalizeNioRequestConfig(JSON.parse(raw));
  } catch (error) {
    console.warn('Failed to load NIO request config, using defaults:', error);
    return DEFAULT_NIO_REQUEST_CONFIG;
  }
};

export const saveNioRequestConfig = (config: NioRequestConfig): void => {
  window.localStorage.setItem(
    NIO_REQUEST_CONFIG_STORAGE_KEY,
    JSON.stringify(normalizeNioRequestConfig(config))
  );
};

export const resetNioRequestConfig = (): NioRequestConfig => {
  window.localStorage.removeItem(NIO_REQUEST_CONFIG_STORAGE_KEY);
  return DEFAULT_NIO_REQUEST_CONFIG;
};

export const buildNioRequestUrl = (config: NioRequestConfig): string => {
  const params = new URLSearchParams();

  Object.entries(config.query).forEach(([key, value]) => {
    if (key.trim() && value.trim()) {
      params.set(key, value);
    }
  });

  return `/nio-api/app/api/icar/v2/widget/info?${params.toString()}`;
};

export const validateNioRequestConfig = (config: NioRequestConfig): NioConfigValidationResult => {
  const errors: string[] = [];

  if (!config.headers.Authorization?.trim()) {
    errors.push('缺少 Authorization header');
  }

  if (!config.query.vehicle_id?.trim()) {
    errors.push('缺少 vehicle_id 参数');
  }

  if (!config.query.sign?.trim()) {
    errors.push('缺少 sign 参数');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};
```

- [ ] **Step 2: Run TypeScript build to verify module compiles**

Run:

```bash
npm run build
```

Expected: build succeeds, or fails only on pre-existing unrelated errors. There should be no error from `src/config/nioRequestConfig.ts`.

- [ ] **Step 3: Commit config module**

Run:

```bash
git add src/config/nioRequestConfig.ts
git commit -m "feat: add NIO request config utilities"
```

---

### Task 2: Extract NIO API data mapping

**Files:**
- Create: `src/utils/mapNioApiData.ts`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create mapping utility**

Create `src/utils/mapNioApiData.ts` with this content:

```ts
export interface WidgetDataState {
  batterySoc: number;
  batteryRange: number;
  totalMileage: number;
  isCharging: boolean;
  gpsLongitude: number;
  gpsLatitude: number;
  gpsAddress: string;
  petMode: boolean;
  powerHoldMode: boolean;
  campingMode: boolean;
  defenderMode: boolean;
  remoteVideo: boolean;
  insideTemp: number;
  outsideTemp: number;
  acOn: boolean;
  steeringWheelHeat: number;
  frontLeftHeat: number;
  frontRightHeat: number;
  rearLeftHeat: number;
  rearRightHeat: number;
  thirdRowLeftHeat: number;
  thirdRowRightHeat: number;
  frontLeftVent: number;
  frontRightVent: number;
  rearLeftVent: number;
  rearRightVent: number;
  chargingPower: number;
  chargingCurrent: number;
  chargingVoltage: number;
  chrgReq: number;
  cdcConnected: boolean;
  adcConnected: boolean;
  accountId: string;
  fotaVersion: string;
  fotaPartNumber: string;
  fotaIsLatest: boolean;
  frontLeftWindow: number;
  frontRightWindow: number;
  rearLeftWindow: number;
  rearRightWindow: number;
  frontTrunk: number;
  doorFrontLeft: number;
  doorFrontRight: number;
  doorRearLeft: number;
  doorRearRight: number;
  engineHood: number;
  tailgate: number;
  chargePort: number;
  isLocked: boolean;
}

export const mapNioApiDataToWidgetState = (
  prev: WidgetDataState,
  apiData: any
): WidgetDataState => ({
  ...prev,
  batterySoc: apiData.status?.soc_status?.soc ?? prev.batterySoc,
  batteryRange: apiData.status?.soc_status?.remaining_actual_range ?? prev.batteryRange,
  totalMileage: apiData.status?.exterior_status?.mileage ?? prev.totalMileage,
  isCharging: (apiData.status?.soc_status?.charge_state ?? 0) === 1.0,

  gpsLongitude: apiData.status?.position_status?.longitude ?? prev.gpsLongitude,
  gpsLatitude: apiData.status?.position_status?.latitude ?? prev.gpsLatitude,

  petMode: (apiData.status?.offcar_mode_status?.pet_mode ?? 0) > 0,
  powerHoldMode: (apiData.status?.offcar_mode_status?.power_hold_mode ?? 0) > 0,
  campingMode: (apiData.status?.offcar_mode_status?.camping_mode ?? 0) > 0,
  defenderMode: (apiData.status?.offcar_mode_status?.defender_mode ?? 0) > 0,
  remoteVideo: (apiData.status?.offcar_mode_status?.remote_video ?? 0) > 0,

  insideTemp: apiData.status?.climate_status?.inside_temp
    ?? apiData.status?.hvac_status?.temperature
    ?? prev.insideTemp,
  outsideTemp: apiData.status?.climate_status?.outside_temp
    ?? apiData.status?.hvac_status?.outside_temperature
    ?? prev.outsideTemp,
  acOn: apiData.status?.climate_status?.ac_on
    ?? apiData.status?.hvac_status?.air_conditioner_on
    ?? prev.acOn,

  steeringWheelHeat: apiData.status?.climate_status?.steering_wheel_heat_level
    ?? apiData.status?.heating_status?.steer_wheel_heat_sts
    ?? prev.steeringWheelHeat,
  frontLeftHeat: apiData.status?.climate_status?.front_left_heat_level
    ?? apiData.status?.heating_status?.seat_heat_frnt_le_sts
    ?? prev.frontLeftHeat,
  frontRightHeat: apiData.status?.climate_status?.front_right_heat_level
    ?? apiData.status?.heating_status?.seat_heat_frnt_ri_sts
    ?? prev.frontRightHeat,
  rearLeftHeat: apiData.status?.climate_status?.rear_left_heat_level
    ?? apiData.status?.heating_status?.seat_heat_re_le_sts
    ?? prev.rearLeftHeat,
  rearRightHeat: apiData.status?.climate_status?.rear_right_heat_level
    ?? apiData.status?.heating_status?.seat_heat_re_ri_sts
    ?? prev.rearRightHeat,
  thirdRowLeftHeat: apiData.status?.climate_status?.third_row_left_heat_level
    ?? apiData.status?.heating_status?.seat_heat_thrd_le_sts
    ?? prev.thirdRowLeftHeat,
  thirdRowRightHeat: apiData.status?.climate_status?.third_row_right_heat_level
    ?? apiData.status?.heating_status?.seat_heat_thrd_ri_sts
    ?? prev.thirdRowRightHeat,
  frontLeftVent: apiData.status?.climate_status?.front_left_vent_level
    ?? apiData.status?.heating_status?.seat_vent_frnt_le_sts
    ?? prev.frontLeftVent,
  frontRightVent: apiData.status?.climate_status?.front_right_vent_level
    ?? apiData.status?.heating_status?.seat_vent_frnt_ri_sts
    ?? prev.frontRightVent,
  rearLeftVent: apiData.status?.climate_status?.rear_left_vent_level
    ?? apiData.status?.heating_status?.seat_vent_re_le_sts
    ?? prev.rearLeftVent,
  rearRightVent: apiData.status?.climate_status?.rear_right_vent_level
    ?? apiData.status?.heating_status?.seat_vent_re_ri_sts
    ?? prev.rearRightVent,

  chargingPower: apiData.status?.soc_status?.charging_power ?? prev.chargingPower,
  chargingCurrent: apiData.status?.soc_status?.charging_current ?? prev.chargingCurrent,
  chargingVoltage: apiData.status?.soc_status?.charging_voltage ?? prev.chargingVoltage,
  chrgReq: apiData.status?.soc_status?.chrg_req ?? prev.chrgReq,

  cdcConnected: apiData.status?.connection_status?.cdc_connected ?? prev.cdcConnected,
  adcConnected: apiData.status?.connection_status?.adc_connected ?? prev.adcConnected,
  accountId: apiData.status?.connection_status?.account_id
    ?? apiData.status?.offcar_mode_status?.pw_hold_acc_id
    ?? apiData.status?.maintain_status?.account_id
    ?? prev.accountId,

  fotaVersion: apiData.status?.fota_status?.current_version ?? prev.fotaVersion,
  fotaPartNumber: apiData.status?.fota_status?.current_part_number
    ?? apiData.status?.fota_status?.part_number
    ?? prev.fotaPartNumber,
  fotaIsLatest: apiData.status?.fota_status?.available_update != null
    ? !apiData.status.fota_status.available_update
    : apiData.status?.fota_status?.is_latest ?? prev.fotaIsLatest,

  frontLeftWindow: apiData.status?.door_status?.front_left_window
    ?? apiData.status?.window_status?.win_front_left_posn
    ?? prev.frontLeftWindow,
  frontRightWindow: apiData.status?.door_status?.front_right_window
    ?? apiData.status?.window_status?.win_front_right_posn
    ?? prev.frontRightWindow,
  rearLeftWindow: apiData.status?.door_status?.rear_left_window
    ?? apiData.status?.window_status?.win_rear_left_posn
    ?? prev.rearLeftWindow,
  rearRightWindow: apiData.status?.door_status?.rear_right_window
    ?? apiData.status?.window_status?.win_rear_right_posn
    ?? prev.rearRightWindow,
  frontTrunk: apiData.status?.door_status?.front_trunk
    ?? apiData.status?.window_status?.sun_roof_posn
    ?? prev.frontTrunk,

  doorFrontLeft: apiData.status?.door_status?.front_left_door
    ?? apiData.status?.door_status?.door_ajar_front_left_status
    ?? prev.doorFrontLeft,
  doorFrontRight: apiData.status?.door_status?.front_right_door
    ?? apiData.status?.door_status?.door_ajar_front_right_status
    ?? prev.doorFrontRight,
  doorRearLeft: apiData.status?.door_status?.rear_left_door
    ?? apiData.status?.door_status?.door_ajar_rear_left_status
    ?? prev.doorRearLeft,
  doorRearRight: apiData.status?.door_status?.rear_right_door
    ?? apiData.status?.door_status?.door_ajar_rear_right_status
    ?? prev.doorRearRight,
  engineHood: apiData.status?.door_status?.engine_hood
    ?? apiData.status?.door_status?.engine_hood_ajar_status
    ?? prev.engineHood,
  tailgate: apiData.status?.door_status?.tailgate
    ?? apiData.status?.door_status?.tailgate_ajar_status
    ?? prev.tailgate,
  chargePort: apiData.status?.door_status?.charge_port
    ?? apiData.status?.door_status?.second_charge_port_ajar_status
    ?? prev.chargePort,

  isLocked: apiData.status?.door_status?.door_lock != null
    ? apiData.status.door_status.door_lock === 1
    : apiData.status?.door_status?.vehicle_lock_status ?? prev.isLocked,
});
```

- [ ] **Step 2: Import mapping in App**

In `src/App.tsx`, add this import near the other imports:

```ts
import { mapNioApiDataToWidgetState, type WidgetDataState } from './utils/mapNioApiData';
```

Then remove the local `interface WidgetDataState { ... }` declaration from `src/App.tsx`.

- [ ] **Step 3: Replace injected-data mapping block**

In the injected data `useEffect`, replace the long `setWidgetData(prev => ({ ... }))` block with:

```ts
setWidgetData(prev => mapNioApiDataToWidgetState(prev, apiData));
```

Keep the surrounding `if`, `console.log`, and `setLastUpdate(new Date().toLocaleString())`.

- [ ] **Step 4: Replace updateFromAPI mapping block**

Inside `updateFromAPI`, replace the long `setWidgetData(prev => ({ ... }))` block with:

```ts
setWidgetData(prev => mapNioApiDataToWidgetState(prev, apiData));
```

Keep `setLastUpdate(new Date().toLocaleString())` after it.

- [ ] **Step 5: Run TypeScript build**

Run:

```bash
npm run build
```

Expected: build succeeds. If TypeScript reports that the local `WidgetDataState` conflicts with the imported type, verify the local interface was removed.

- [ ] **Step 6: Commit mapping extraction**

Run:

```bash
git add src/App.tsx src/utils/mapNioApiData.ts
git commit -m "refactor: extract NIO widget data mapping"
```

---

### Task 3: Make App updateFromAPI use saved request config

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/config/nioRequestConfig.ts`

- [ ] **Step 1: Import config helpers in App**

In `src/App.tsx`, add:

```ts
import {
  buildNioRequestUrl,
  loadNioRequestConfig,
  validateNioRequestConfig,
  type NioRequestConfig,
} from './config/nioRequestConfig';
```

- [ ] **Step 2: Add request config state**

In `App` near the existing localStorage-backed state declarations, add:

```ts
const [nioRequestConfig, setNioRequestConfig] = useState<NioRequestConfig>(() => loadNioRequestConfig());
```

- [ ] **Step 3: Replace hardcoded URL and headers in updateFromAPI**

Replace the start of `updateFromAPI` with:

```ts
const updateFromAPI = async (config: NioRequestConfig = nioRequestConfig) => {
  setUpdating(true);

  const validation = validateNioRequestConfig(config);
  if (!validation.valid) {
    alert(`请求配置不完整：${validation.errors.join('，')}`);
    setUpdating(false);
    return false;
  }

  const url = buildNioRequestUrl(config);
  const headers = config.headers;
```

At the successful end of the `if (data.result_code === 'success' && data.data)` block, return `true`:

```ts
setLastUpdate(new Date().toLocaleString());
return true;
```

If `result_code` is not success, add after the `if` block:

```ts
alert(`NIO API 返回异常：${JSON.stringify(data).slice(0, 300)}`);
return false;
```

In the `catch` block, replace the existing alert with:

```ts
alert(`获取数据失败：${error instanceof Error ? error.message : String(error)}`);
return false;
```

After the catch/finally-style area, ensure `setUpdating(false)` still runs. The simplest full function shape should be:

```ts
const updateFromAPI = async (config: NioRequestConfig = nioRequestConfig) => {
  setUpdating(true);

  const validation = validateNioRequestConfig(config);
  if (!validation.valid) {
    alert(`请求配置不完整：${validation.errors.join('，')}`);
    setUpdating(false);
    return false;
  }

  const url = buildNioRequestUrl(config);
  const headers = config.headers;

  try {
    const response = await fetch(url, { headers, method: 'GET' });
    const data = await response.json();

    if (data.result_code === 'success' && data.data) {
      const apiData = data.data;
      setWidgetData(prev => mapNioApiDataToWidgetState(prev, apiData));
      setLastUpdate(new Date().toLocaleString());
      return true;
    }

    alert(`NIO API 返回异常：${JSON.stringify(data).slice(0, 300)}`);
    return false;
  } catch (error) {
    console.error('Failed to fetch from NIO API:', error);
    alert(`获取数据失败：${error instanceof Error ? error.message : String(error)}`);
    return false;
  } finally {
    setUpdating(false);
  }
};
```

- [ ] **Step 4: Run TypeScript build**

Run:

```bash
npm run build
```

Expected: build succeeds. If React warns about `headers` type, change fetch call to:

```ts
const response = await fetch(url, { headers: headers as HeadersInit, method: 'GET' });
```

- [ ] **Step 5: Commit config-driven update**

Run:

```bash
git add src/App.tsx src/config/nioRequestConfig.ts
git commit -m "feat: use saved NIO request config for updates"
```

---

### Task 4: Add request config panel component

**Files:**
- Create: `src/components/NioRequestConfigPanel.tsx`

- [ ] **Step 1: Create panel component**

Create `src/components/NioRequestConfigPanel.tsx` with this content:

```tsx
import React, { useMemo, useState } from 'react';
import {
  DEFAULT_NIO_REQUEST_CONFIG,
  normalizeNioRequestConfig,
  resetNioRequestConfig,
  saveNioRequestConfig,
  validateNioRequestConfig,
  type NioRequestConfig,
} from '../config/nioRequestConfig';

interface NioRequestConfigPanelProps {
  config: NioRequestConfig;
  updating: boolean;
  onChange: (config: NioRequestConfig) => void;
  onTest: (config: NioRequestConfig) => Promise<boolean>;
}

const QUERY_FIELDS = [
  'lang',
  'app_id',
  'timestamp',
  'app_ver',
  'device_id',
  'widget_functions',
  'widget_size',
  'region',
  'vehicle_id',
  'sign',
];

const HEADER_FIELDS = [
  'Accept',
  'User-Agent',
  'Authorization',
  'Accept-Language',
];

const formatConfigJson = (config: NioRequestConfig) => JSON.stringify(config, null, 2);

const FieldInput: React.FC<{
  label: string;
  value: string;
  type?: 'text' | 'password';
  onChange: (value: string) => void;
}> = ({ label, value, type = 'text', onChange }) => (
  <label className="flex flex-col gap-[4px] text-[12px] text-[#444444] font-jetbrains">
    <span>{label}</span>
    <input
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="px-[8px] py-[5px] border border-gray-300 rounded text-[12px] font-jetbrains bg-white"
    />
  </label>
);

const NioRequestConfigPanel: React.FC<NioRequestConfigPanelProps> = ({
  config,
  updating,
  onChange,
  onTest,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);
  const [showAuthorization, setShowAuthorization] = useState(false);
  const [jsonText, setJsonText] = useState(() => formatConfigJson(config));
  const [status, setStatus] = useState('');
  const [jsonError, setJsonError] = useState('');

  const validation = useMemo(() => validateNioRequestConfig(config), [config]);

  const updateQueryField = (key: string, value: string) => {
    const next = {
      ...config,
      query: {
        ...config.query,
        [key]: value,
      },
    };
    onChange(next);
    setJsonText(formatConfigJson(next));
    setStatus('配置已修改，记得保存');
  };

  const updateHeaderField = (key: string, value: string) => {
    const next = {
      ...config,
      headers: {
        ...config.headers,
        [key]: value,
      },
    };
    onChange(next);
    setJsonText(formatConfigJson(next));
    setStatus('配置已修改，记得保存');
  };

  const handleSave = () => {
    saveNioRequestConfig(config);
    setJsonText(formatConfigJson(config));
    setJsonError('');
    setStatus('配置已保存');
  };

  const handleReset = () => {
    const next = resetNioRequestConfig();
    onChange(next);
    setJsonText(formatConfigJson(next));
    setJsonError('');
    setStatus('已恢复默认配置');
  };

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const next = normalizeNioRequestConfig(parsed);
      onChange(next);
      saveNioRequestConfig(next);
      setJsonText(formatConfigJson(next));
      setJsonError('');
      setStatus('高级 JSON 已保存');
    } catch (error) {
      setJsonError(error instanceof Error ? error.message : String(error));
      setStatus('');
    }
  };

  const handleTest = async () => {
    setStatus('正在测试请求...');
    const ok = await onTest(config);
    setStatus(ok ? '测试成功，widgets 已更新' : '测试失败，请检查配置或控制台错误');
  };

  return (
    <div className="mb-[16px] border border-gray-300 rounded bg-white/70 font-jetbrains">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full px-[12px] py-[8px] flex items-center justify-between text-left text-[#222222] text-[13px] font-bold"
      >
        <span>请求配置</span>
        <span className="text-[12px] text-[#666666]">{expanded ? '收起' : '展开'}</span>
      </button>

      {expanded && (
        <div className="px-[12px] pb-[12px] border-t border-gray-200">
          <div className="mt-[12px] grid grid-cols-2 gap-[10px]">
            <div>
              <div className="text-[12px] font-bold text-[#222222] mb-[8px]">Query 参数</div>
              <div className="grid grid-cols-2 gap-[8px]">
                {QUERY_FIELDS.map((field) => (
                  <FieldInput
                    key={field}
                    label={field}
                    value={config.query[field] ?? ''}
                    onChange={(value) => updateQueryField(field, value)}
                  />
                ))}
              </div>
            </div>

            <div>
              <div className="text-[12px] font-bold text-[#222222] mb-[8px]">Headers</div>
              <div className="grid grid-cols-1 gap-[8px]">
                {HEADER_FIELDS.map((field) => (
                  <div key={field} className="flex gap-[8px] items-end">
                    <div className="flex-1">
                      <FieldInput
                        label={field}
                        type={field === 'Authorization' && !showAuthorization ? 'password' : 'text'}
                        value={config.headers[field] ?? ''}
                        onChange={(value) => updateHeaderField(field, value)}
                      />
                    </div>
                    {field === 'Authorization' && (
                      <button
                        type="button"
                        onClick={() => setShowAuthorization(!showAuthorization)}
                        className="px-[8px] py-[5px] border border-gray-300 rounded text-[12px] text-[#444444]"
                      >
                        {showAuthorization ? '隐藏' : '显示'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {!validation.valid && (
            <div className="mt-[10px] text-[12px] text-red-600">
              配置不完整：{validation.errors.join('，')}
            </div>
          )}

          <div className="mt-[12px] flex items-center gap-[8px]">
            <button
              type="button"
              onClick={handleSave}
              className="px-[12px] py-[6px] bg-[#111111] text-white rounded text-[12px]"
            >
              保存配置
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-[12px] py-[6px] border border-gray-300 rounded text-[12px] text-[#444444]"
            >
              重置默认
            </button>
            <button
              type="button"
              onClick={handleTest}
              disabled={updating}
              className="px-[12px] py-[6px] bg-blue-600 text-white rounded text-[12px] disabled:opacity-50"
            >
              {updating ? '测试中...' : '测试请求'}
            </button>
            <span className="text-[12px] text-[#555555]">{status}</span>
          </div>

          <div className="mt-[12px]">
            <button
              type="button"
              onClick={() => {
                setAdvancedExpanded(!advancedExpanded);
                setJsonText(formatConfigJson(config));
              }}
              className="text-[12px] text-blue-700 underline"
            >
              {advancedExpanded ? '收起高级 JSON' : '展开高级 JSON'}
            </button>

            {advancedExpanded && (
              <div className="mt-[8px]">
                <textarea
                  value={jsonText}
                  onChange={(event) => setJsonText(event.target.value)}
                  className="w-full min-h-[220px] px-[8px] py-[8px] border border-gray-300 rounded text-[12px] font-jetbrains"
                  spellCheck={false}
                />
                {jsonError && (
                  <div className="mt-[6px] text-[12px] text-red-600">JSON 错误：{jsonError}</div>
                )}
                <div className="mt-[8px] flex gap-[8px]">
                  <button
                    type="button"
                    onClick={handleApplyJson}
                    className="px-[12px] py-[6px] bg-[#111111] text-white rounded text-[12px]"
                  >
                    保存高级 JSON
                  </button>
                  <button
                    type="button"
                    onClick={() => setJsonText(formatConfigJson(DEFAULT_NIO_REQUEST_CONFIG))}
                    className="px-[12px] py-[6px] border border-gray-300 rounded text-[12px] text-[#444444]"
                  >
                    填入默认 JSON
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NioRequestConfigPanel;
```

- [ ] **Step 2: Run TypeScript build**

Run:

```bash
npm run build
```

Expected: build succeeds. If Tailwind class generation is fine, no CSS-specific errors should appear because these are static class names.

- [ ] **Step 3: Commit panel component**

Run:

```bash
git add src/components/NioRequestConfigPanel.tsx
git commit -m "feat: add NIO request config panel"
```

---

### Task 5: Wire config panel into App

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Import panel in App**

In `src/App.tsx`, add:

```ts
import NioRequestConfigPanel from './components/NioRequestConfigPanel';
```

- [ ] **Step 2: Add test handler**

Below `updateFromAPI`, add:

```ts
const testNioRequestConfig = async (config: NioRequestConfig) => {
  return updateFromAPI(config);
};
```

- [ ] **Step 3: Render panel below top controls**

Find the top control area that contains the buttons “从NIO API更新数据” and “推送所有图片到设备”. Immediately after that control block and before widget rows, render:

```tsx
<NioRequestConfigPanel
  config={nioRequestConfig}
  updating={updating}
  onChange={setNioRequestConfig}
  onTest={testNioRequestConfig}
/>
```

If the surrounding JSX has a wrapper for the toolbar, place the panel after that wrapper so the panel spans the same content width as the widgets.

- [ ] **Step 4: Ensure existing update button still works**

Confirm the existing button remains:

```tsx
<button
  onClick={() => updateFromAPI()}
  disabled={updating}
  className="..."
>
  {updating ? '更新中...' : '从NIO API更新数据'}
</button>
```

If TypeScript complains that `onClick` expects a mouse handler and receives a Promise-returning function, use the wrapper shown above.

- [ ] **Step 5: Run TypeScript build**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 6: Commit App wiring**

Run:

```bash
git add src/App.tsx
git commit -m "feat: wire NIO request config into dashboard"
```

---

### Task 6: Verify behavior manually and polish errors

**Files:**
- Modify if needed: `src/App.tsx`
- Modify if needed: `src/components/NioRequestConfigPanel.tsx`
- Modify if needed: `src/config/nioRequestConfig.ts`

- [ ] **Step 1: Start the app**

Run:

```bash
npm run dev
```

Expected: Vite starts on `http://localhost:3000` or the next available port.

- [ ] **Step 2: Open the page**

Open the local URL in a browser.

Expected:

- Dashboard renders.
- “请求配置” panel appears below the top controls.
- Panel is collapsed by default.

- [ ] **Step 3: Verify localStorage save and reload**

In the browser:

1. Expand “请求配置”.
2. Change `app_ver` to `6.3.0-test`.
3. Click “保存配置”.
4. Refresh page.

Expected: `app_ver` still shows `6.3.0-test`.

Then change it back to `6.3.0` and save.

- [ ] **Step 4: Verify Authorization masking**

In the browser:

1. Confirm `Authorization` input displays masked characters.
2. Click “显示”.
3. Confirm the text is visible.
4. Click “隐藏”.
5. Confirm it is masked again.

- [ ] **Step 5: Verify advanced JSON accepts unknown fields**

In the browser:

1. Expand “高级 JSON”.
2. Add this field under `query`:

```json
"debug_unknown_field": "1"
```

3. Click “保存高级 JSON”.
4. Collapse and expand “高级 JSON”.

Expected: `debug_unknown_field` is still present.

- [ ] **Step 6: Verify invalid JSON does not overwrite config**

In the advanced JSON textarea, replace the content with:

```json
{
  "query":
```

Click “保存高级 JSON”.

Expected:

- UI shows `JSON 错误：...`.
- Common fields in the form remain unchanged.
- Reloading the page still shows the last valid saved config.

- [ ] **Step 7: Verify validation blocks missing Authorization**

Clear the `Authorization` field and click “测试请求”.

Expected: UI or alert reports `缺少 Authorization header`, and no request is sent.

Restore the Authorization value from the default config or saved value after this check.

- [ ] **Step 8: Verify request update path**

Click “测试请求”.

Expected if the stored NIO token/sign are valid:

- Status changes to “测试成功，widgets 已更新”.
- `lastUpdate` changes.

Expected if token/sign are stale:

- UI reports failure with HTTP/NIO error.
- App does not crash.

- [ ] **Step 9: Verify existing update button uses same config**

Change a harmless query field such as `app_ver`, save, and click “从NIO API更新数据”.

Expected: request uses the saved config. If the request fails because the server rejects the modified field, restore the field and confirm the original config behavior returns.

- [ ] **Step 10: Stop dev server**

Stop the running Vite process with `Ctrl+C`.

- [ ] **Step 11: Run final build**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 12: Commit any manual polish**

If manual verification required fixes, commit them:

```bash
git add src/App.tsx src/components/NioRequestConfigPanel.tsx src/config/nioRequestConfig.ts
git commit -m "fix: polish NIO request config behavior"
```

If no files changed, skip this commit.

---

### Task 7: Push implementation commits

**Files:**
- No source edits expected.

- [ ] **Step 1: Check status**

Run:

```bash
git status -sb
```

Expected: clean working tree or only intentional uncommitted verification artifacts. Do not push with unexpected changes.

- [ ] **Step 2: Push commits**

Run:

```bash
git push origin main
```

Expected: local `main` is pushed to `origin/main`.

- [ ] **Step 3: Report final state**

Report:

- commits created
- build result
- manual verification result
- GitHub push result

---

## Self-Review

- Spec coverage: covered collapsible panel, localStorage, form fields, Authorization password input, advanced JSON with unknown fields, test request, existing update button reuse, error handling, and build/manual verification.
- Placeholder scan: no TBD/TODO/fill-in placeholders remain.
- Type consistency: `NioRequestConfig`, `WidgetDataState`, `mapNioApiDataToWidgetState`, `buildNioRequestUrl`, and `validateNioRequestConfig` are consistently named across tasks.
