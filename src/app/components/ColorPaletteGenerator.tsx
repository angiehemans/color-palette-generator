'use client';

import { useState, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';
import { IconColorPicker, IconCopy, IconChevronDown } from '@tabler/icons-react';
import * as Select from '@radix-ui/react-select';

interface ColorPaletteGeneratorProps {
  defaultColor: string;
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

function hexToRgb(hex: string): string {
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  return `rgb(${r}, ${g}, ${b})`;
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

function hslStringToHex(hsl: string): string {
  const match = hsl.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return '#000000';
  
  const [, h, s, l] = match;
  return hslToHex(parseInt(h), parseInt(s), parseInt(l));
}

function parseColorInput(input: string): string {
  const trimmed = input.trim().toLowerCase();
  
  // Check if it's already a valid hex
  if (trimmed.match(/^#[0-9a-f]{6}$/)) {
    return trimmed;
  }
  
  // Check if it's RGB format
  if (trimmed.match(/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/)) {
    return rgbToHex(trimmed);
  }
  
  // Check if it's HSL format
  if (trimmed.match(/^hsl\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)$/)) {
    return hslStringToHex(trimmed);
  }
  
  // Return original if no valid format found
  return input;
}

function generatePalette(baseColor: string, shadePercentages: number[], tintPercentages: number[]) {
  const [h, s, l] = hexToHsl(baseColor);
  
  const shades = shadePercentages.map(percent => {
    const newL = Math.max(0, l - (l * percent / 100));
    return { percent, hex: hslToHex(h, s, newL), type: 'shade' };
  });

  const tints = tintPercentages.map(percent => {
    const newL = Math.min(100, l + ((100 - l) * percent / 100));
    return { percent, hex: hslToHex(h, s, newL), type: 'tint' };
  });

  return { base: baseColor, shades, tints };
}

function getTextColor(hexColor: string): string {
  // Convert hex to RGB
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  
  // Calculate luminance using relative luminance formula
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return white for dark backgrounds, black for light backgrounds
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

export default function ColorPaletteGenerator({ defaultColor }: ColorPaletteGeneratorProps) {
  const [baseColor, setBaseColor] = useState(defaultColor);
  const [colorFormat, setColorFormat] = useState<'hex' | 'rgb' | 'hsl'>('hex');
  const [showToast, setShowToast] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [shadePercentages, setShadePercentages] = useState([10, 20, 30, 50, 70]);
  const [tintPercentages, setTintPercentages] = useState([15, 25, 35, 50, 65, 75, 85, 92, 96, 98]);
  const palette = generatePalette(baseColor, shadePercentages, tintPercentages);

  const handleEyeDropper = async () => {
    if ('EyeDropper' in window) {
      try {
        const eyeDropper = new (window as Window & { EyeDropper: new () => { open(): Promise<{ sRGBHex: string }> } }).EyeDropper();
        const result = await eyeDropper.open();
        setBaseColor(result.sRGBHex);
      } catch {
        console.log('User cancelled eyedropper');
      }
    } else {
      alert('EyeDropper API is not supported in this browser. Please use Chrome 95+ or Edge 95+');
    }
  };

  const copyAllValues = async () => {
    const colorArray = allColors.map(color => formatColor(color.hex, colorFormat));
    try {
      await navigator.clipboard.writeText(JSON.stringify(colorArray, null, 2));
      setShowToast(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyIndividualColor = async (colorHex: string) => {
    try {
      await navigator.clipboard.writeText(formatColor(colorHex, colorFormat));
      setShowToast(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Close color picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showColorPicker && !(event.target as Element).closest('.color-picker-button')) {
        setShowColorPicker(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showColorPicker]);
  
  // Get all hex values sorted from dark to light
  const allColors = [
    ...palette.shades.reverse().map(shade => ({ ...shade, label: `-${shade.percent}%` })), // darkest first
    { hex: palette.base, type: 'base', label: 'Base Color', percent: undefined },
    ...palette.tints.map(tint => ({ ...tint, label: `+${tint.percent}%` })) // lightest last
  ];

  return (
    <div className="card">
      <label className="label">Choose Base Color</label>
      <div className="color-input-section">
        <div className="color-picker-button" style={{ backgroundColor: baseColor }} onClick={() => setShowColorPicker(!showColorPicker)}>
          {showColorPicker && (
            <div className="color-picker-popover">
              <HexColorPicker 
                color={baseColor} 
                onChange={setBaseColor}
              />
            </div>
          )}
        </div>
        <input
          type="text"
          value={formatColor(baseColor, colorFormat)}
          onChange={(e) => {
            const parsedColor = parseColorInput(e.target.value);
            setBaseColor(parsedColor);
          }}
          className="input"
          placeholder={colorFormat === 'hex' ? '#000000' : colorFormat === 'rgb' ? 'rgb(0, 0, 0)' : 'hsl(0, 0%, 0%)'}
        />
        <button
          onClick={handleEyeDropper}
          className="button"
          title="Pick color from screen"
        >
          <IconColorPicker size={16} />
        </button>
        <Select.Root value={colorFormat} onValueChange={(value) => setColorFormat(value as 'hex' | 'rgb' | 'hsl')}>
          <Select.Trigger className="radix-select-trigger">
            <Select.Value />
            <Select.Icon>
              <IconChevronDown size={16} />
            </Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="radix-select-content">
              <Select.Viewport>
                <Select.Item value="hex" className="radix-select-item">
                  <Select.ItemText>HEX</Select.ItemText>
                </Select.Item>
                <Select.Item value="rgb" className="radix-select-item">
                  <Select.ItemText>RGB</Select.ItemText>
                </Select.Item>
                <Select.Item value="hsl" className="radix-select-item">
                  <Select.ItemText>HSL</Select.ItemText>
                </Select.Item>
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>
      <div className="space-y-2">
        {allColors.map((color, index) => {
          const isShade = color.type === 'shade';
          const isTint = color.type === 'tint';
          const isBase = color.type === 'base';
          
          // Calculate the actual array index for shades and tints
          const getArrayIndex = () => {
            if (isShade) {
              // Shades are reversed, so we need to account for that
              return palette.shades.length - 1 - (index);
            } else if (isTint) {
              // Tints start after shades + base color
              return index - palette.shades.length - 1;
            }
            return -1;
          };
          
          return (
            <div key={index} className="color-list-item">
              <div
                className="color-list-swatch"
                style={{ 
                  backgroundColor: color.hex,
                  color: getTextColor(color.hex)
                }}
              >
                <div className="color-swatch-text">{formatColor(color.hex, colorFormat)}</div>
                <div className="color-swatch-controls">
                  {!isBase && (
                    <>
                      <input
                        type="number"
                        value={color.percent || 0}
                        onChange={(e) => {
                          const newPercent = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                          const arrayIndex = getArrayIndex();
                          
                          if (isShade && arrayIndex !== -1) {
                            const newShades = [...shadePercentages];
                            newShades[arrayIndex] = newPercent;
                            setShadePercentages(newShades);
                          } else if (isTint && arrayIndex !== -1) {
                            const newTints = [...tintPercentages];
                            newTints[arrayIndex] = newPercent;
                            setTintPercentages(newTints);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                            e.preventDefault();
                            const increment = e.shiftKey ? 10 : 1;
                            const currentValue = color.percent || 0;
                            const newPercent = e.key === 'ArrowUp' 
                              ? Math.min(100, currentValue + increment)
                              : Math.max(0, currentValue - increment);
                            
                            const arrayIndex = getArrayIndex();
                            
                            if (isShade && arrayIndex !== -1) {
                              const newShades = [...shadePercentages];
                              newShades[arrayIndex] = newPercent;
                              setShadePercentages(newShades);
                            } else if (isTint && arrayIndex !== -1) {
                              const newTints = [...tintPercentages];
                              newTints[arrayIndex] = newPercent;
                              setTintPercentages(newTints);
                            }
                          }
                        }}
                        className="percentage-input"
                        style={{ color: getTextColor(color.hex) }}
                        min="0"
                        max="100"
                        step="1"
                      />
                      <span className="percentage-sign" style={{ color: getTextColor(color.hex) }}>%</span>
                    </>
                  )}
                  {isBase && <div className="color-swatch-label">{color.label}</div>}
                </div>
                <button
                  className="color-swatch-copy"
                  onClick={() => copyIndividualColor(color.hex)}
                  title="Copy color value"
                  style={{ color: getTextColor(color.hex) }}
                >
                  <IconCopy size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <button
        onClick={copyAllValues}
        className="button"
        title="Copy all values as array"
      >
        <IconCopy size={16} />
        <span style={{ marginLeft: '0.5rem' }}>Copy All Values</span>
      </button>
      
      <div className={`toast ${showToast ? 'show' : ''}`}>
        Colors copied to clipboard!
      </div>
    </div>
  );
}