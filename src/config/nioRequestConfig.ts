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
    app_id: 'nioapp',
    timestamp: Date.now().toString(),
    app_ver: '2.0.0',
    device_id: 'default-device-id',
    widget_functions: 'get_widget_info',
    widget_size: 'medium',
    region: 'cn',
    vehicle_id: '',
    sign: ''
  },
  headers: {
    Accept: 'application/json, text/plain, */*',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    Authorization: 'Bearer default-token',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
  }
};

function normalizeValue(value: unknown): string {
  if (value === null || value === undefined || value === '') {
    return '';
  }
  return String(value);
}

export function normalizeNioRequestConfig(value: unknown): NioRequestConfig {
  if (!value || typeof value !== 'object') {
    return { ...DEFAULT_NIO_REQUEST_CONFIG };
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
  try {
    const stored = window.localStorage.getItem(NIO_REQUEST_CONFIG_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return normalizeNioRequestConfig(parsed);
    }
  } catch (error) {
    console.error('Failed to load NIO request config:', error);
  }
  return { ...DEFAULT_NIO_REQUEST_CONFIG };
}

export function saveNioRequestConfig(config: NioRequestConfig): void {
  try {
    const normalized = normalizeNioRequestConfig(config);
    window.localStorage.setItem(NIO_REQUEST_CONFIG_STORAGE_KEY, JSON.stringify(normalized));
  } catch (error) {
    console.error('Failed to save NIO request config:', error);
  }
}

export function resetNioRequestConfig(): NioRequestConfig {
  window.localStorage.removeItem(NIO_REQUEST_CONFIG_STORAGE_KEY);
  return { ...DEFAULT_NIO_REQUEST_CONFIG };
}

export function buildNioRequestUrl(config: NioRequestConfig): string {
  const params = new URLSearchParams();

  Object.entries(config.query).forEach(([key, value]) => {
    if (value.trim() !== '') {
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