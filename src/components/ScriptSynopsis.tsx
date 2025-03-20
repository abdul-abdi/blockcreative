'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { ScriptSynopsis as SynopsisType } from '@/models/Script';

interface Props {
  synopsis: SynopsisType;
  className?: string;
  onRegenerateClick?: () => void;
  showRegenerateButton?: boolean;
  isLoading?: boolean;
}

/**
 * Component for displaying AI-generated script synopsis including
 * logline, synopsis, tone, themes, and other metadata.
 */
export const ScriptSynopsis = ({
  synopsis,
  className = '',
  onRegenerateClick,
  showRegenerateButton = false,
  isLoading = false
}: Props) => {
  const [expanded, setExpanded] = useState(false);

  if (!synopsis) {
    return (
      <div className={`rounded-lg bg-gray-50 dark:bg-gray-800 p-4 ${className}`}>
        <p className="text-gray-500 dark:text-gray-400 text-center">
          No synopsis available for this script.
        </p>
        {showRegenerateButton && onRegenerateClick && (
          <button
            onClick={onRegenerateClick}
            disabled={isLoading}
            className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              'Generate Synopsis'
            )}
          </button>
        )}
      </div>
    );
  }

  const fadeInAnimation = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
  };

  const expandAnimation = {
    hidden: { height: 0, opacity: 0 },
    visible: { height: 'auto', opacity: 1, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
      className={`rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm ${className}`}
      initial="hidden"
      animate="visible"
      variants={fadeInAnimation}
    >
      <div className="p-4 space-y-4">
        {/* Header with optional suggested title */}
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              AI Synopsis
            </h3>
            {synopsis.generated_at && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Generated on {new Date(synopsis.generated_at).toLocaleDateString()}
              </p>
            )}
          </div>
          {synopsis.title_suggestion && (
            <div className="ml-4 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-sm rounded-full">
              Suggested title: {synopsis.title_suggestion}
            </div>
          )}
        </div>
        
        {/* Logline */}
        <div>
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-1">Logline</h4>
          <p className="text-gray-800 dark:text-gray-200 italic">
            {synopsis.logline}
          </p>
        </div>
        
        {/* Synopsis */}
        <div>
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-1">Synopsis</h4>
          <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {synopsis.synopsis}
          </p>
        </div>
        
        {/* Tone */}
        <div>
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-1">Tone</h4>
          <div className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-100 text-sm rounded-full inline-block">
            {synopsis.tone}
          </div>
        </div>
        
        {/* Themes */}
        <div>
          <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-1">Themes</h4>
          <div className="flex flex-wrap gap-2">
            {synopsis.themes.map((theme, index) => (
              <div key={index} className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 text-sm rounded-full">
                {theme}
              </div>
            ))}
          </div>
        </div>
        
        {/* Target Audience - Only show if provided */}
        {synopsis.target_audience && synopsis.target_audience.length > 0 && (
          <motion.div
            initial={expanded ? "visible" : "hidden"}
            animate={expanded ? "visible" : "hidden"}
            variants={expandAnimation}
          >
            <h4 className="text-md font-medium text-gray-700 dark:text-gray-300 mb-1">Target Audience</h4>
            <div className="flex flex-wrap gap-2">
              {synopsis.target_audience.map((audience, index) => (
                <div key={index} className="px-3 py-1 bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100 text-sm rounded-full">
                  {audience}
                </div>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Expand/Collapse Button - Only show if there's target audience */}
        {synopsis.target_audience && synopsis.target_audience.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
        
        {/* Regenerate Button */}
        {showRegenerateButton && onRegenerateClick && (
          <button
            onClick={onRegenerateClick}
            disabled={isLoading}
            className="mt-2 w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-400 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Regenerating...
              </>
            ) : (
              'Regenerate Synopsis'
            )}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ScriptSynopsis;