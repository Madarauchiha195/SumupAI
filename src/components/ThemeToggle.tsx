import React from 'react';
import './ThemeToggle.css';

interface ThemeToggleProps {
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ darkMode, setDarkMode }) => {
  return (
    <div className="toggle">
      <input 
        type="checkbox"
        checked={darkMode}
        onChange={(e) => setDarkMode(e.target.checked)}
      />
      <span className="button"></span>
      <span className="label">
        {darkMode ? '☾' : '☼'}
      </span>
    </div>
  );
};