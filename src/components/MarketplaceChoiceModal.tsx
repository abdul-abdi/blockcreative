import React from 'react';

type Props = {
    open: boolean;
    onClose: () => void;
    onSelect:(choice: "script"| "audio") => void;
}

export default function MarketplaceChoiceModal({open, onClose, onSelect}:Props){
    if(!open) return null;
    return(
        <div className = "fixed z-50 flex items-center justify-center inset-0 bg-black/50 ">
            <div className = "bg-gray-800 rounded-lg p-8 max-w-sm w-full text-center">
                <h2 className='text-2xl font-bold mb-4'>Choose a marketplace</h2>
                <div className='flex flex-col gap-4'>
                    <button className='px-4 py-2 *:text-white rounded bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed' 
                    onClick ={() => onSelect("script")} >Script Marketplace</button>
                    <button className='px-4 py-2  text-white rounded bg-gradient-to-r from-[rgb(var(--accent-primary))] to-[rgb(var(--accent-secondary))] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed' onClick ={() => onSelect("audio")} >Audio Marketplace</button>
                </div>
                <button className='mt-6 text-gray-300 hover:underline' onClick={onClose}>Cancel</button>
            </div>
        </div>
    )
}