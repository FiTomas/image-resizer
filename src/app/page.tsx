'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface ImageFile {
  file: File;
  preview: string;
  processed?: string;
  originalSize: number;
  processedSize?: number;
}

export default function Home() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [settings, setSettings] = useState({
    maxWidth: 1920,
    quality: 80,
    format: 'image/jpeg' as 'image/jpeg' | 'image/png' | 'image/webp',
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newImages = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      originalSize: file.size,
    }));
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
  });

  const processImages = async () => {
    setIsProcessing(true);
    const processed = await Promise.all(
      images.map(async (img) => {
        return new Promise<ImageFile>((resolve) => {
          const imgEl = new Image();
          imgEl.onload = () => {
            const canvas = document.createElement('canvas');
            let { width, height } = imgEl;

            if (width > settings.maxWidth) {
              height = (height * settings.maxWidth) / width;
              width = settings.maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx?.drawImage(imgEl, 0, 0, width, height);

            const outputFormat = settings.format === 'image/png' ? 'image/png' : 
                              settings.format === 'image/webp' ? 'image/webp' : 'image/jpeg';
            
            const dataUrl = canvas.toDataURL(outputFormat, settings.quality / 100);
            
            const base64 = dataUrl.split(',')[1];
            const processedSize = Math.round((base64.length * 3) / 4);

            resolve({
              ...img,
              processed: dataUrl,
              processedSize,
            });
          };
          imgEl.src = img.preview;
        });
      })
    );

    setImages(processed);
    setIsProcessing(false);
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    
    images.forEach((img, index) => {
      if (img.processed) {
        const ext = settings.format === 'image/png' ? 'png' : 
                   settings.format === 'image/webp' ? 'webp' : 'jpg';
        const name = img.file.name.replace(/\.[^/.]+$/, '') + `_resized.${ext}`;
        const base64 = img.processed.split(',')[1];
        zip.file(name, base64, { base64: true });
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'resized-images.zip');
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const clearAll = () => {
    setImages([]);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  return (
    <div className="min-h-screen text-white p-4 md:p-8" style={{
      background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1a2e 100%)',
      minHeight: '100vh',
    }}>
      {/* Grid lines */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(0,255,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '50px 50px',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4" style={{
            fontFamily: '"Orbitron", sans-serif',
            textShadow: '0 0 10px #0ff, 0 0 20px #0ff, 0 0 40px #0ff',
            color: '#0ff',
          }}>
            <span style={{ color: '#f0f' }}>FUTURE</span> RESIZER
          </h1>
          <p style={{ color: '#f0f', textShadow: '0 0 10px #f0f' }}>Hromadná úprava obrázků • 2084 Edition</p>
        </div>

        {/* Settings */}
        <div className="rounded-2xl p-6 mb-8" style={{
          background: 'rgba(0,255,255,0.05)',
          border: '1px solid #0ff',
          boxShadow: '0 0 20px rgba(0,255,255,0.2), inset 0 0 20px rgba(0,255,255,0.05)',
        }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#0ff', fontFamily: '"Orbitron", sans-serif' }}>
            ⚙️ NASTAVENÍ
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm mb-2" style={{ color: '#888' }}>
                MAX ŠÍŘKA (px)
              </label>
              <input
                type="number"
                value={settings.maxWidth}
                onChange={(e) => setSettings({ ...settings, maxWidth: Number(e.target.value) })}
                className="w-full rounded-lg px-4 py-2 outline-none"
                style={{
                  background: '#1a1a2e',
                  border: '1px solid #f0f',
                  color: '#0ff',
                  boxShadow: '0 0 10px rgba(255,0,255,0.3)',
                }}
              />
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: '#888' }}>
                KVALITA (%)
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={settings.quality}
                onChange={(e) => setSettings({ ...settings, quality: Number(e.target.value) })}
                className="w-full"
                style={{ accentColor: '#f0f' }}
              />
              <span style={{ color: '#f0f', textShadow: '0 0 5px #f0f' }}>{settings.quality}%</span>
            </div>
            <div>
              <label className="block text-sm mb-2" style={{ color: '#888' }}>
                FORMÁT
              </label>
              <select
                value={settings.format}
                onChange={(e) => setSettings({ ...settings, format: e.target.value as any })}
                className="w-full rounded-lg px-4 py-2 outline-none"
                style={{
                  background: '#1a1a2e',
                  border: '1px solid #0f0',
                  color: '#0f0',
                  boxShadow: '0 0 10px rgba(0,255,0,0.3)',
                }}
              >
                <option value="image/jpeg" style={{ background: '#1a1a2e' }}>JPEG</option>
                <option value="image/png" style={{ background: '#1a1a2e' }}>PNG</option>
                <option value="image/webp" style={{ background: '#1a1a2e' }}>WebP</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className="rounded-2xl p-12 text-center cursor-pointer transition-all mb-8"
          style={{
            border: `2px dashed ${isDragActive ? '#0ff' : '#f0f'}`,
            background: isDragActive ? 'rgba(0,255,255,0.1)' : 'rgba(255,0,255,0.05)',
            boxShadow: isDragActive 
              ? '0 0 30px rgba(0,255,255,0.5)' 
              : '0 0 20px rgba(255,0,255,0.2)',
          }}
        >
          <input {...getInputProps()} />
          <div className="text-8xl mb-4">🛸</div>
          {isDragActive ? (
            <p className="text-xl" style={{ color: '#0ff', textShadow: '0 0 10px #0ff' }}>
              PŘETÁHNI SEM FOTKY...
            </p>
          ) : (
            <>
              <p className="text-xl mb-2" style={{ color: '#f0f' }}>PŘETÁHNI SEM FOTKY</p>
              <p style={{ color: '#888' }}>nebo klikni pro výběr</p>
            </>
          )}
        </div>

        {/* Images Grid */}
        {images.length > 0 && (
          <div className="rounded-2xl p-6 mb-8" style={{
            background: 'rgba(255,0,255,0.05)',
            border: '1px solid #f0f',
            boxShadow: '0 0 20px rgba(255,0,255,0.2)',
          }}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold" style={{ color: '#f0f', fontFamily: '"Orbitron", sans-serif' }}>
                📷 NAHRANÉ OBRAZKY ({images.length})
              </h2>
              <button
                onClick={clearAll}
                style={{ color: '#f00', textShadow: '0 0 5px #f00' }}
                className="hover:underline"
              >
                SMAZAT VŠE
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img.processed || img.preview}
                    alt={img.file.name}
                    className="w-full h-32 object-cover rounded-lg"
                    style={{
                      border: '1px solid #0ff',
                      boxShadow: '0 0 10px rgba(0,255,255,0.3)',
                    }}
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{
                      background: '#f00',
                      boxShadow: '0 0 10px #f00',
                    }}
                  >
                    ×
                  </button>
                  <div className="mt-2 text-xs" style={{ color: '#888' }}>
                    <div>{img.file.name.slice(0, 15)}...</div>
                    <div className="flex justify-between">
                      <span style={{ color: '#0ff' }}>{formatSize(img.originalSize)}</span>
                      {img.processedSize && (
                        <span style={{ color: '#0f0' }}>
                          → {formatSize(img.processedSize)}
                        </span>
                      )}
                    </div>
                    {img.processedSize && (
                      <div style={{ color: '#0f0', textShadow: '0 0 5px #0f0' }}>
                        {Math.round((1 - img.processedSize / img.originalSize) * 100)}% ÚSPORA
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-4 justify-center">
          {images.length > 0 && !images[0]?.processed && (
            <button
              onClick={processImages}
              disabled={isProcessing}
              className="px-8 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
              style={{
                background: 'linear-gradient(90deg, #0ff, #f0f)',
                color: '#000',
                boxShadow: '0 0 20px rgba(0,255,255,0.5), 0 0 40px rgba(255,0,255,0.3)',
                fontFamily: '"Orbitron", sans-serif',
              }}
            >
              {isProcessing ? '⏳ ZPRACOVÁVÁM...' : '⚡ ZPRACOVAT'}
            </button>
          )}
          
          {images[0]?.processed && (
            <button
              onClick={downloadAll}
              className="px-8 py-3 rounded-xl font-bold transition-all"
              style={{
                background: 'linear-gradient(90deg, #0f0, #0ff)',
                color: '#000',
                boxShadow: '0 0 20px rgba(0,255,0,0.5)',
                fontFamily: '"Orbitron", sans-serif',
              }}
            >
              📥 STÁHNOUT ZIP ({images.length})
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-sm" style={{ color: '#666' }}>
          <p>ZPRACOVÁNÍ LOKÁLNĚ V PROHLÍŽEČI • ŽÁDNÉ NAHRÁVÁNÍ NA SERVER</p>
        </div>
      </div>
    </div>
  );
}
