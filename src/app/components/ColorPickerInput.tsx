'use client';

import { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';

interface ColorPickerInputProps {
  color: string;
  onChange: (color: string) => void;
  colorFormat: 'hex' | 'rgb' | 'hsl';
  placeholder?: string;
  className?: string;
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.substr(1, 2), 16) / 255;
  const g = parseInt(hex.substr(3, 2), 16) / 255;
  const b = parseInt(hex.substr(5, 2), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100];
}

function hexToHslString(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  return `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`;
}

function formatColor(hex: string, format: 'hex' | 'rgb' | 'hsl'): string {
  switch (format) {
    case 'hex':
      return hex;
    case 'rgb':
      return hexToRgb(hex);
    case 'hsl':
      return hexToHslString(hex);
    default:
      return hex;
  }
}

function rgbToHex(rgb: string): string {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return '#000000';
  
  const [, r, g, b] = match;
  const toHex = (n: string) => {
    const hex = parseInt(n).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hslToHex(h: number, s: number, l: number): string {
  h /= 360;
  s /= 100;
  l /= 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hslStringToHex(hsl: string): string {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return '#000000';
  
  const [, h, s, l] = match;
  return hslToHex(parseInt(h), parseInt(s), parseInt(l));
}

function parseColorInput(input: string): string {
  const trimmed = input.trim().toLowerCase();
  
  if (trimmed.match(/^#[0-9a-f]{6}$/)) {
    return trimmed;
  }
  
  if (trimmed.match(/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/)) {
    return rgbToHex(trimmed);
  }
  
  if (trimmed.match(/^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/)) {
    return hslStringToHex(trimmed);
  }
  
  return input;
}

export default function ColorPickerInput({ 
  color, 
  onChange, 
  colorFormat, 
  placeholder,
  className = ''
}: ColorPickerInputProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  const defaultPlaceholder = colorFormat === 'hex' ? '#000000' : 
                           colorFormat === 'rgb' ? 'rgb(0, 0, 0)' : 
                           'hsl(0, 0%, 0%)';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showColorPicker && !(event.target as Element).closest('.color-picker-button') && !(event.target as Element).closest('.color-picker-popover')) {
        setShowColorPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColorPicker]);

  return (
    <div className={`color-picker-input-group ${className}`}>
      <div 
        className="color-picker-button" 
        style={{ backgroundColor: color }} 
        onClick={() => setShowColorPicker(true)}
      >
        {showColorPicker && (
          <div className="color-picker-popover">
            <HexColorPicker 
              color={color} 
              onChange={onChange}
            />
          </div>
        )}
      </div>
      <input
        type="text"
        value={formatColor(color, colorFormat)}
        onChange={(e) => {
          const parsedColor = parseColorInput(e.target.value);
          onChange(parsedColor);
        }}
        className="input"
        placeholder={placeholder || defaultPlaceholder}
      />
    </div>
  );
}