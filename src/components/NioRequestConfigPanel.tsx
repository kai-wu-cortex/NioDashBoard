import React, { useEffect, useMemo, useState } from 'react';
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

  useEffect(() => {
    setJsonText(formatConfigJson(config));
  }, [config]);

  const syncConfig = (next: NioRequestConfig, message: string) => {
    onChange(next);
    setJsonText(formatConfigJson(next));
    setJsonError('');
    setStatus(message);
  };

  const updateQueryField = (key: string, value: string) => {
    syncConfig({ ...config, query: { ...config.query, [key]: value } }, '配置已修改，记得保存');
  };

  const updateHeaderField = (key: string, value: string) => {
    syncConfig({ ...config, headers: { ...config.headers, [key]: value } }, '配置已修改，记得保存');
  };

  const handleSave = () => {
    saveNioRequestConfig(config);
    setJsonText(formatConfigJson(config));
    setJsonError('');
    setStatus('配置已保存');
  };

  const handleReset = () => {
    const next = resetNioRequestConfig();
    syncConfig(next, '已恢复默认配置');
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
