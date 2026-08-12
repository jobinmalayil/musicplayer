import { useEffect, useState, type ReactNode } from 'react';
import { useMetadataOverrides } from '../context/MetadataOverridesContext';
import { usePlayer } from '../context/PlayerContext';
import { getRootFolderId, listFolder, sortTracksByTitle, type Track } from '../lib/drive';
import { getTrackMetadata } from '../lib/metadata';
import { TrackRow } from './TrackRow';
import { BackIcon } from './icons';

interface Group {
  name: string;
  tracks: Track[];
}

interface GroupedTracksViewProps {
  groupBy: 'artist' | 'album';
  icon: ReactNode;
  emptyLabel: string;
  unknownLabel: string;
}

export function GroupedTracksView({ groupBy, icon, emptyLabel, unknownLabel }: GroupedTracksViewProps) {
  const { playQueue, currentTrack, isPlaying } = usePlayer();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [selected, setSelected] = useState<Group | null>(null);
  const { getOverride } = useMetadataOverrides();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rootId = await getRootFolderId();
      const { tracks } = await listFolder(rootId);
      if (cancelled) return;
      const metas = await Promise.all(tracks.map((t) => getTrackMetadata(t)));
      if (cancelled) return;

      const byName = new Map<string, Track[]>();
      tracks.forEach((track, i) => {
        const override = getOverride(track.id);
        const value = groupBy === 'artist' ? override?.artist || metas[i].artist : override?.album || metas[i].album;
        const name = value || unknownLabel;
        if (!byName.has(name)) byName.set(name, []);
        byName.get(name)!.push(track);
      });
      setGroups(
        Array.from(byName.entries())
          .map(([name, tracks]) => ({ name, tracks: sortTracksByTitle(tracks) }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    })().catch(() => setGroups([]));
    return () => {
      cancelled = true;
    };
  }, [groupBy, unknownLabel, getOverride]);

  if (selected) {
    return (
      <div>
        <div className="playlist-detail-header">
          <button className="icon-btn" onClick={() => setSelected(null)} aria-label="Back">
            <BackIcon />
          </button>
          <h2>{selected.name}</h2>
          <span aria-hidden="true" />
        </div>
        <ul className="item-list track-list">
          {selected.tracks.map((track, i) => (
            <li key={track.id}>
              <TrackRow
                track={track}
                isCurrent={currentTrack?.id === track.id}
                isPlaying={isPlaying}
                onClick={() => playQueue(selected.tracks, i)}
              />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (!groups) return <p className="hint-text">Loading…</p>;
  if (groups.length === 0) return <p className="hint-text">{emptyLabel}</p>;

  return (
    <ul className="item-list">
      {groups.map((group) => (
        <li key={group.name}>
          <button className="item-row folder-row" onClick={() => setSelected(group)}>
            <span className="item-icon">{icon}</span>
            <span className="item-name">{group.name}</span>
            <span className="track-duration">{group.tracks.length} tracks</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
