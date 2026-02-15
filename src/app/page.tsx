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

            // Resize if needed
            if (width > settings.maxWidth) {
              height = (height * settings.maxWidth) / width;
              width = settings.maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx?.drawImage(imgEl, 0, 0, width, height);

            // Convert to selected format
            const outputFormat = settings.format === 'image/png' ? 'image/png' : 
                              settings.format === 'image/webp' ? 'image/webp' : 'image/jpeg';
            
            const dataUrl = canvas.toDataURL(outputFormat, settings.quality / 100);
            
            // Calculate processed size
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Image Resizer
          </h1>
          <p className="text-slate-400">Hromadná úprava a komprese obrázků</p>
        </div>

        {/* Settings */}
        <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">⚙️ Nastavení</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Max šířka (px)
              </label>
              <input
                type="number"
                value={settings.maxWidth}
                onChange={(e) => setSettings({ ...settings, maxWidth: Number(e.target.value) })}
                className="w-full bg-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Kvalita (%)
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={settings.quality}
                onChange={(e) => setSettings({ ...settings, quality: Number(e.target.value) })}
                className="w-full"
              />
              <span className="text-sm text-slate-400">{settings.quality}%</span>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Formát
              </label>
              <select
                value={settings.format}
                onChange={(e) => setSettings({ ...settings, format: e.target.value as any })}
                className="w-full bg-slate-700 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
                <option value="image/webp">WebP</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all mb-8
            ${isDragActive 
              ? 'border-blue-500 bg-blue-500/20' 
              : 'border-slate-600 hover:border-slate-500 hover:bg-slate-800/30'
            }`}
        >
          <input {...getInputProps()} />
          <div className="text-6xl mb-4">📁</div>
          {isDragActive ? (
            <p className="text-xl">Přetáhni sem fotky...</p>
          ) : (
            <>
              <p className="text-xl mb-2">Přetáhni sem fotky</p>
              <p className="text-slate-400">nebo klikni pro výběr</p>
            </>
          )}
        </div>

        {/* Images Grid */}
        {images.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur rounded-2xl p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                📷 Nahrané obrázky ({images.length})
              </h2>
              <button
                onClick={clearAll}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Smazat vše
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((img, index) => (
                <div key={index} className="relative group">
                  <img
                    src={img.processed || img.preview}
                    alt={img.file.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <button
                    onClick={() => removeImage(index)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                  <div className="mt-2 text-xs text-slate-400">
                    <div>{img.file.name.slice(0, 20)}...</div>
                    <div className="flex justify-between">
                      <span>{formatSize(img.originalSize)}</span>
                      {img.processedSize && (
                        <span className="text-green-400">
                          → {formatSize(img.processedSize)}
                        </span>
                      )}
                    </div>
                    {img.processedSize && (
                      <div className="text-green-400">
                        {Math.round((1 - img.processedSize / img.originalSize) * 100)}% úspora
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
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 py-3 rounded-xl font-semibold transition-all disabled:opacity-50"
            >
              {isProcessing ? '⏳ Zpracovávám...' : '⚡ Zpracovat'}
            </button>
          )}
          
          {images[0]?.processed && (
            <button
              onClick={downloadAll}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-8 py-3 rounded-xl font-semibold transition-all"
            >
              📥 Stáhnout ZIP ({images.length} souborů)
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-slate-500 text-sm">
          <p>Zpracování probíhá lokálně v prohlížeči • Žádné nahrávání na server</p>
        </div>
      </div>
    </div>
  );
}
