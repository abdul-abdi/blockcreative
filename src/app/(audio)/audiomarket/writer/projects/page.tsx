'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { useAudioPlayer } from '@/context/audioPlayer';

// Audio upload type
interface AudioItem {
	_id: string;
	title: string;
	description?: string;
	audioUrl: string;
	coverImage?: string;
	creatorAddress?: string;
	creatorName?: string;
	durationSeconds?: number;
	tags?: string[];
	createdAt?: string;
}

export default function BrowseAudio() {
	const { play } = useAudioPlayer();
	// Build queue and play helpers
	const { setQueueAndPlay } = useAudioPlayer();
	
	// Audio uploads state
	const [audioItems, setAudioItems] = useState<AudioItem[]>([]);
	const [filteredAudioItems, setFilteredAudioItems] = useState<AudioItem[]>([]);
	const [audioLoading, setAudioLoading] = useState<boolean>(false);
	const [audioError, setAudioError] = useState<string | null>(null);
	const [filters, setFilters] = useState({
		searchQuery: '',
		genre: 'All',
	});

	// Fetch audio uploads for audiomarket Explore page
	useEffect(() => {
		const fetchAudio = async () => {
			try {
				setAudioLoading(true);
				setAudioError(null);
				const res = await fetch('/api/audio/submissions?limit=100', { cache: 'no-store' });
				if(!res.ok){
					const text = await res.text();
					throw new Error(text || 'Failed to fetch audio uploads');
				}
				const data = await res.json();
				console.log('API response data:', data);
				
				// Validate API response structure
				if (!data || typeof data !== 'object') {
					console.error('Invalid API response format:', data);
					setAudioError('Invalid response from server');
					setAudioLoading(false);
					return;
				}
				
				if (!data.success) {
					console.error('API request failed:', data.error || 'Unknown error');
					setAudioError(data.error || 'Failed to fetch audio uploads');
					setAudioLoading(false);
					return;
				}
				
				const items = Array.isArray(data.items) ? data.items : [];
				console.log('Fetched audio items:', items);
				console.log('Number of items:', items.length);
				
				if (items.length === 0) {
					console.log('No audio items found in response');
					// Set empty arrays and show a message
					setAudioItems([]);
					setFilteredAudioItems([]);
					setAudioError('No audio uploads found. Be the first to upload audio content!');
					setAudioLoading(false);
					return;
				}
				
				// Validate audio items structure and create proper audio URLs
				console.log('Starting validation of', items.length, 'items');
				
				const validatedItems = items.map((item: any, index: number) => {
					console.log(`Validating item ${index}:`, item);
					console.log(`Item ${index} keys:`, Object.keys(item));
					console.log(`Item ${index} audioUrl:`, item.audioUrl);
					console.log(`Item ${index} audioData:`, item.audioData ? 'exists' : 'none');
					console.log(`Item ${index} _id:`, item._id);
					console.log(`Item ${index} title:`, item.title);
					
					// Check if item is empty or invalid
					if (!item || typeof item !== 'object' || Object.keys(item).length === 0) {
						console.error(`Item ${index} is empty or invalid:`, item);
						return null;
					}
					
					// Ensure required fields exist
					if (!item._id) {
						console.error(`Item ${index} missing _id:`, item);
						return null;
					}
					if (!item.title) {
						console.error(`Item ${index} missing title:`, item);
						return null;
					}
					
					// Create proper audio URL - either use existing audioUrl or create one from audioData
					let audioUrl = item.audioUrl;
					if (!audioUrl && item.audioData) {
						// If no audioUrl but audioData exists, create a streaming URL
						audioUrl = `/api/audio/submissions?id=${item._id}`;
						console.log(`Item ${index} created streaming URL:`, audioUrl);
					}
					
					if (!audioUrl) {
						console.error(`Item ${index} missing both audioUrl and audioData:`, item);
						return null;
					}
					
					const validatedItem: AudioItem = {
						...item,
						audioUrl,
					};
					
					console.log(`Item ${index} validated successfully:`, validatedItem);
					return validatedItem;
				}).filter(Boolean) as AudioItem[]; // Remove null items
				
				console.log('Validation complete. Valid items:', validatedItems.length);
				console.log('Validated items:', validatedItems);
				
				// Final cleanup - ensure no invalid items remain
				const finalValidatedItems = validatedItems.filter((item: AudioItem) => 
					item && 
					typeof item === 'object' && 
					Object.keys(item).length > 0 && 
					item._id && 
					item.title && 
					item.audioUrl
				);
				
				console.log('Final validated items after cleanup:', finalValidatedItems);
				
				setAudioItems(finalValidatedItems);
				setFilteredAudioItems(finalValidatedItems);
			} catch (e: any) {
				setAudioError(e?.message || 'Failed to load audio uploads');
			} finally {
				setAudioLoading(false);
			}
		};
		fetchAudio();
	}, []);
	
	// Filter audio items when filters change
	useEffect(() => {
		if (audioItems.length === 0) {
			setFilteredAudioItems([]);
			return;
		}
		
		// Additional safety check - filter out any invalid items
		const validAudioItems = audioItems.filter((item: AudioItem) => 
			item && 
			typeof item === 'object' && 
			Object.keys(item).length > 0 && 
			item._id && 
			item.title && 
			item.audioUrl
		);
		
		if (validAudioItems.length === 0) {
			setFilteredAudioItems([]);
			return;
		}
		
		let result = [...validAudioItems];
		
		// Apply search filter
		if (filters.searchQuery) {
			const query = filters.searchQuery.toLowerCase();
			result = result.filter((audio: AudioItem) => 
				(audio.title || '').toLowerCase().includes(query) ||
				(audio.description || '').toLowerCase().includes(query) ||
				(audio.creatorName || audio.creatorAddress || '').toLowerCase().includes(query) ||
				(audio.tags || []).some(tag => tag.toLowerCase().includes(query))
			);
		}
		
		console.log('Filtered results:', result);
		
		// Update filtered results (we'll use this for display)
		setFilteredAudioItems(result);
	}, [filters, audioItems]);

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFilters(prev => ({ ...prev, searchQuery: e.target.value }));
	};
	
	const handleFilterChange = (filterType: string, value: string) => {
		setFilters(prev => ({ ...prev, [filterType]: value }));
	};

	return (
		<DashboardLayout userType="writer">
			<div className="p-6 md:p-8 space-y-8">
				{/* Audio Uploads Section */}
				<div className="space-y-4">
					<div className="flex items-center justify-between">
						<h2 className="text-2xl font-bold text-white">Explore Audio Uploads</h2>
						<span className="text-sm text-gray-400">{filteredAudioItems.length} uploads</span>
					</div>
					{audioLoading ? (
						<div className="flex items-center justify-center h-40">
							<div className="w-10 h-10 border-t-2 border-b-2 border-[rgb(var(--accent-primary))] rounded-full animate-spin"></div>
						</div>
					) : audioError ? (
						<div className="p-4 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20">
							{audioError}
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
							{filteredAudioItems.map((item, idx) => (
								<motion.div
									key={item._id}
									initial={{ opacity: 0, y: 10 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.2 }}
									className="card overflow-hidden"
								>
									{item.coverImage ? (
										<div className="h-36 bg-cover bg-center" style={{ backgroundImage: `url(${item.coverImage})` }} />
									) : (
										<div className="h-36 bg-gradient-to-r from-[rgb(var(--accent-primary))]/20 to-[rgb(var(--accent-secondary))]/20" />
									)}
									<div className="p-4 space-y-3">
										<div className="flex items-start justify-between gap-3">
											<div>
												<h3 className="text-lg font-semibold text-white">{item.title}</h3>
												{(item.creatorName || item.creatorAddress) && (
													<p className="text-xs text-gray-400">By {item.creatorName || item.creatorAddress}</p>
												)}
											</div>
											{item.durationSeconds ? (
												<span className="text-xs px-2 py-1 rounded bg-white/5 text-gray-300">
													{Math.floor(item.durationSeconds/60)}:{String(item.durationSeconds%60).padStart(2,'0')}
												</span>
											) : null}
										</div>
										{item.description && (
											<p className="text-sm text-gray-300 line-clamp-2">{item.description}</p>
										)}
										<div className="flex items-center gap-3">
											<button
												onClick={() => {
													try {
														// Additional safety checks
														if (!item || typeof item !== 'object' || Object.keys(item).length === 0) {
															console.error('Invalid item object:', item);
															return;
														}
														
														// Check if audioUrl exists and is valid
														if (!item.audioUrl) {
															console.error('No audio URL available for item:', item);
															return;
														}
														
														// Filter out any invalid items from the tracks
														const validTracks = filteredAudioItems
															.filter(a => a && a._id && a.title && a.audioUrl)
															.map(a => ({
																id: a._id, 
																title: a.title, 
																audioUrl: a.audioUrl,
																coverImage: a.coverImage, 
																creatorAddress: a.creatorAddress, 
																durationSeconds: a.durationSeconds 
															}));
														
														if (validTracks.length === 0) {
															console.error('No valid tracks found');
															return;
														}
														
														setQueueAndPlay(validTracks, idx);
													} catch (error) {
														console.error('Error playing audio:', error);
													}
												}}
												className="px-4 py-2 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white text-sm font-semibold hover:opacity-90"
											>
												Play
											</button>
											{item.durationSeconds ? (
												<span className="text-xs text-gray-400">{Math.floor((item.durationSeconds||0)/60)}:{String((item.durationSeconds||0)%60).padStart(2,'0')}</span>
											) : null}
										</div>
										{item.tags && item.tags.length > 0 && (
											<div className="flex flex-wrap gap-2">
												{item.tags.slice(0, 4).map((t, tagIdx) => (
													<span key={tagIdx} className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-300">{t}</span>
												))}
												{item.tags.length > 4 && (
													<span className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-300">+{item.tags.length - 4} more</span>
												)}
											</div>
										)}
									</div>
								</motion.div>
							))}
							{filteredAudioItems.length === 0 && (
								<div className="col-span-full p-6 text-center border border-dashed border-white/10 rounded-lg bg-black/20 text-gray-400">
									{audioError ? audioError : 'No audio uploads found.'}
									{!audioError && (
										<div className="mt-4">
											<p className="text-sm text-gray-500 mb-3">Start by uploading your first audio content!</p>
											<Link 
												href="/audiomarket/writer/submit" 
												className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white text-sm font-semibold hover:opacity-90"
											>
												Upload Audio
											</Link>
										</div>
									)}
								</div>
							)}
						</div>
					)}
				</div>

				{/* Enhanced Header Section */}
				<div className="flex flex-col md:flex-row justify-between items-start md:items-center">
					<div>
						<h1 className="text-3xl font-bold text-white mb-2">Browse Projects</h1>
						<p className="text-gray-400">Discover opportunities and submit your scripts</p>
					</div>
					
					<div className="mt-4 md:mt-0 flex items-center gap-3">
						<span className="text-gray-400 text-sm">
							{filteredAudioItems.length} {filteredAudioItems.length === 1 ? 'project' : 'projects'} available
						</span>
						{filters.searchQuery || filters.genre !== 'All' ? (
							<button
								onClick={() => setFilters({
									searchQuery: '',
									genre: 'All',
								})}
								className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-sm transition-colors flex items-center gap-1"
							>
								<span>Clear filters</span>
								<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						) : null}
					</div>
				</div>

				{/* Improved Search and Filters */}
				<div className="bg-black/20 border border-white/10 rounded-xl p-4 md:p-6">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						<div className="md:col-span-2">
							<div className="relative">
								<input
									type="text"
									placeholder="Search by title, description, creator, or tags..."
									value={filters.searchQuery}
									onChange={handleSearchChange}
									className="w-full pl-4 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[rgb(var(--accent-primary))]"
								/>
							</div>
						</div>
						<div>
							<select
								value={filters.genre}
								onChange={(e) => handleFilterChange('genre', e.target.value)}
								className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:border-[rgb(var(--accent-primary))]"
							>
								<option value="All">All Genres</option>
								<option value="Drama">Drama</option>
								<option value="Comedy">Comedy</option>
								<option value="Thriller">Thriller</option>
								<option value="Horror">Horror</option>
								<option value="Sci-Fi">Sci-Fi</option>
								<option value="Fantasy">Fantasy</option>
								<option value="Documentary">Documentary</option>
							</select>
						</div>
						<div className="flex items-end">
							<button className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] text-white">Apply</button>
						</div>
					</div>
				</div>
			</div>
		</DashboardLayout>
	);
} 