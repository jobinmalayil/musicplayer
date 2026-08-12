import { useState } from 'react';
import { useMetadataOverrides } from '../context/MetadataOverridesContext';
import type { Track } from '../lib/drive';
import type { TrackMetadata } from '../lib/metadata';
import { CloseIcon } from './icons';

interface EditMetadataSheetProps {
  track: Track;
  meta: TrackMetadata;
  onClose: () => void;
}

export function EditMetadataSheet({ track, meta, onClose }: EditMetadataSheetProps) {
  const { getOverride, setOverride, clearOverride } = useMetadataOverrides();
  const hasOverride = Boolean(getOverride(track.id));
  const [title, setTitle] = useState(meta.title ?? '');
  const [artist, setArtist] = useState(meta.artist ?? '');
  const [album, setAlbum] = useState(meta.album ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setOverride(track.id, { title, artist, album });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    try {
      await clearOverride(track.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h3>Edit song info</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <CloseIcon size={20} />
          </button>
        </div>
        <div className="edit-metadata-fields">
          <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input type="text" placeholder="Artist" value={artist} onChange={(e) => setArtist(e.target.value)} />
          <input type="text" placeholder="Album" value={album} onChange={(e) => setAlbum(e.target.value)} />
        </div>
        <div className="admin-upload-actions">
          <button className="btn-primary" onClick={handleSave} disabled={saving}>
            Save
          </button>
          {hasOverride && (
            <button className="btn-link" onClick={handleReset} disabled={saving}>
              Reset to file metadata
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
