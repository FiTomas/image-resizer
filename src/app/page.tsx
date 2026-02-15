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

  // Mac OS 8-9 inspired button
  const Button = ({ children, onClick, disabled, primary, style = {} }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...style,
        background: primary 
          ? 'linear-gradient(180deg, #0000ba 0%, #000078 100%)'
          : 'linear-gradient(180deg, #dfdfdf 0%, #a0a0a0 100%)',
        color: primary ? '#fff' : '#000',
        border: '1px solid',
        borderColor: '#fff #808080 #808080 #fff',
        boxShadow: primary ? 'none' : '1px 1px 0 #808080, -1px -1px 0 #dfdfdf',
        padding: '4px 16px',
        fontSize: '12px',
        fontFamily: 'Geneva, Chicago, sans-serif',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        borderRadius: '4px',
      }}
    >
      {children}
    </button>
  );

  // Mac OS 8-9 window
  const Window = ({ children, title, style = {} }: any) => (
    <div style={{
      ...style,
      background: '#c0c0c0',
      border: '2px solid',
      borderColor: '#dfdfdf #404040 #404040 #dfdfdf',
      boxShadow: '1px 1px 0 #808080',
      fontFamily: 'Geneva, Chicago, sans-serif',
    }}>
      {/* Title bar */}
      <div style={{
        background: 'linear-gradient(180deg, #000080 0%, #0000a8 100%)',
        padding: '2px 4px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
      }}>
        <span style={{
          width: '12px',
          height: '12px',
          background: 'linear-gradient(135deg, #ff6b6b 0%, #c0392b 50%, #ff6b6b 100%)',
          borderRadius: '50%',
          display: 'inline-block',
          border: '1px solid #fff',
        }} />
        <span style={{
          width: '12px',
          height: '12px',
          background: 'linear-gradient(135deg, #ffd93d 0%, #f39c12 50%, #ffd93d 100%)',
          borderRadius: '50%',
          display: 'inline-block',
          border: '1px solid #fff',
        }} />
        <span style={{
          width: '12px',
          height: '12px',
          background: 'linear-gradient(135deg, #6bcb77 0%, #27ae60 50%, #6bcb77 100%)',
          borderRadius: '50%',
          display: 'inline-block',
          border: '1px solid #fff',
        }} />
        <span style={{
          color: '#fff',
          fontSize: '11px',
          fontWeight: 'bold',
          marginLeft: '4px',
          textShadow: '1px 1px 0 #000',
        }}>
          {title}
        </span>
      </div>
      {/* Content */}
      <div style={{ padding: '8px' }}>
        {children}
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: '#008080',
      padding: '20px',
      fontFamily: 'Geneva, Chicago, sans-serif',
      fontSize: '12px',
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{
          background: '#c0c0c0',
          border: '2px solid',
          borderColor: '#dfdfdf #404040 #404040 #dfdfdf',
          padding: '2px',
          marginBottom: '16px',
        }}>
          <div style={{
            background: 'linear-gradient(180deg, #000080 0%, #0000a8 100%)',
            padding: '2px 8px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}>
            <div style={{
              width: '12px',
              height: '12px',
              background: 'radial-gradient(circle, #ff6b6b 0%, #c0392b 100%)',
              borderRadius: '50%',
              border: '1px solid #fff',
            }} />
            <div style={{
              width: '12px',
              height: '12px',
              background: 'radial-gradient(circle, #ffd93d 0%, #f39c12 100%)',
              borderRadius: '50%',
              border: '1px solid #fff',
            }} />
            <div style={{
              width: '12px',
              height: '12px',
              background: 'radial-gradient(circle, #6bcb77 0%, #27ae60 100%)',
              borderRadius: '50%',
              border: '1px solid #fff',
            }} />
            <span style={{
              color: '#fff',
              fontSize: '11px',
              fontWeight: 'bold',
              marginLeft: '4px',
              textShadow: '1px 1px 0 #000',
            }}>
              Image Resizer
            </span>
          </div>
          <div style={{ padding: '8px', textAlign: 'center' }}>
            <h1 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              margin: '0 0 4px 0',
              color: '#000',
              textShadow: '1px 1px 0 #fff',
            }}>
              🖼️ Hromadná úprava obrázků
            </h1>
            <p style={{ color: '#404040', margin: 0 }}>
              Mac OS 8.1 Style Edition
            </p>
          </div>
        </div>

        {/* Settings Window */}
        <Window title="⚙️ Nastavení" style={{ marginBottom: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: '#000' }}>
                Max šířka (px):
              </label>
              <input
                type="number"
                value={settings.maxWidth}
                onChange={(e) => setSettings({ ...settings, maxWidth: Number(e.target.value) })}
                style={{
                  width: '100%',
                  background: '#fff',
                  border: '2px solid',
                  borderColor: '#404040 #dfdfdf #dfdfdf #404040',
                  padding: '2px 4px',
                  fontSize: '12px',
                  fontFamily: 'Geneva, Chicago, sans-serif',
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: '#000' }}>
                Kvalita (%):
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={settings.quality}
                  onChange={(e) => setSettings({ ...settings, quality: Number(e.target.value) })}
                  style={{ width: '100%' }}
                />
                <span style={{ fontWeight: 'bold', color: '#000', minWidth: '35px' }}>{settings.quality}%</span>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold', color: '#000' }}>
                Formát:
              </label>
              <select
                value={settings.format}
                onChange={(e) => setSettings({ ...settings, format: e.target.value as any })}
                style={{
                  width: '100%',
                  background: '#fff',
                  border: '2px solid',
                  borderColor: '#404040 #dfdfdf #dfdfdf #404040',
                  padding: '2px 4px',
                  fontSize: '12px',
                  fontFamily: 'Geneva, Chicago, sans-serif',
                }}
              >
                <option value="image/jpeg">JPEG</option>
                <option value="image/png">PNG</option>
                <option value="image/webp">WebP</option>
              </select>
            </div>
          </div>
        </Window>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          style={{
            border: '2px dashed',
            borderColor: isDragActive ? '#000080' : '#404040',
            background: isDragActive ? '#0000a8' : '#dfdfdf',
            padding: '32px',
            textAlign: 'center',
            cursor: 'pointer',
            marginBottom: '16px',
            color: isDragActive ? '#fff' : '#000',
          }}
        >
          <input {...getInputProps()} />
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>📁</div>
          <p style={{ fontWeight: 'bold', margin: '0' }}>
            {isDragActive ? 'PŘETÁHNI SEM FOTKY...' : 'Přetáhni sem fotky nebo klikni'}
          </p>
        </div>

        {/* Images */}
        {images.length > 0 && (
          <Window title={`📷 Nahrané obrázky (${images.length})`} style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontWeight: 'bold' }}>{images.length} souborů</span>
              <Button onClick={clearAll} style={{ color: '#c00' }}>
                Smazat vše
              </Button>
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
              gap: '8px',
              maxHeight: '200px',
              overflowY: 'auto',
              background: '#fff',
              padding: '4px',
              border: '2px solid',
              borderColor: '#404040 #dfdfdf #dfdfdf #404040',
            }}>
              {images.map((img, index) => (
                <div key={index} style={{ 
                  border: '1px solid #808080',
                  padding: '2px',
                  background: '#fff',
                  position: 'relative',
                }}>
                  <img
                    src={img.processed || img.preview}
                    alt={img.file.name}
                    style={{ 
                      width: '100%', 
                      height: '80px', 
                      objectFit: 'cover',
                    }}
                  />
                  <button
                    onClick={() => removeImage(index)}
                    style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      width: '16px',
                      height: '16px',
                      background: '#c0c0c0',
                      border: '1px solid',
                      borderColor: '#fff #404040 #404040 #fff',
                      cursor: 'pointer',
                      fontSize: '10px',
                      lineHeight: '14px',
                      textAlign: 'center',
                    }}
                  >
                    ×
                  </button>
                  <div style={{ fontSize: '9px', marginTop: '2px', color: '#000' }}>
                    {formatSize(img.processedSize || img.originalSize)}
                    {img.processedSize && (
                      <span style={{ color: '#008000' }}>
                        {' '}(-{Math.round((1 - img.processedSize / img.originalSize) * 100)}%)
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Window>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          {images.length > 0 && !images[0]?.processed && (
            <Button primary onClick={processImages} disabled={isProcessing}>
              {isProcessing ? '⏳ Zpracovávám...' : '⚡ Zpracovat'}
            </Button>
          )}
          
          {images[0]?.processed && (
            <Button primary onClick={downloadAll}>
              📥 Stáhnout ZIP ({images.length})
            </Button>
          )}
        </div>

        {/* Footer */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '16px', 
          color: '#fff',
          fontSize: '10px',
        }}>
          <p>Zpracování probíhá lokálně v prohlížeči • Žádné nahrávání na server</p>
          <p style={{ opacity: 0.7 }}>© 1997-2026 Future Software</p>
        </div>
      </div>
    </div>
  );
}
