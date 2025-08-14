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
			
			// Add error handling to prevent navigation issues
			audioRef.current.onerror = () => {
				const audio = audioRef.current!;
				const mediaError = (audio && (audio as any).error) || null;
				console.warn('Audio element error', {
					src: audio?.src,
					error: mediaError ? {
						code: mediaError.code,
						message: mediaError.message
					} : null,
				});
				setIsPlaying(false);
			};
			
			audioRef.current.onabort = () => {
				const audio = audioRef.current!;
				console.warn('Audio element aborted', { src: audio?.src });
				setIsPlaying(false);
			};
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
		console.log('AudioPlayer: play() called with track:', track);
		
		const audio = audioRef.current!;
		if (!audio) return;
		
		// Validate the audio URL
		if (!track.audioUrl || track.audioUrl === 'undefined') {
			console.warn('AudioPlayer: Invalid audio URL in play():', track.audioUrl);
			return;
		}
		
		setCurrentTrack(track);
		setQueue([track]);
		setCurrentIndex(0);
		
		console.log('AudioPlayer: Setting audio src to:', track.audioUrl);
		audio.src = track.audioUrl;
		audio.currentTime = 0;
		
		audio.play().then(() => {
			console.log('AudioPlayer: play() started successfully');
			setIsPlaying(true);
		}).catch((error) => {
			console.warn('AudioPlayer: play() failed:', error);
			setIsPlaying(false);
		});
	}, []);

	const setQueueAndPlay = useCallback((tracks: AudioTrack[], startIndex: number) => {
		if (!tracks || tracks.length === 0) return;
		const idx = Math.max(0, Math.min(startIndex, tracks.length - 1));
		setQueue(tracks);
		setCurrentIndex(idx);
		const chosen = tracks[idx];
		setCurrentTrack(chosen);
		
		console.log('AudioPlayer: Setting up audio for track:', chosen);
		console.log('AudioPlayer: audioUrl:', chosen.audioUrl);
		
		const audio = audioRef.current!;
		if (!audio) return;
		
		// Validate the audio URL
		if (!chosen.audioUrl || chosen.audioUrl === 'undefined') {
			console.warn('AudioPlayer: Invalid audio URL:', chosen.audioUrl);
			return;
		}
		
		audio.src = chosen.audioUrl;
		audio.currentTime = 0;
		
		console.log('AudioPlayer: Starting playback...');
		audio.play().then(() => {
			console.log('AudioPlayer: Playback started successfully');
			setIsPlaying(true);
		}).catch((error) => {
			console.warn('AudioPlayer: Playback failed:', error);
			setIsPlaying(false);
		});
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
			audio.play().then(() => setIsPlaying(true)).catch((err) => {
				console.warn('AudioPlayer: togglePlay() failed:', err);
				setIsPlaying(false);
			});
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
		audio.play().then(() => setIsPlaying(true)).catch((err) => {
			console.warn('AudioPlayer: next() failed:', err);
			setIsPlaying(false);
		});
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
		audio.play().then(() => setIsPlaying(true)).catch((err) => {
			console.warn('AudioPlayer: previous() failed:', err);
			setIsPlaying(false);
		});
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


