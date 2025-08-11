'use client'

import React from 'react';
import { useAudioPlayer } from '@/context/audioPlayer';

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function GlobalAudioBar() {
  const { currentTrack, isPlaying, currentTime, duration, togglePlay, seek, setVolume, volume, next, previous } = useAudioPlayer();

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-black/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-3 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        {/* Track Info */}
        <div className="flex items-center gap-3 min-w-0">
          {currentTrack.coverImage ? (
            <img src={currentTrack.coverImage} alt="cover" className="w-12 h-12 rounded object-cover" />
          ) : (
            <div className="w-12 h-12 rounded bg-white/10" />
          )}
          <div className="min-w-0">
            <p className="text-white font-medium truncate">{currentTrack.title}</p>
            {currentTrack.creatorAddress && (
              <p className="text-xs text-gray-400 truncate">{currentTrack.creatorAddress}</p>
            )}
          </div>
        </div>

        {/* Controls and Seek */}
        <div className="flex items-center gap-4 justify-center">
          <button
            onClick={previous}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white"
            aria-label="Previous"
            title="Previous"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5a1 1 0 0 1 1 1v4.382l9.447-5.668A1 1 0 0 1 18 5v14a1 1 0 0 1-1.553.832L7 14.164V18a1 1 0 0 1-2 0V6a1 1 0 0 1 1-1Z"/></svg>
          </button>
          <button
            onClick={togglePlay}
            className="p-3 rounded-full bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white hover:opacity-90"
            aria-label={isPlaying ? 'Pause' : 'Play'}
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M10 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1Zm4 0a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0V6a1 1 0 0 1 1-1Z"/></svg>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M7.05 5.606A1 1 0 0 1 8.58 4.78l9.333 6.22a1 1 0 0 1 0 1.666l-9.333 6.22A1 1 0 0 1 7 18.999V5.001a1 1 0 0 1 .05-.395Z"/></svg>
            )}
          </button>
          <button
            onClick={next}
            className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-white"
            aria-label="Next"
            title="Next"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18 5a1 1 0 0 1 1 1v12a1 1 0 1 1-2 0v-3.836l-9.447 5.668A1 1 0 0 1 6 18V6a1 1 0 0 1 1.553-.832L17 10.164V6a1 1 0 0 1 1-1Z"/></svg>
          </button>
          <span className="text-xs text-gray-400 w-12 text-right">{formatTime(currentTime)}</span>
          <input
            className="flex-1"
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={Math.min(currentTime, duration || 0)}
            onChange={(e) => seek(parseFloat(e.target.value))}
          />
          <span className="text-xs text-gray-400 w-12">{formatTime(duration)}</span>
        </div>

        {/* Volume on the right */}
        <div className="hidden md:flex items-center justify-end gap-2 text-gray-300">
          <span className="text-xs"></span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
          />
        </div>
      </div>
    </div>
  );
}


