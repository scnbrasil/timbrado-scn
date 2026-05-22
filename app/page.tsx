'use client';

import { useState, useCallback, useRef } from 'react';

type Status = 'idle' | 'processing' | 'success' | 'error';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FEATURES = [
  { label: 'Suporte a .docx', color: '#005498' },
  { label: 'Processado no servidor, sem armazenamento', color: '#005498' },
  { label: 'Download imediato após o processamento', color: '#8B0A7E' },
];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    const name = f.name.toLowerCase();
    if (!name.endsWith('.docx')) {
      setErrorMessage('Apenas arquivos .docx são aceitos.');
      setStatus('error');
      return;
    }
    setFile(f);
    setStatus('idle');
    setErrorMessage('');
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      inputRef.current?.click();
    }
  }, []);

  const handleSubmit = async () => {
    if (!file) return;
    setStatus('processing');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/aplicar', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao processar o documento.');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `timbrado_${file.name.replace(/\.doc$/i, '.docx')}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro desconhecido.');
      setStatus('error');
    }
  };

  const isProcessing = status === 'processing';
  const isDisabled = !file || isProcessing;

  return (
    <div className="min-h-screen bg-[#f3f6fb] flex flex-col">
      {/* Barra de acento superior */}
      <div className="h-1 bg-gradient-to-r from-[#005498] via-[#8B0A7E] to-[#005498]" aria-hidden="true" />

      {/* Header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between">
          {/* Logo SCN */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-scn.png"
            alt="SCN — Parceiro Autorizado Serasa Experian"
            width={210}
            height={42}
            className="h-9 w-auto object-contain"
          />
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-400 border border-gray-200 rounded-full px-3 py-1 select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 motion-safe:animate-pulse" aria-hidden="true" />
            Serviço online
          </span>
        </div>
      </header>

      {/* Conteúdo principal */}
      <main id="main-content" className="flex-1 flex items-center justify-center px-4 py-10 sm:py-16">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-10 lg:gap-16 items-center">

          {/* Coluna esquerda: ilustração + copy */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-7">
            {/* Ilustração */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/doc-illustration.png"
              alt=""
              aria-hidden="true"
              width={240}
              height={240}
              className="w-36 sm:w-48 lg:w-60 object-contain drop-shadow-2xl select-none"
            />

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#005498] leading-tight text-balance">
                Aplicador de<br className="hidden sm:block" /> Timbrado Oficial
              </h1>
              <p className="text-gray-500 text-base leading-relaxed max-w-md">
                Envie seu documento Word e receba o arquivo com o cabeçalho e rodapé
                oficiais da SCN aplicados automaticamente.
              </p>
            </div>

            {/* Lista de benefícios */}
            <ul className="space-y-3 w-full max-w-xs lg:max-w-none" aria-label="Benefícios">
              {FEATURES.map(({ label, color }) => (
                <li key={label} className="flex items-center gap-3 text-sm text-gray-600">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: color + '1a' }}
                    aria-hidden="true"
                  >
                    <svg className="w-3 h-3" style={{ color }} fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* Coluna direita: card de upload */}
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/70 border border-gray-100 overflow-hidden">
            {/* Faixa colorida no topo do card */}
            <div
              className="h-1.5"
              style={{ background: 'linear-gradient(90deg, #005498, #8B0A7E)' }}
              aria-hidden="true"
            />

            <div className="p-7">
              <h2 className="text-base font-semibold text-gray-800 mb-5">
                Enviar documento
              </h2>

              {/* Zona de drop */}
              <div
                role="button"
                tabIndex={0}
                aria-label="Área de upload: arraste um .docx aqui, ou pressione Enter para selecionar"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => inputRef.current?.click()}
                onKeyDown={handleKeyDown}
                className={[
                  'relative border-2 border-dashed rounded-xl p-7 text-center cursor-pointer',
                  'transition-colors duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005498] focus-visible:ring-offset-2',
                  isDragging
                    ? 'border-[#005498] bg-blue-50/60'
                    : 'border-gray-200 hover:border-[#005498]/50 hover:bg-gray-50/60',
                ].join(' ')}
              >
                <label htmlFor="file-upload" className="sr-only">
                  Selecionar documento Word (.docx)
                </label>
                <input
                  id="file-upload"
                  ref={inputRef}
                  type="file"
                  accept=".docx"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                    e.target.value = '';
                  }}
                />

                <div className="flex flex-col items-center gap-3 pointer-events-none">
                  {file ? (
                    <>
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center"
                        style={{ backgroundColor: '#005498' + '18' }}
                      >
                        <svg className="w-6 h-6 text-[#005498]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <p className="font-semibold text-[#005498] text-sm leading-tight truncate max-w-[220px]">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatFileSize(file.size)}</p>
                      </div>
                      <p className="text-xs text-gray-400">Clique ou arraste para trocar</p>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, #005498, #8B0A7E)' + '18',
                                 backgroundColor: 'transparent',
                                 backgroundImage: 'linear-gradient(135deg, #005498 0%, #8B0A7E 100%)',
                                 opacity: 1 }}
                      >
                        <div
                          className="w-14 h-14 rounded-2xl flex items-center justify-center"
                          style={{ background: 'linear-gradient(135deg, rgba(0,84,152,0.12) 0%, rgba(139,10,126,0.12) 100%)' }}
                        >
                          <svg className="w-7 h-7 text-[#005498]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 text-sm">
                          Arraste seu documento aqui
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          ou{' '}
                          <span className="text-[#005498] font-medium">clique para selecionar</span>
                        </p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">.docx</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Região de status — acessível para leitores de tela */}
              <div aria-live="polite" aria-atomic="true" className="mt-4 empty:mt-0">
                {status === 'success' && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
                    <svg className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="text-emerald-800 text-sm font-semibold">Timbrado aplicado com sucesso!</p>
                      <p className="text-emerald-600 text-xs mt-0.5">O download foi iniciado automaticamente.</p>
                    </div>
                  </div>
                )}
                {status === 'error' && errorMessage && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3" role="alert">
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-700 text-sm leading-snug whitespace-pre-line">{errorMessage}</p>
                  </div>
                )}
              </div>

              {/* Botão principal */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isDisabled}
                aria-disabled={isDisabled}
                className={[
                  'mt-4 w-full py-3.5 rounded-xl font-semibold text-sm text-white',
                  'transition-opacity duration-150',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#005498] focus-visible:ring-offset-2',
                  isDisabled
                    ? 'opacity-40 cursor-not-allowed'
                    : 'opacity-100 hover:opacity-90 active:opacity-75 cursor-pointer',
                ].join(' ')}
                style={{
                  background: 'linear-gradient(135deg, #005498 0%, #0070cc 100%)',
                  boxShadow: isDisabled ? 'none' : '0 4px 14px rgba(0, 84, 152, 0.28)',
                }}
              >
                {isProcessing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg
                      className="h-4 w-4 motion-safe:animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processando…
                  </span>
                ) : (
                  'Aplicar Timbrado SCN'
                )}
              </button>

              <p className="mt-4 text-center text-xs text-gray-400 leading-relaxed">
                Processamento seguro &nbsp;·&nbsp; Arquivos não são armazenados
              </p>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-4 px-5 sm:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400">
          <span>© 2025 SCN Brasil. Todos os direitos reservados.</span>
          <div className="flex items-center gap-1" aria-hidden="true">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#005498' }} />
            <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: '#8B0A7E' }} />
          </div>
        </div>
      </footer>
    </div>
  );
}
