'use client';

import { useState, useEffect } from 'react';
import { IconCopy, IconTrash, IconPlus, IconPalette, IconContrast } from '@tabler/icons-react';
import * as Select from '@radix-ui/react-select';
import { IconChevronDown } from '@tabler/icons-react';
import ColorPickerInput from './ColorPickerInput';

interface ColorSwatch {
  id: string;
  hex: string;
}

interface ColorSwatchCollectionProps {
  defaultColors?: string[];
  onCreatePalettes?: (colors: string[]) => void;
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

function getTextColor(hexColor: string): string {
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

function hexToGrayscale(hex: string): string {
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  
  // Use luminance formula for accurate grayscale conversion
  const gray = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
  const grayHex = gray.toString(16).padStart(2, '0');
  
  return `#${grayHex}${grayHex}${grayHex}`;
}

export default function ColorSwatchCollection({ defaultColors = ['#6b7280', '#3b82f6', '#27AB66', '#8b5cf6', '#fff500', '#f79508', '#DC3232'], onCreatePalettes }: ColorSwatchCollectionProps) {
  const [swatches, setSwatches] = useState<ColorSwatch[]>([]);
  const [currentColor, setCurrentColor] = useState('#3b82f6');
  const [colorFormat, setColorFormat] = useState<'hex' | 'rgb' | 'hsl'>('hex');
  const [showToast, setShowToast] = useState(false);
  const [grayscaleMode, setGrayscaleMode] = useState(false);

  // Initialize with default colors
  useEffect(() => {
    const initialSwatches = defaultColors.map((color, index) => ({
      id: `default-${index}`,
      hex: color
    }));
    setSwatches(initialSwatches);
  }, []);

  const addSwatch = () => {
    const newSwatch: ColorSwatch = {
      id: Date.now().toString(),
      hex: currentColor
    };
    setSwatches([...swatches, newSwatch]);
  };

  const deleteSwatch = (id: string) => {
    setSwatches(swatches.filter(swatch => swatch.id !== id));
  };

  const copyAllValues = async () => {
    const colorArray = swatches.map(swatch => formatColor(swatch.hex, colorFormat));
    try {
      await navigator.clipboard.writeText(JSON.stringify(colorArray, null, 2));
      setShowToast(true);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyAsHTML = async () => {
    const htmlSwatches = swatches.map(swatch => {
      const textColor = getTextColor(swatch.hex);
      
      return `<div style="width: 100px; height: 100px; background-color: ${swatch.hex}; color: ${textColor}; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-family: monospace; font-size: 12px; font-weight: 600; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        ${formatColor(swatch.hex, colorFormat)}
      </div>`;
    }).join('\n    ');

    const fullHTML = `<div style="display: flex; flex-wrap: wrap; gap: 12px; padding: 16px; background-color: #f8fafc; border-radius: 12px;">
    ${htmlSwatches}
  </div>`;

    try {
      await navigator.clipboard.writeText(fullHTML);
      setShowToast(true);
    } catch (err) {
      console.error('Failed to copy HTML:', err);
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

  const createPalettes = () => {
    if (onCreatePalettes && swatches.length > 0) {
      const colors = swatches.map(swatch => swatch.hex);
      onCreatePalettes(colors);
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

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <label className="label" style={{ margin: 0 }}>Color Swatch Collection</label>
        <button
          onClick={() => setGrayscaleMode(!grayscaleMode)}
          className={`grayscale-toggle ${grayscaleMode ? 'active' : ''}`}
          title={grayscaleMode ? 'Show colors' : 'Show grayscale for contrast checking'}
        >
          <IconContrast size={16} />
          <span>Contrast</span>
        </button>
      </div>
      
      {/* Add new color section */}
      <div className="color-input-section">
        <ColorPickerInput
          color={currentColor}
          onChange={setCurrentColor}
          colorFormat={colorFormat}
        />
        
        <button
          onClick={addSwatch}
          className="button"
          title="Add color to collection"
        >
          <IconPlus size={16} />
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

      {/* Swatches grid */}
      <div className="swatch-collection-grid">
        {swatches.map((swatch) => {
          const displayColor = grayscaleMode ? hexToGrayscale(swatch.hex) : swatch.hex;
          return (
            <div
              key={swatch.id}
              className="swatch-collection-item"
              style={{ 
                backgroundColor: displayColor,
                color: getTextColor(displayColor)
              }}
            >
              <div className="swatch-collection-color">
                {grayscaleMode ? formatColor(displayColor, colorFormat) : formatColor(swatch.hex, colorFormat)}
              </div>
              <div className="swatch-collection-actions">
                <button
                  className="swatch-action-button"
                  onClick={() => copyIndividualColor(swatch.hex)}
                  title="Copy color value"
                  style={{ color: getTextColor(displayColor) }}
                >
                  <IconCopy size={12} />
                </button>
                <button
                  className="swatch-action-button"
                  onClick={() => deleteSwatch(swatch.id)}
                  title="Delete swatch"
                  style={{ color: getTextColor(displayColor) }}
                >
                  <IconTrash size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
        <button
          onClick={createPalettes}
          className="button"
          title="Create palette generators from swatches"
          disabled={swatches.length === 0}
          style={{ 
            opacity: swatches.length === 0 ? 0.5 : 1,
            cursor: swatches.length === 0 ? 'not-allowed' : 'pointer'
          }}
        >
          <IconPalette size={16} />
          <span style={{ marginLeft: '0.5rem' }}>Create Palettes</span>
        </button>
        <button
          onClick={copyAllValues}
          className="button"
          title="Copy all values as array"
        >
          <IconCopy size={16} />
          <span style={{ marginLeft: '0.5rem' }}>Copy Values</span>
        </button>
        <button
          onClick={copyAsHTML}
          className="button"
          title="Copy as HTML with inline styles"
        >
          <IconCopy size={16} />
          <span style={{ marginLeft: '0.5rem' }}>Copy HTML</span>
        </button>
      </div>
      
      <div className={`toast ${showToast ? 'show' : ''}`}>
        Colors copied to clipboard!
      </div>
    </div>
  );
}