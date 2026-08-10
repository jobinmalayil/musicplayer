import { useEffect, useRef } from 'react';
import { usePlayer } from '../context/PlayerContext';
import { waveformHeights } from '../lib/trackArt';

const BAR_COUNT = 48;

interface WaveformProgressProps {
  trackId: string;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
}

export function WaveformProgress({ trackId, currentTime, duration, onSeek }: WaveformProgressProps) {
  const { getAnalyser, isPlaying } = usePlayer();
  const staticHeights = waveformHeights(trackId, BAR_COUNT);
  const progress = duration ? currentTime / duration : 0;
  const playedCount = Math.round(progress * staticHeights.length);

  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);

  // While playing, bar heights are driven by real frequency data (bypassing
  // React state for a smooth 60fps loop); otherwise they fall back to the
  // static per-track pattern so the bar isn't just flat when paused.
  useEffect(() => {
    if (!isPlaying) {
      barRefs.current.forEach((el, i) => {
        if (el) el.style.height = `${staticHeights[i]}%`;
      });
      return;
    }

    const analyser = getAnalyser();
    if (!analyser) return;

    const data = new Uint8Array(analyser.frequencyBinCount);
    const bucketSize = Math.max(1, Math.floor(data.length / BAR_COUNT));
    let rafId: number;

    const draw = () => {
      rafId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(data);
      for (let i = 0; i < BAR_COUNT; i++) {
        let sum = 0;
        for (let j = 0; j < bucketSize; j++) sum += data[i * bucketSize + j] ?? 0;
        const pct = Math.max(12, (sum / bucketSize / 255) * 100);
        const el = barRefs.current[i];
        if (el) el.style.height = `${pct}%`;
      }
    };
    draw();

    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, getAnalyser, trackId]);

  return (
    <div className="waveform">
      <div className="waveform-bars" aria-hidden="true">
        {staticHeights.map((h, i) => (
          <span
            key={i}
            ref={(el) => {
              barRefs.current[i] = el;
            }}
            className={i < playedCount ? 'played' : ''}
            style={{ height: `${h}%` }}
          />
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
