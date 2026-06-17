export interface NioRequestConfig {
  query: Record<string, string>;
  headers: Record<string, string>;
}

export interface NioConfigValidationResult {
  valid: boolean;
  errors: string[];
}

export const NIO_REQUEST_CONFIG_STORAGE_KEY = 'nio_dashboard_request_config';

export const DEFAULT_NIO_REQUEST_CONFIG: NioRequestConfig = Object.freeze({
  query: Object.freeze({
    lang: 'zh-CN',
    app_id: '10002',
    timestamp: '1774198476',
    app_ver: '6.3.0',
    device_id: '14e3f556d3984993a59ad96e8af3ba2d',
    widget_functions: 'rvs_set_doorlock,rvs_set_air_conditioner,rvs_set_tailgate,rvs_exe_findme',
    widget_size: 'medium',
    region: 'cn',
    vehicle_id: 'c36736658c7b4b7e8d5a484b8f908b43',
    sign: '7165a503f129317c909169732c6260de'
  }),
  headers: Object.freeze({
    Accept: 'application/json,text/json,text/plain',
    'User-Agent': 'VehicleWidgetExtension/6.3.0 (com.do1.WeiLaiApp.NIOVehicleWidget; build:2586; iOS 26.3.1) Alamofire/5.9.1',
    Authorization: 'Bearer 2.0IkLw1IayXSA5CD32/1MdpTe9sF9zhR5BPmTEA3a2JX0=',
    'Accept-Language': 'zh-CN,zh-Hans;q=0.9'
  })
});

const cloneDefaultNioRequestConfig = (): NioRequestConfig => ({
  query: { ...DEFAULT_NIO_REQUEST_CONFIG.query },
  headers: { ...DEFAULT_NIO_REQUEST_CONFIG.headers }
});

const canUseLocalStorage = (): boolean => {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
};

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  return String(value);
}

export function normalizeNioRequestConfig(value: unknown): NioRequestConfig {
  if (!value || typeof value !== 'object') {
    return cloneDefaultNioRequestConfig();
  }

  const config = value as Partial<NioRequestConfig>;
  const normalized: NioRequestConfig = {
    query: {},
    headers: {}
  };

  // Normalize query parameters
  if (config.query && typeof config.query === 'object') {
    Object.entries(config.query).forEach(([key, val]) => {
      normalized.query[key] = normalizeValue(val);
    });
  }

  // Normalize headers
  if (config.headers && typeof config.headers === 'object') {
    Object.entries(config.headers).forEach(([key, val]) => {
      normalized.headers[key] = normalizeValue(val);
    });
  }

  // Merge with defaults for missing fields
  return {
    query: { ...DEFAULT_NIO_REQUEST_CONFIG.query, ...normalized.query },
    headers: { ...DEFAULT_NIO_REQUEST_CONFIG.headers, ...normalized.headers }
  };
}

export function loadNioRequestConfig(): NioRequestConfig {
  if (!canUseLocalStorage()) {
    return cloneDefaultNioRequestConfig();
  }

  try {
    const stored = window.localStorage.getItem(NIO_REQUEST_CONFIG_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return normalizeNioRequestConfig(parsed);
    }
  } catch (error) {
    console.error('Failed to load NIO request config:', error);
  }
  return cloneDefaultNioRequestConfig();
}

export function saveNioRequestConfig(config: NioRequestConfig): void {
  if (!canUseLocalStorage()) {
    return;
  }

  try {
    const normalized = normalizeNioRequestConfig(config);
    window.localStorage.setItem(NIO_REQUEST_CONFIG_STORAGE_KEY, JSON.stringify(normalized));
  } catch (error) {
    console.error('Failed to save NIO request config:', error);
  }
}

export function resetNioRequestConfig(): NioRequestConfig {
  if (canUseLocalStorage()) {
    window.localStorage.removeItem(NIO_REQUEST_CONFIG_STORAGE_KEY);
  }

  return cloneDefaultNioRequestConfig();
}

export function buildNioRequestUrl(config: NioRequestConfig): string {
  const params = new URLSearchParams();

  Object.entries(config.query).forEach(([key, value]) => {
    if (key.trim() !== '' && value.trim() !== '') {
      params.append(key, value.trim());
    }
  });

  return `/nio-api/app/api/icar/v2/widget/info?${params.toString()}`;
}

export function validateNioRequestConfig(config: NioRequestConfig): NioConfigValidationResult {
  const errors: string[] = [];

  if (!config.headers.Authorization || config.headers.Authorization.trim() === '') {
    errors.push('Authorization header is required');
  }

  if (!config.query.vehicle_id || config.query.vehicle_id.trim() === '') {
    errors.push('vehicle_id query parameter is required');
  }

  if (!config.query.sign || config.query.sign.trim() === '') {
    errors.push('sign query parameter is required');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}