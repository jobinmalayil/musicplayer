import { useSkin } from '../context/SkinContext';
import { SKINS } from '../lib/skins';
import { CheckIcon, CloseIcon } from './icons';

export function SkinPickerSheet({ onClose }: { onClose: () => void }) {
  const { skin, setSkin } = useSkin();

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-header">
          <h3>Choose a theme</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <CloseIcon size={20} />
          </button>
        </div>
        <div className="skin-grid">
          {SKINS.map((s) => (
            <button
              key={s.id}
              className={`skin-swatch-btn ${skin === s.id ? 'active' : ''}`}
              onClick={() => {
                setSkin(s.id);
                onClose();
              }}
            >
              <span className="skin-swatch" style={{ background: s.swatch }} />
              <span className="skin-swatch-name">{s.name}</span>
              {skin === s.id && <CheckIcon size={16} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
