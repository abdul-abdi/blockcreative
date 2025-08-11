'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type AudioTrack = {
  id?: string;
  title: string;
  audioUrl: string;
  coverImage?: string;
  creatorAddress?: string;
  durationSeconds?: number;
};

type AudioPlayerContextValue = {
  currentTrack: AudioTrack | null;
  queue: AudioTrack[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number; // 0-1
  play: (track: AudioTrack) => void;
  setQueueAndPlay: (tracks: AudioTrack[], startIndex: number) => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  next: () => void;
  previous: () => void;
};

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(undefined);

export function useAudioPlayer(): AudioPlayerContextValue {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx) throw new Error('useAudioPlayer must be used within AudioPlayerProvider');
  return ctx;
}

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [queue, setQueue] = useState<AudioTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(1);

  // Ensure audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'metadata';
      audioRef.current.volume = volume;
    }
    const audio = audioRef.current!;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration || 0);
    const handleEnded = () => {
      // Auto play next if available
      if (currentIndex >= 0 && currentIndex < queue.length - 1) {
        handleNext();
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [volume, currentIndex, queue]);

  const play = useCallback((track: AudioTrack) => {
    const audio = audioRef.current!;
    if (!audio) return;
    setCurrentTrack(track);
    setQueue([track]);
    setCurrentIndex(0);
    audio.src = track.audioUrl;
    audio.currentTime = 0;
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, []);

  const setQueueAndPlay = useCallback((tracks: AudioTrack[], startIndex: number) => {
    if (!tracks || tracks.length === 0) return;
    const idx = Math.max(0, Math.min(startIndex, tracks.length - 1));
    setQueue(tracks);
    setCurrentIndex(idx);
    const chosen = tracks[idx];
    setCurrentTrack(chosen);
    const audio = audioRef.current!;
    if (!audio) return;
    audio.src = chosen.audioUrl;
    audio.currentTime = 0;
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current!;
    if (!audio) return;
    audio.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current!;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [isPlaying]);

  const seek = useCallback((time: number) => {
    const audio = audioRef.current!;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(time, duration || audio.duration || 0));
  }, [duration]);

  const setVolume = useCallback((v: number) => {
    const audio = audioRef.current!;
    const nv = Math.max(0, Math.min(1, v));
    setVolumeState(nv);
    if (audio) audio.volume = nv;
  }, []);

  const handleNext = useCallback(() => {
    if (queue.length === 0) return;
    const nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) return;
    setCurrentIndex(nextIndex);
    const track = queue[nextIndex];
    setCurrentTrack(track);
    const audio = audioRef.current!;
    if (!audio) return;
    audio.src = track.audioUrl;
    audio.currentTime = 0;
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [queue, currentIndex]);

  const handlePrevious = useCallback(() => {
    if (queue.length === 0) return;
    const prevIndex = currentIndex - 1;
    if (prevIndex < 0) return;
    setCurrentIndex(prevIndex);
    const track = queue[prevIndex];
    setCurrentTrack(track);
    const audio = audioRef.current!;
    if (!audio) return;
    audio.src = track.audioUrl;
    audio.currentTime = 0;
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [queue, currentIndex]);

  const value = useMemo(() => ({
    currentTrack,
    queue,
    currentIndex,
    isPlaying,
    currentTime,
    duration,
    volume,
    play,
    setQueueAndPlay,
    pause,
    togglePlay,
    seek,
    setVolume,
    next: handleNext,
    previous: handlePrevious,
  }), [currentTrack, queue, currentIndex, isPlaying, currentTime, duration, volume, play, setQueueAndPlay, pause, togglePlay, seek, setVolume, handleNext, handlePrevious]);

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}


