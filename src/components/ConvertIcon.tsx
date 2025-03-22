// First, create a new component for the convert icon
import React from 'react';

export const ConvertIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    fill="none" 
    viewBox="0 0 24 24" 
    className={className} 
    xmlns="http://www.w3.org/2000/svg"
  >
    <g stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5">
      <path d="m2 18.85v-2.7c0-2.25.9-3.15 3.15-3.15h2.7c2.25 0 3.15.9 3.15 3.15v2.7c0 2.25-.9 3.15-3.15 3.15h-2.7"/>
      <path d="m22 15c0 3.87-3.13 7-7 7l1.05-1.75"/>
      <path d="m2 9c0-3.87 3.13-7 7-7l-1.05 1.75"/>
      <path d="m17.5 11c2.4853 0 4.5-2.01472 4.5-4.5s-2.0147-4.5-4.5-4.5-4.5 2.01472-4.5 4.5 2.0147 4.5 4.5 4.5z"/>
    </g>
  </svg>
);