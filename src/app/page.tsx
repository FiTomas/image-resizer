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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #1e3a5f 0%, #0d1b2a 100%)',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", sans-serif',
      fontSize: '13px',
      color: '#fff',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header - Modern Mac style */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '20px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{
                fontSize: '28px',
                fontWeight: 600,
                margin: 0,
                background: 'linear-gradient(90deg, #fff, #a0a0a0)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                🖼️ Image Resizer
              </h1>
              <p style={{ color: 'rgba(255,255,255,0.5)', margin: '4px 0 0 0' }}>
                Hromadná úprava a komprese obrázků
              </p>
            </div>
            {/* Mac window buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#ff5f57' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#febc2e' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#28c840' }} />
            </div>
          </div>
        </div>

        {/* Settings - Modern card */}
        <div style={{
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          <h2 style={{
            fontSize: '13px',
            fontWeight: 600,
            marginBottom: '16px',
            color: 'rgba(255,255,255,0.6)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            ⚙️ Nastavení
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>
                Max šířka (px)
              </label>
              <input
                type="number"
                value={settings.maxWidth}
                onChange={(e) => setSettings({ ...settings, maxWidth: Number(e.target.value) })}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: '#fff',
                  outline: 'none',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>
                Kvalita
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={settings.quality}
                  onChange={(e) => setSettings({ ...settings, quality: Number(e.target.value) })}
                  style={{
                    flex: 1,
                    accentColor: '#007aff',
                  }}
                />
                <span style={{ 
                  fontWeight: 600, 
                  color: '#007aff',
                  minWidth: '40px',
                  textAlign: 'right',
                }}>
                  {settings.quality}%
                </span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, color: 'rgba(255,255,255,0.8)' }}>
                Formát
              </label>
              <select
                value={settings.format}
                onChange={(e) => setSettings({ ...settings, format: e.target.value as any })}
                style={{
                  width: '100%',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  padding: '10px 12px',
                  fontSize: '13px',
                  color: '#fff',
                  outline: 'none',
                }}
              >
                <option value="image/jpeg" style={{ background: '#1e1e1e' }}>JPEG</option>
                <option value="image/png" style={{ background: '#1e1e1e' }}>PNG</option>
                <option value="image/webp" style={{ background: '#1e1e1e' }}>WebP</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dropzone - Modern */}
        <div
          {...getRootProps()}
          style={{
            background: isDragActive 
              ? 'rgba(0,122,255,0.2)' 
              : 'rgba(255,255,255,0.05)',
            border: `2px dashed ${isDragActive ? '#007aff' : 'rgba(255,255,255,0.15)'}`,
            borderRadius: '16px',
            padding: '48px',
            textAlign: 'center',
            cursor: 'pointer',
            marginBottom: '20px',
            transition: 'all 0.2s ease',
          }}
        >
          <input {...getInputProps()} />
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📁</div>
          <p style={{ 
            fontSize: '15px', 
            fontWeight: 500,
            color: isDragActive ? '#007aff' : 'rgba(255,255,255,0.8)',
            margin: 0,
          }}>
            {isDragActive ? 'Přetáhni sem fotky...' : 'Přetáhni sem fotky nebo klikni pro výběr'}
          </p>
          <p style={{ 
            color: 'rgba(255,255,255,0.4)', 
            margin: '8px 0 0 0',
            fontSize: '12px',
          }}>
            PNG, JPG, WebP • Až 50 souborů
          </p>
        </div>

        {/* Images Grid - Modern */}
        {images.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            backdropFilter: 'blur(20px)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '20px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ 
                fontSize: '13px', 
                fontWeight: 600, 
                color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                📷 Nahrané obrázky ({images.length})
              </h2>
              <button
                onClick={clearAll}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ff453a',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 500,
                }}
              >
                Smazat vše
              </button>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
              gap: '12px',
            }}>
              {images.map((img, index) => (
                <div key={index} style={{ 
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  position: 'relative',
                }}>
                  <img
                    src={img.processed || img.preview}
                    alt={img.file.name}
                    style={{ 
                      width: '100%', 
                      height: '100px', 
                      objectFit: 'cover',
                    }}
                  />
                  <button
                    onClick={() => removeImage(index)}
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      width: '20px',
                      height: '20px',
                      background: 'rgba(0,0,0,0.6)',
                      border: 'none',
                      borderRadius: '50%',
                      color: '#fff',
                      cursor: 'pointer',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ×
                  </button>
                  <div style={{ padding: '8px', fontSize: '11px' }}>
                    <div style={{ 
                      color: 'rgba(255,255,255,0.6)', 
                      whiteSpace: 'nowrap', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                    }}>
                      {img.file.name}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {formatSize(img.originalSize)}
                      </span>
                      {img.processedSize && (
                        <span style={{ color: '#30d158' }}>
                          {formatSize(img.processedSize)}
                        </span>
                      )}
                    </div>
                    {img.processedSize && (
                      <div style={{ 
                        color: '#30d158', 
                        fontWeight: 600,
                        marginTop: '2px',
                      }}>
                        ↓{Math.round((1 - img.processedSize / img.originalSize) * 100)}%
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions - Modern buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          {images.length > 0 && !images[0]?.processed && (
            <button
              onClick={processImages}
              disabled={isProcessing}
              style={{
                background: 'linear-gradient(90deg, #007aff, #0051d4)',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                opacity: isProcessing ? 0.6 : 1,
                boxShadow: '0 4px 14px rgba(0,122,255,0.4)',
              }}
            >
              {isProcessing ? '⏳ Zpracovávám...' : '⚡ Zpracovat'}
            </button>
          )}
          
          {images[0]?.processed && (
            <button
              onClick={downloadAll}
              style={{
                background: 'linear-gradient(90deg, #30d158, #24a338)',
                border: 'none',
                borderRadius: '10px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(48,209,88,0.4)',
              }}
            >
              📥 Stáhnout ZIP ({images.length})
            </button>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '32px', 
          color: 'rgba(255,255,255,0.3)',
          fontSize: '11px',
        }}>
          <p>Zpracování probíhá lokálně v prohlížeči • Žádné nahrávání na server</p>
        </div>
      </div>
    </div>
  );
}
