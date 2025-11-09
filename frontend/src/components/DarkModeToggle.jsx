import React, { useState, useEffect } from 'react';
import './DarkModeToggle.css';

const DarkModeToggle = () => {
  // LocalStorage'dan tema tercihini al (varsayılan: dark)
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === null ? true : saved === 'dark'; // Varsayılan dark
  });

  useEffect(() => {
    // Tema değiştiğinde document'e attribute ekle
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  return (
    <button 
      className="theme-toggle-btn" 
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={isDark ? 'Light moda geç' : 'Dark moda geç'}
    >
      <div className="toggle-container">
        <span className="toggle-icon">
          {isDark ? '🌙' : '☀️'}
        </span>
      </div>
    </button>
  );
};

export default DarkModeToggle;