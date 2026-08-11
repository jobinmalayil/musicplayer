import { useRef, useState } from 'react';
import { getRootFolderId } from '../lib/drive';
import { requestUploadToken, uploadFileToDrive } from '../lib/googleUpload';
import { PlusIcon } from './icons';

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

export function UploadSongs() {
  const [items, setItems] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList) return;
    const audioFiles = Array.from(fileList).filter((f) => f.type.startsWith('audio/'));
    const newItems: UploadItem[] = audioFiles.map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending',
    }));
    setItems((prev) => [...prev, ...newItems]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const updateItem = (id: string, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const handleUploadAll = async () => {
    const pending = items.filter((it) => it.status === 'pending');
    if (pending.length === 0) return;
    setUploading(true);
    try {
      const token = await requestUploadToken();
      const folderId = await getRootFolderId();
      for (const item of pending) {
        updateItem(item.id, { status: 'uploading', progress: 0 });
        try {
          await uploadFileToDrive({
            file: item.file,
            folderId,
            token,
            onProgress: (fraction) => updateItem(item.id, { progress: fraction }),
          });
          updateItem(item.id, { status: 'done', progress: 1 });
        } catch (err) {
          updateItem(item.id, { status: 'error', error: err instanceof Error ? err.message : 'Upload failed' });
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sign-in failed';
      setItems((prev) => prev.map((it) => (it.status === 'pending' ? { ...it, status: 'error', error: message } : it)));
    } finally {
      setUploading(false);
    }
  };

  const clearFinished = () => setItems((prev) => prev.filter((it) => it.status !== 'done'));

  const pendingCount = items.filter((it) => it.status === 'pending').length;

  return (
    <div className="admin-upload">
      <h2 className="home-section-title">Upload songs</h2>
      <p className="hint-text">
        Adds audio files straight into the shared Drive folder — Google will ask you to confirm once.
      </p>

      <label className="btn-primary admin-upload-picker">
        <PlusIcon size={18} />
        Choose audio files
        <input ref={inputRef} type="file" accept="audio/*" multiple onChange={(e) => handleFilesSelected(e.target.files)} hidden />
      </label>

      {items.length > 0 && (
        <ul className="item-list admin-upload-list">
          {items.map((item) => (
            <li key={item.id} className="admin-upload-row">
              <span className="item-name">{item.file.name}</span>
              {item.status === 'uploading' && (
                <div className="admin-upload-bar">
                  <div className="admin-upload-bar-fill" style={{ width: `${Math.round(item.progress * 100)}%` }} />
                </div>
              )}
              {item.status === 'pending' && <span className="hint-text">Ready</span>}
              {item.status === 'done' && <span className="admin-upload-status done">Uploaded</span>}
              {item.status === 'error' && <span className="admin-upload-status error">{item.error}</span>}
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <div className="admin-upload-actions">
          <button className="btn-primary" onClick={handleUploadAll} disabled={uploading || pendingCount === 0}>
            {uploading ? 'Uploading…' : `Upload ${pendingCount || ''}`}
          </button>
          <button className="btn-link" onClick={clearFinished}>
            Clear finished
          </button>
        </div>
      )}
    </div>
  );
}
