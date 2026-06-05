export const genreFallbacks = {
  'hip-hop': '#fdba74', // Warm soft orange
  'rap': '#fed7aa',    // Lighter orange
  'electronic': '#c084fc', // Soft purple
  'dance': '#ddd6fe',
  'rock': '#fca5a5',    // Soft light red
  'metal': '#fca5a5',
  'pop': '#fbcfe8',     // Soft pink
  'jazz': '#99f6e4',    // Soft teal
  'soul': '#fde68a',    // Soft amber
  'blues': '#bfdbfe',   // Soft blue
  'r&b': '#fbcfe8',
  'classical': '#a7f3d0',
  'folk': '#d9f99d',
  'country': '#fed7aa',
  'reggae': '#d9f99d',
  'indie': '#c7d2fe',
  'alt': '#e4e4e7',
};

/**
 * Converts a hex color to HSL, clamps its saturation to a low value
 * and forces lightness to a high pastel level to avoid color clashing
 * and maintain high contrast with text.
 */
export const clampColorToPastel = (hex) => {
  if (!hex || hex.length !== 7 || !hex.startsWith('#')) return '#f5f5f4';

  // Parse hex
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  // Normalize to 0-1
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  // Cap saturation to 14% (ambient tint)
  // Force lightness to exactly 93% for a beautiful, clean pastel background
  s = Math.min(s, 0.14);
  l = 0.93;

  // Convert HSL back to RGB
  let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  let p = 2 * l - q;

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  const newR = Math.round(hue2rgb(p, q, h + 1/3) * 255);
  const newG = Math.round(hue2rgb(p, q, h) * 255);
  const newB = Math.round(hue2rgb(p, q, h - 1/3) * 255);

  const toHex = (x) => {
    const hexStr = x.toString(16);
    return hexStr.length === 1 ? '0' + hexStr : hexStr;
  };

  return `#${toHex(newR)}${toHex(newG)}${toHex(newB)}`;
};

export const getGenreColor = (genre = '') => {
  const norm = genre.toLowerCase().trim();
  for (const [key, color] of Object.entries(genreFallbacks)) {
    if (norm.includes(key)) {
      return clampColorToPastel(color);
    }
  }
  return '#f5f5f4'; // default neutral tone
};

export const extractAverageColor = (imageUrl, genre = '') => {
  return new Promise((resolve) => {
    if (!imageUrl || imageUrl.startsWith('data:')) {
      resolve(getGenreColor(genre));
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(getGenreColor(genre));
          return;
        }

        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        
        // Convert to hex
        const hex = '#' + [r, g, b].map(x => {
          const hexStr = x.toString(16);
          return hexStr.length === 1 ? '0' + hexStr : hexStr;
        }).join('');
        
        resolve(clampColorToPastel(hex));
      } catch (err) {
        console.warn('Canvas average color extraction failed due to CORS or other error:', err);
        resolve(getGenreColor(genre));
      }
    };

    img.onerror = () => {
      resolve(getGenreColor(genre));
    };

    img.src = imageUrl;
  });
};
