import React, { useState } from 'react';
import { X, Code, Play, Copy, Check, Server, RefreshCw } from 'lucide-react';
import { getHexagonsInArea, getHexagonByH3Index, getLeaderboard, getApiMode, setApiMode } from '../services/api.js';

export function ApiExplorerModal({ onClose, currentH3Index }) {
  const [selectedEndpoint, setSelectedEndpoint] = useState('area');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [responseJson, setResponseJson] = useState(null);

  const mode = getApiMode();
  const [isMockMode, setIsMockMode] = useState(mode.isMock);
  const [backendUrl, setBackendUrl] = useState(mode.baseUrl);

  const handleExecute = async () => {
    setLoading(true);
    setResponseJson(null);
    try {
      let data = null;
      if (selectedEndpoint === 'area') {
        data = await getHexagonsInArea({
          lat: 55.79639,
          lng: 49.10889,
          radius: 3,
          resolution: 8
        });
      } else if (selectedEndpoint === 'detail') {
        const targetH3 = currentH3Index || '881108221bfffff';
        data = await getHexagonByH3Index(targetH3);
      } else if (selectedEndpoint === 'leaderboard') {
        data = await getLeaderboard(10, 'runners');
      }
      setResponseJson(data);
    } catch (err) {
      setResponseJson({ error: err.message });
    }
    setLoading(false);
  };

  const handleToggleMode = (newMock) => {
    setIsMockMode(newMock);
    setApiMode(newMock, backendUrl);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getEndpointSpec = () => {
    if (selectedEndpoint === 'area') {
      return {
        method: 'GET',
        path: '/api/v1/hexagons/area',
        params: 'lat=55.79639&lng=49.10889&radius=3&resolution=8',
        desc: 'Массив H3 ячеек в радиусе вокруг указанных координат Казани'
      };
    }
    if (selectedEndpoint === 'detail') {
      return {
        method: 'GET',
        path: `/api/v1/hexagons/${currentH3Index || '881108221bfffff'}`,
        params: 'Path parameter: h3_index',
        desc: 'Детальная карточка ячейки при клике (история, статы, владелец)'
      };
    }
    return {
      method: 'GET',
      path: '/api/v1/leaderboard',
      params: 'limit=10&type=runners',
      desc: 'Топ-10 бегунов или клубов Казани по числу удержанных ячеек'
    };
  };

  const spec = getEndpointSpec();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-2xl panel-industrial rounded-2xl border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-3.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="w-4 h-4 text-orange-500" />
            <h3 className="font-heading font-semibold text-zinc-100 text-sm">RunUram REST API Spec</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Mode Toggle */}
        <div className="px-4 py-2.5 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-zinc-500">Source:</span>
            <div className="flex items-center bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
              <button
                onClick={() => handleToggleMode(true)}
                className={`px-2.5 py-0.5 rounded-md font-semibold transition-colors ${
                  isMockMode ? 'bg-zinc-800 text-orange-400 border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Mock Engine
              </button>
              <button
                onClick={() => handleToggleMode(false)}
                className={`px-2.5 py-0.5 rounded-md font-semibold transition-colors ${
                  !isMockMode ? 'bg-zinc-800 text-emerald-400 border border-zinc-700' : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                Backend REST Proxy
              </button>
            </div>
          </div>

          {!isMockMode && (
            <input
              type="text"
              value={backendUrl}
              onChange={(e) => {
                setBackendUrl(e.target.value);
                setApiMode(false, e.target.value);
              }}
              className="bg-zinc-900 border border-zinc-800 text-zinc-200 rounded px-2 py-0.5 text-xs font-mono"
            />
          )}
        </div>

        {/* Main Explorer Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Endpoint Tabs */}
          <div className="grid grid-cols-3 gap-2 font-mono">
            <button
              onClick={() => setSelectedEndpoint('area')}
              className={`p-2.5 rounded-xl border text-left transition-colors ${
                selectedEndpoint === 'area'
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-100 font-bold'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900/50'
              }`}
            >
              <span className="text-[10px] text-orange-400 block font-bold">GET</span>
              <span className="text-[11px]">/hexagons/area</span>
            </button>

            <button
              onClick={() => setSelectedEndpoint('detail')}
              className={`p-2.5 rounded-xl border text-left transition-colors ${
                selectedEndpoint === 'detail'
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-100 font-bold'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900/50'
              }`}
            >
              <span className="text-[10px] text-orange-400 block font-bold">GET</span>
              <span className="text-[11px]">/hexagons/{'{h3}'}</span>
            </button>

            <button
              onClick={() => setSelectedEndpoint('leaderboard')}
              className={`p-2.5 rounded-xl border text-left transition-colors ${
                selectedEndpoint === 'leaderboard'
                  ? 'bg-zinc-900 border-zinc-700 text-zinc-100 font-bold'
                  : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:bg-zinc-900/50'
              }`}
            >
              <span className="text-[10px] text-orange-400 block font-bold">GET</span>
              <span className="text-[11px]">/leaderboard</span>
            </button>
          </div>

          {/* Endpoint Details Card */}
          <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2 font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-bold text-[10px]">
                  {spec.method}
                </span>
                <span className="text-xs text-zinc-200 font-bold">{spec.path}</span>
              </div>
              <button
                onClick={handleExecute}
                disabled={loading}
                className="px-3 py-1 rounded-lg bg-orange-500 hover:bg-orange-400 text-zinc-950 font-heading font-semibold text-xs transition-colors flex items-center gap-1 shadow-sm"
              >
                {loading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-zinc-950" />}
                Execute
              </button>
            </div>
            <p className="text-[11px] font-sans text-zinc-400">{spec.desc}</p>
            <div className="text-[11px] text-zinc-500 bg-zinc-950 p-2 rounded-lg border border-zinc-800/80">
              Query: {spec.params}
            </div>
          </div>

          {/* Response Output */}
          <div>
            <div className="flex items-center justify-between mb-1.5 font-mono text-[11px]">
              <span className="text-zinc-500 uppercase">JSON Output:</span>
              {responseJson && (
                <button
                  onClick={() => copyToClipboard(JSON.stringify(responseJson, null, 2))}
                  className="text-orange-400 hover:underline flex items-center gap-1"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy JSON'}
                </button>
              )}
            </div>
            <pre className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-orange-300 font-mono text-[11px] overflow-x-auto max-h-64 leading-relaxed">
              {responseJson
                ? JSON.stringify(responseJson, null, 2)
                : '// Click "Execute" to fetch live JSON payload'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
