import { waveformHeights } from '../lib/trackArt';

const BAR_COUNT = 48;

interface WaveformProgressProps {
  trackId: string;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export function WaveformProgress({ trackId, currentTime, duration, onSeek }: WaveformProgressProps) {
  const heights = waveformHeights(trackId, BAR_COUNT);
  const progress = duration ? currentTime / duration : 0;
  const playedCount = Math.round(progress * heights.length);

  return (
    <div className="waveform">
      <div className="waveform-bars" aria-hidden="true">
        {heights.map((h, i) => (
          <span key={i} className={i < playedCount ? 'played' : ''} style={{ height: `${h}%` }} />
        ))}
      </div>
      <input
        type="range"
        className="waveform-seek"
        min={0}
        max={duration || 0}
        value={Math.min(currentTime, duration || 0)}
        onChange={(e) => onSeek(Number(e.target.value))}
        aria-label="Seek"
      />
    </div>
  );
}
