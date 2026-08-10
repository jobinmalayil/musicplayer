import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getTrackStreamUrl, trackTitle, type Track } from '../lib/drive';

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerContextValue {
  queue: Track[];
  currentIndex: number;
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  error: string | null;
  currentTime: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  screenOpen: boolean;
  openScreen: () => void;
  closeScreen: () => void;
  getAnalyser: () => AnalyserNode | null;
  playQueue: (tracks: Track[], startIndex: number) => void;
  togglePlay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

function shuffledOrder(length: number, keepFirst: number): number[] {
  const rest = Array.from({ length }, (_, i) => i).filter((i) => i !== keepFirst);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j], rest[i]];
  }
  return [keepFirst, ...rest];
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  if (!audioRef.current && typeof Audio !== 'undefined') {
    audioRef.current = new Audio();
  }

  const [queue, setQueue] = useState<Track[]>([]);
  const [order, setOrder] = useState<number[]>([]); // playback order, as indices into `queue`
  const [orderPos, setOrderPos] = useState(0); // position within `order`
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>('off');
  const [screenOpen, setScreenOpen] = useState(false);

  const openScreen = useCallback(() => setScreenOpen(true), []);
  const closeScreen = useCallback(() => setScreenOpen(false), []);

  // Created lazily (not at app boot) since AudioContext needs a user
  // gesture to start, and createMediaElementSource can only ever be called
  // once per audio element for its whole lifetime.
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const getAnalyser = useCallback((): AnalyserNode | null => {
    const audio = audioRef.current;
    if (!audio) return null;
    let ctx = audioContextRef.current;
    if (!ctx) {
      ctx = new AudioContext();
      const source = ctx.createMediaElementSource(audio);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
    }
    if (ctx.state === 'suspended') void ctx.resume();
    return analyserRef.current;
  }, []);

  const currentIndex = order[orderPos] ?? -1;
  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

  const advance = useCallback(
    (direction: 1 | -1) => {
      setOrderPos((pos) => {
        const next = pos + direction;
        if (next >= 0 && next < order.length) return next;
        if (repeat === 'all') return direction === 1 ? 0 : order.length - 1;
        return pos; // stay put; playback will just stop
      });
    },
    [order.length, repeat],
  );

  const playQueue = useCallback((tracks: Track[], startIndex: number) => {
    setQueue(tracks);
    setOrder(shuffle ? shuffledOrder(tracks.length, startIndex) : tracks.map((_, i) => i));
    setOrderPos(shuffle ? 0 : startIndex);
    setIsPlaying(true);
  }, [shuffle]);

  const toggleShuffle = useCallback(() => {
    setShuffle((prev) => {
      const next = !prev;
      setOrder((currentOrder) => {
        const activeIndex = currentOrder[orderPos] ?? 0;
        const newOrder = next ? shuffledOrder(queue.length, activeIndex) : queue.map((_, i) => i);
        const newPos = next ? 0 : newOrder.indexOf(activeIndex);
        setOrderPos(newPos < 0 ? 0 : newPos);
        return newOrder;
      });
      return next;
    });
  }, [orderPos, queue]);

  const cycleRepeat = useCallback(() => {
    setRepeat((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'));
  }, []);

  const togglePlay = useCallback(() => {
    if (!currentTrack) return;
    setIsPlaying((p) => !p);
  }, [currentTrack]);

  const playNext = useCallback(() => advance(1), [advance]);
  const playPrevious = useCallback(() => {
    const audio = audioRef.current;
    if (audio && audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    advance(-1);
  }, [advance]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current;
    if (audio) audio.currentTime = time;
    setCurrentTime(time);
  }, []);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    const audio = audioRef.current;
    if (audio) audio.volume = v;
  }, []);

  // Load audio source whenever the current track changes.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    setIsLoading(true);
    setError(null);
    audio.src = getTrackStreamUrl(currentTrack.id);
    audio.volume = volume;
    if (isPlaying) void audio.play().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  // Clear the loading flag once the browser has enough of the stream to play.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onCanPlay = () => setIsLoading(false);
    const onError = () => {
      setIsLoading(false);
      setError('Failed to load track');
    };
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
    };
  }, []);

  // Reflect isPlaying state onto the audio element.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (isPlaying) {
      void audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying, currentTrack]);

  // Wire up audio element events.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDuration = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      if (repeat === 'one') {
        audio.currentTime = 0;
        void audio.play().catch(() => {});
        return;
      }
      advance(1);
    };
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onDuration);
    audio.addEventListener('durationchange', onDuration);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onDuration);
      audio.removeEventListener('durationchange', onDuration);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [repeat, advance]);

  // MediaSession integration for lock-screen / notification controls.
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const session = navigator.mediaSession;
    if (currentTrack) {
      session.metadata = new MediaMetadata({
        title: trackTitle(currentTrack),
        artist: 'Drive Music',
      });
    } else {
      session.metadata = null;
    }
    session.setActionHandler('play', () => setIsPlaying(true));
    session.setActionHandler('pause', () => setIsPlaying(false));
    session.setActionHandler('previoustrack', () => playPrevious());
    session.setActionHandler('nexttrack', () => playNext());
    session.setActionHandler('seekto', (details) => {
      if (details.seekTime != null) seek(details.seekTime);
    });
    return () => {
      session.setActionHandler('play', null);
      session.setActionHandler('pause', null);
      session.setActionHandler('previoustrack', null);
      session.setActionHandler('nexttrack', null);
      session.setActionHandler('seekto', null);
    };
  }, [currentTrack, playNext, playPrevious, seek]);

  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      queue,
      currentIndex,
      currentTrack,
      isPlaying,
      isLoading,
      error,
      currentTime,
      duration,
      volume,
      shuffle,
      repeat,
      screenOpen,
      openScreen,
      closeScreen,
      getAnalyser,
      playQueue,
      togglePlay,
      playNext,
      playPrevious,
      seek,
      setVolume,
      toggleShuffle,
      cycleRepeat,
    }),
    [
      queue,
      currentIndex,
      currentTrack,
      isPlaying,
      isLoading,
      error,
      currentTime,
      duration,
      volume,
      shuffle,
      repeat,
      screenOpen,
      openScreen,
      closeScreen,
      getAnalyser,
      playQueue,
      togglePlay,
      playNext,
      playPrevious,
      seek,
      setVolume,
      toggleShuffle,
      cycleRepeat,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
