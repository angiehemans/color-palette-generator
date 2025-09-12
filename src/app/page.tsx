'use client';

import { useState, useEffect } from 'react';
import ColorPaletteGenerator from './components/ColorPaletteGenerator';
import { IconPlus, IconSun, IconMoon } from '@tabler/icons-react';

interface Palette {
  id: string;
  defaultColor: string;
  lightColor?: string;
  darkColor?: string;
}

export default function Home() {
  const [palettes, setPalettes] = useState<Palette[]>([
    { id: '1', defaultColor: '#6b7280' },
    { id: '2', defaultColor: '#3b82f6' },
    { id: '3', defaultColor: '#8b5cf6' },
    { id: '4', defaultColor: '#fff500', darkColor: '#f79508' }
  ]);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Check localStorage for saved theme preference
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme) {
      setDarkMode(JSON.parse(savedTheme));
    }
  }, []);

  useEffect(() => {
    // Save theme preference and apply to document
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const addNewPalette = () => {
    const newPalette: Palette = {
      id: Date.now().toString(),
      defaultColor: '#6b7280' // grey default
    };
    setPalettes([...palettes, newPalette]);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className="container">
      <div className="max-width">
        <div className="header">
          <h1 className="title">
            Color Palette Generator
          </h1>
          <button 
            onClick={toggleDarkMode}
            className="theme-toggle"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <IconSun size={20} /> : <IconMoon size={20} />}
          </button>
        </div>

        <div className="palette-grid">
          {palettes.map((palette) => (
            <ColorPaletteGenerator 
              key={palette.id}
              defaultColor={palette.defaultColor}
              lightColor={palette.lightColor}
              darkColor={palette.darkColor}
            />
          ))}
          
          <button 
            onClick={addNewPalette}
            className="add-palette-button"
          >
            <IconPlus size={24} />
            Add New Palette
          </button>
        </div>
        
        <footer className="footer">
          Built with love by <a href="https://www.angiehemans.com" target="_blank" rel="noopener noreferrer">Angie Hemans</a>
        </footer>
      </div>
    </div>
  );
}