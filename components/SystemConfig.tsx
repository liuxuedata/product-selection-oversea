'use client';
import { useEffect, useState } from 'react';

export default function SystemConfig() {
  const [apiKey, setApiKey] = useState('');
  const [apiBase, setApiBase] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setApiKey(localStorage.getItem('ai_api_key') || '');
      setApiBase(localStorage.getItem('ai_api_base') || '');
    }
  }, []);

  return (
    <div className="space-y-4 text-sm">
      <div>
        <label className="block mb-1">AI API Key</label>
        <input
          value={apiKey}
          onChange={(e) => {
            setApiKey(e.target.value);
            if (typeof window !== 'undefined') {
              localStorage.setItem('ai_api_key', e.target.value);
            }
          }}
          className="border border-[var(--border)] rounded p-2 w-full"
        />
      </div>
      <div>
        <label className="block mb-1">API Base URL</label>
        <input
          value={apiBase}
          onChange={(e) => {
            setApiBase(e.target.value);
            if (typeof window !== 'undefined') {
              localStorage.setItem('ai_api_base', e.target.value);
            }
          }}
          placeholder="https://api.openai.com/v1"
          className="border border-[var(--border)] rounded p-2 w-full"
        />
      </div>
    </div>
  );
}
