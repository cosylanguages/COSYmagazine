/**
 * blog/js/art/motifs.js
 * SVG motif generators for COSY magazine cover art, dividers, pullquotes, and word cards.
 * Provides 13 distinct procedural art motifs with cozy, tactile warm paper feel:
 * 1. paper-cut
 * 2. riso-print
 * 3. gingham-knit
 * 4. tea-stain
 * 5. window-light
 * 6. ticket-stub
 * 7. doodle-border
 * 8. vintage-stamp
 * 9. tea-ring-wash
 * 10. pressed-flower
 * 11. postcard-stamp
 * 12. terrazzo-tile
 * 13. pressed-leaf
 */

export const MOTIFS = {
  'paper-cut': generatePaperCut,
  'riso-print': generateRisoPrint,
  'gingham-knit': generateGinghamKnit,
  'tea-stain': generateTeaStain,
  'window-light': generateWindowLight,
  'ticket-stub': generateTicketStub,
  'doodle-border': generateDoodleBorder,
  'vintage-stamp': generateVintageStamp,
  'tea-ring-wash': generateTeaRingWash,
  'pressed-flower': generatePressedFlower,
  'postcard-stamp': generatePostcardStamp,
  'terrazzo-tile': generateTerrazzoTile,
  'pressed-leaf': generatePressedLeaf,
  'notebook-handwritten': generateNotebookHandwritten
};

// Default cozy light, warm paper-based color palettes by desk / theme
// Palette structure: [Dark Ink/Accent 0, Primary Warm Accent 1, Secondary Warm Accent 2, Light Paper Base 3]
export const DEFAULT_PALETTES = {
  'Front Page': ['#3A2E2B', '#C86D51', '#6B8E7B', '#FAF6EE'],       // Cream base, Terracotta, Sage, Dark Espresso ink
  'Words': ['#2C3630', '#5A7A66', '#C97A7E', '#F7F0D8'],            // Butter Yellow base, Sage, Dusty Rose, Dark Slate ink
  'Grammar Made Cosy': ['#2B3542', '#4A7A82', '#B85C38', '#F5EFE6'],// Parchment base, Slate Teal, Burnt Sienna, Deep Charcoal ink
  'Say It': ['#4A282D', '#C97A8B', '#D4A359', '#FAF0EB'],           // Rose Cream base, Dusty Rose, Butter Gold, Deep Maroon ink
  'Culture & Quotes': ['#3B2338', '#98738E', '#B05C49', '#F6F4EE'], // Linen base, Soft Plum, Terracotta, Deep Plum ink
  'Long Reads': ['#22382D', '#52796F', '#A0522D', '#EFF3ED'],       // Sage Parchment base, Sage Green, Warm Clay, Deep Forest ink
  'Cosy Events': ['#3E2723', '#C06C84', '#C8963E', '#F9EBEA'],     // Soft Pink base, Dusty Rose, Ochre Gold, Espresso ink
  'The Podcast': ['#3D2B1F', '#8C6239', '#5A7B6A', '#F4EBE1'],      // Vintage Tea base, Tea Brown, Sage, Dark Sepia ink
  'Back Issues': ['#332219', '#B85A3A', '#4A6572', '#F5EFE6']       // Cream Beige base, Terracotta, Muted Slate, Deep Sepia ink
};

/** 1. Paper-Cut Motif */
export function generatePaperCut({ width, height, palette, prng }) {
  const bg = palette[3] || '#FAF6EE';
  const c1 = palette[0] || '#3A2E2B';
  const c2 = palette[1] || '#C86D51';
  const c3 = palette[2] || '#6B8E7B';

  const shapeCount = prng.rangeInt(5, 8);
  let shapesSvg = '';

  for (let i = 0; i < shapeCount; i++) {
    const color = prng.pick([c2, c3, '#E8D2C2', '#D5E2D9']);
    const cx = prng.rangeInt(0, width);
    const cy = prng.rangeInt(0, height);
    const radius = prng.rangeInt(60, Math.min(width, height) / 1.7);
    const sides = prng.rangeInt(3, 7);

    let points = [];
    for (let s = 0; s < sides; s++) {
      const angle = (s / sides) * Math.PI * 2 + prng.rangeFloat(-0.2, 0.2);
      const r = radius * prng.rangeFloat(0.7, 1.25);
      const px = Math.round(cx + Math.cos(angle) * r);
      const py = Math.round(cy + Math.sin(angle) * r);
      points.push(`${px},${py}`);
    }

    shapesSvg += `
      <polygon points="${points.join(' ')}" fill="${color}" opacity="0.75" style="filter: drop-shadow(2px 3px 3px rgba(60,40,30,0.08));" />
    `;
  }

  return `
    <rect width="${width}" height="${height}" fill="${bg}" />
    ${shapesSvg}
  `;
}

/** 2. Riso-Print Motif */
export function generateRisoPrint({ width, height, palette, prng }) {
  const bg = palette[3] || '#F7F0D8';
  const c1 = palette[1] || '#5A7A66';
  const c2 = palette[2] || '#C97A7E';

  const circleCount = prng.rangeInt(12, 18);
  let circles = '';

  for (let i = 0; i < circleCount; i++) {
    const cx = prng.rangeInt(0, width);
    const cy = prng.rangeInt(0, height);
    const r = prng.rangeInt(30, 100);
    const color = prng.pick([c1, c2]);
    const dx = prng.rangeInt(-6, 6);
    const dy = prng.rangeInt(-6, 6);

    circles += `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" opacity="0.3" style="mix-blend-mode: multiply;" />
      <circle cx="${cx + dx}" cy="${cy + dy}" r="${r * 0.88}" fill="${color}" opacity="0.2" style="mix-blend-mode: multiply;" />
    `;
  }

  return `
    <rect width="${width}" height="${height}" fill="${bg}" />
    <g>
      ${circles}
    </g>
  `;
}

/** 3. Gingham-Knit Motif */
export function generateGinghamKnit({ width, height, palette, prng }) {
  const bg = palette[3] || '#FAF0EB';
  const color1 = palette[1] || '#C97A8B';
  const color2 = palette[2] || '#D4A359';
  const gridSize = prng.rangeInt(28, 44);

  let gridSvg = '';
  for (let x = 0; x < width; x += gridSize) {
    gridSvg += `<rect x="${x}" y="0" width="${gridSize / 2}" height="${height}" fill="${color1}" opacity="0.1" />`;
  }
  for (let y = 0; y < height; y += gridSize) {
    gridSvg += `<rect x="0" y="${y}" width="${width}" height="${gridSize / 2}" fill="${color2}" opacity="0.1" />`;
  }

  for (let x = 0; x < width; x += gridSize) {
    for (let y = 0; y < height; y += gridSize) {
      gridSvg += `<rect x="${x}" y="${y}" width="${gridSize / 2}" height="${gridSize / 2}" fill="${color1}" opacity="0.18" />`;
    }
  }

  return `
    <rect width="${width}" height="${height}" fill="${bg}" />
    ${gridSvg}
  `;
}

/** 4. Tea-Stain / Watercolour Wash Motif */
export function generateTeaStain({ width, height, palette, prng }) {
  const bg = palette[3] || '#F4EBE1';
  const stainColor = palette[1] || '#8C6239';
  const accentColor = palette[2] || '#5A7B6A';

  const blotCount = prng.rangeInt(4, 7);
  let blots = '';

  for (let i = 0; i < blotCount; i++) {
    const cx = prng.rangeInt(0, width);
    const cy = prng.rangeInt(0, height);
    const rx = prng.rangeInt(90, 210);
    const ry = prng.rangeInt(60, 150);
    const rotation = prng.rangeInt(0, 360);

    blots += `
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${stainColor}" opacity="0.15" transform="rotate(${rotation} ${cx} ${cy})" style="filter: blur(12px);" />
      <ellipse cx="${cx + 10}" cy="${cy - 5}" rx="${rx * 0.6}" ry="${ry * 0.6}" fill="${accentColor}" opacity="0.12" transform="rotate(${rotation} ${cx} ${cy})" style="filter: blur(8px);" />
    `;
  }

  return `
    <rect width="${width}" height="${height}" fill="${bg}" />
    ${blots}
  `;
}

/** 5. Window-Light Motif */
export function generateWindowLight({ width, height, palette, prng }) {
  const bg = palette[3] || '#F5EFE6';
  const lightColor = '#FFFFFF';
  const accent = palette[1] || '#4A7A82';

  const panex = prng.rangeInt(width * 0.2, width * 0.6);
  const paney = prng.rangeInt(0, height * 0.2);

  return `
    <rect width="${width}" height="${height}" fill="${bg}" />
    <polygon points="${panex},${paney} ${panex + 240},${paney + 20} ${panex + 340},${height} ${panex - 120},${height}" fill="${lightColor}" opacity="0.4" />
    <polygon points="${panex + 50},${paney} ${panex + 180},${paney + 10} ${panex + 260},${height} ${panex + 50},${height}" fill="${accent}" opacity="0.1" />
    <line x1="${panex + 110}" y1="${paney}" x2="${panex + 110}" y2="${height}" stroke="${bg}" stroke-width="4" opacity="0.5" />
    <line x1="${panex - 40}" y1="${paney + 100}" x2="${panex + 280}" y2="${paney + 100}" stroke="${bg}" stroke-width="4" opacity="0.5" />
  `;
}

/** 6. Ticket-Stub Collage Motif */
export function generateTicketStub({ width, height, palette, prng }) {
  const bg = palette[3] || '#F6F4EE';
  const c1 = palette[1] || '#98738E';
  const c2 = palette[2] || '#B05C49';

  const stubCount = prng.rangeInt(2, 4);
  let stubs = '';

  for (let i = 0; i < stubCount; i++) {
    const w = prng.rangeInt(180, 260);
    const h = prng.rangeInt(90, 130);
    const x = prng.rangeInt(-10, width - w + 10);
    const y = prng.rangeInt(-10, height - h + 10);
    const rot = prng.rangeInt(-12, 12);
    const fillClr = i % 2 === 0 ? c1 : c2;

    stubs += `
      <g transform="rotate(${rot} ${x + w/2} ${y + h/2})">
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" fill="${fillClr}" opacity="0.25" stroke="${fillClr}" stroke-width="1" />
        <circle cx="${x}" cy="${y + h/2}" r="10" fill="${bg}" />
        <circle cx="${x + w}" cy="${y + h/2}" r="10" fill="${bg}" />
        <line x1="${x + 40}" y1="${y + 10}" x2="${x + 40}" y2="${y + h - 10}" stroke="${fillClr}" stroke-dasharray="3 3" stroke-width="1.5" opacity="0.6" />
        <text x="${x + 52}" y="${y + 35}" fill="${palette[0] || '#3B2338'}" font-family="Fraunces, serif" font-size="12" font-weight="bold">COSYMAGAZINE</text>
        <text x="${x + 52}" y="${y + 55}" fill="${palette[0] || '#3B2338'}" font-family="DM Sans, sans-serif" font-size="10" opacity="0.75">ADMIT ONE • PASS</text>
      </g>
    `;
  }

  return `
    <rect width="${width}" height="${height}" fill="${bg}" />
    ${stubs}
  `;
}

/** 7. Doodle-Border Motif */
export function generateDoodleBorder({ width, height, palette, prng }) {
  const bg = palette[3] || '#EFF3ED';
  const strokeColor = palette[1] || '#52796F';
  const accentColor = palette[2] || '#A0522D';

  const margin = prng.rangeInt(12, 22);
  let pathD = `M ${margin} ${margin} `;

  for (let x = margin; x <= width - margin; x += 30) {
    const dy = margin + prng.rangeInt(-4, 4);
    pathD += `L ${x} ${dy} `;
  }
  for (let y = margin; y <= height - margin; y += 30) {
    const dx = width - margin + prng.rangeInt(-4, 4);
    pathD += `L ${dx} ${y} `;
  }
  for (let x = width - margin; x >= margin; x -= 30) {
    const dy = height - margin + prng.rangeInt(-4, 4);
    pathD += `L ${x} ${dy} `;
  }
  for (let y = height - margin; y >= margin; y -= 30) {
    const dx = margin + prng.rangeInt(-4, 4);
    pathD += `L ${dx} ${y} `;
  }
  pathD += 'Z';

  return `
    <rect width="${width}" height="${height}" fill="${bg}" />
    <path d="${pathD}" fill="none" stroke="${strokeColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.6" />
    <circle cx="${width - margin * 2.5}" cy="${margin * 2.5}" r="16" fill="${accentColor}" opacity="0.2" />
    <circle cx="${margin * 2.5}" cy="${height - margin * 2.5}" r="20" fill="${strokeColor}" opacity="0.15" />
  `;
}

/** 8. Vintage-Stamp Motif */
export function generateVintageStamp({ width, height, palette, prng }) {
  const bg = palette[3] || '#F9EBEA';
  const stampColor = palette[0] || '#3E2723';
  const stampBg = palette[1] || '#C06C84';

  const cx = width / 2;
  const cy = height / 2;
  const stampW = Math.min(width * 0.65, 300);
  const stampH = Math.min(height * 0.65, 220);

  let teeth = '';
  for (let x = cx - stampW/2; x <= cx + stampW/2; x += 14) {
    teeth += `<circle cx="${x}" cy="${cy - stampH/2}" r="4" fill="${bg}" />`;
    teeth += `<circle cx="${x}" cy="${cy + stampH/2}" r="4" fill="${bg}" />`;
  }
  for (let y = cy - stampH/2; y <= cy + stampH/2; y += 14) {
    teeth += `<circle cx="${cx - stampW/2}" cy="${y}" r="4" fill="${bg}" />`;
    teeth += `<circle cx="${cx + stampW/2}" cy="${y}" r="4" fill="${bg}" />`;
  }

  return `
    <rect width="${width}" height="${height}" fill="${bg}" />
    <rect x="${cx - stampW/2}" y="${cy - stampH/2}" width="${stampW}" height="${stampH}" fill="${stampBg}" opacity="0.3" />
    <rect x="${cx - stampW/2 + 8}" y="${cy - stampH/2 + 8}" width="${stampW - 16}" height="${stampH - 16}" fill="none" stroke="${stampColor}" stroke-width="1.5" opacity="0.4" />
    <text x="${cx}" y="${cy + 6}" fill="${stampColor}" font-family="Fraunces, serif" font-size="24" text-anchor="middle" font-weight="bold" opacity="0.6">COSY</text>
    ${teeth}
  `;
}

/** 9. Tea-Ring Wash Motif */
export function generateTeaRingWash({ width, height, palette, prng }) {
  const bg = palette[3] || '#FAF6EE';
  const teaColor = palette[1] || '#C86D51';
  const accentColor = palette[2] || '#6B8E7B';

  const ringCount = prng.rangeInt(3, 5);
  let rings = '';

  for (let i = 0; i < ringCount; i++) {
    const cx = prng.rangeInt(0, width);
    const cy = prng.rangeInt(0, height);
    const r = prng.rangeInt(40, 110);
    const strokeW = prng.rangeFloat(3, 7);
    const color = prng.pick([teaColor, accentColor]);

    rings += `
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${strokeW}" opacity="0.2" style="filter: blur(1px);" />
      <circle cx="${cx + prng.rangeInt(-3, 3)}" cy="${cy + prng.rangeInt(-3, 3)}" r="${r * prng.rangeFloat(0.93, 0.98)}" fill="none" stroke="${color}" stroke-width="${strokeW * 0.5}" opacity="0.15" />
    `;

    const dropCount = prng.rangeInt(2, 4);
    for (let d = 0; d < dropCount; d++) {
      const angle = prng.rangeFloat(0, Math.PI * 2);
      const dist = r + prng.rangeFloat(5, 20);
      const dx = cx + Math.cos(angle) * dist;
      const dy = cy + Math.sin(angle) * dist;
      const dr = prng.rangeFloat(2, 5);
      rings += `<circle cx="${dx}" cy="${dy}" r="${dr}" fill="${color}" opacity="0.18" />`;
    }
  }

  return `
    <rect width="${width}" height="${height}" fill="${bg}" />
    ${rings}
  `;
}

/** 10. Pressed-Flower Botanical Motif */
export function generatePressedFlower({ width, height, palette, prng }) {
  const bg = palette[3] || '#FAF6EE';
  const stemColor = palette[2] || '#6B8E7B';
  const petalColor = palette[1] || '#C86D51';
  const centerColor = '#D4A359';

  const flowerCount = prng.rangeInt(4, 6);
  let flowers = '';

  for (let i = 0; i < flowerCount; i++) {
    const cx = prng.rangeInt(40, width - 40);
    const cy = prng.rangeInt(40, height - 40);
    const petalCount = prng.rangeInt(5, 7);
    const petalR = prng.rangeInt(18, 36);

    let petals = '';
    for (let p = 0; p < petalCount; p++) {
      const angle = (p / petalCount) * Math.PI * 2;
      const px = cx + Math.cos(angle) * petalR * 0.85;
      const py = cy + Math.sin(angle) * petalR * 0.85;
      petals += `<ellipse cx="${px}" cy="${py}" rx="${petalR * 0.5}" ry="${petalR * 0.3}" fill="${petalColor}" opacity="0.3" transform="rotate(${(angle * 180 / Math.PI)} ${px} ${py})" />`;
    }

    const stemD = `M ${cx} ${cy} Q ${cx + prng.rangeInt(-25, 25)} ${cy + prng.rangeInt(35, 70)} ${cx + prng.rangeInt(-15, 15)} ${cy + prng.rangeInt(70, 120)}`;

    flowers += `
      <path d="${stemD}" fill="none" stroke="${stemColor}" stroke-width="1.8" opacity="0.35" />
      ${petals}
      <circle cx="${cx}" cy="${cy}" r="${petalR * 0.28}" fill="${centerColor}" opacity="0.6" />
    `;
  }

  return `
    <rect width="${width}" height="${height}" fill="${bg}" />
    ${flowers}
  `;
}

/** 11. Postcard-Stamp Airmail Motif */
export function generatePostcardStamp({ width, height, palette, prng }) {
  const bg = palette[3] || '#F5EFE6';
  const blue = palette[1] || '#4A7A82';
  const red = palette[2] || '#B85C38';

  const stripeWidth = 24;
  let stripes = '';
  for (let x = -stripeWidth; x < width + height; x += stripeWidth * 2) {
    stripes += `<polygon points="${x},0 ${x + stripeWidth},0 ${x + stripeWidth - height},${height} ${x - height},${height}" fill="${blue}" opacity="0.1" />`;
    stripes += `<polygon points="${x + stripeWidth},0 ${x + stripeWidth * 2},0 ${x + stripeWidth * 2 - height},${height} ${x + stripeWidth - height},${height}" fill="${red}" opacity="0.1" />`;
  }

  const pmX = prng.rangeInt(width * 0.5, width * 0.85);
  const pmY = prng.rangeInt(height * 0.2, height * 0.7);
  const pmR = 40;

  let postmarkLines = '';
  for (let l = -16; l <= 16; l += 8) {
    postmarkLines += `<line x1="${pmX + 22}" y1="${pmY + l}" x2="${pmX + 90}" y2="${pmY + l}" stroke="${blue}" stroke-width="1.5" opacity="0.3" />`;
  }

  return `
    <rect width="${width}" height="${height}" fill="${bg}" />
    <g class="airmail-stripes">${stripes}</g>
    <circle cx="${pmX}" cy="${pmY}" r="${pmR}" fill="none" stroke="${blue}" stroke-width="2" stroke-dasharray="5 3" opacity="0.35" />
    <circle cx="${pmX}" cy="${pmY}" r="${pmR * 0.8}" fill="none" stroke="${blue}" stroke-width="1" opacity="0.25" />
    <text x="${pmX}" y="${pmY - 4}" fill="${palette[0] || '#2B3542'}" font-family="DM Sans, sans-serif" font-size="9" font-weight="bold" text-anchor="middle" opacity="0.5">COSY POST</text>
    <text x="${pmX}" y="${pmY + 10}" fill="${palette[0] || '#2B3542'}" font-family="DM Sans, sans-serif" font-size="8" text-anchor="middle" opacity="0.4">AIR MAIL</text>
    ${postmarkLines}
  `;
}

/** 12. Terrazzo-Tile Motif */
export function generateTerrazzoTile({ width, height, palette, prng }) {
  const bg = palette[3] || '#FAF6EE';
  const c1 = palette[0] || '#3A2E2B';
  const c2 = palette[1] || '#C86D51';
  const c3 = palette[2] || '#6B8E7B';

  const chipCount = prng.rangeInt(25, 45);
  let chips = '';

  for (let i = 0; i < chipCount; i++) {
    const cx = prng.rangeInt(0, width);
    const cy = prng.rangeInt(0, height);
    const color = prng.pick([c1, c2, c3, '#D4A359', '#C97A7E']);
    const r = prng.rangeInt(6, 18);

    let pts = [];
    const sides = prng.rangeInt(4, 6);
    for (let s = 0; s < sides; s++) {
      const angle = (s / sides) * Math.PI * 2 + prng.rangeFloat(-0.3, 0.3);
      const dist = r * prng.rangeFloat(0.5, 1.2);
      pts.push(`${Math.round(cx + Math.cos(angle) * dist)},${Math.round(cy + Math.sin(angle) * dist)}`);
    }

    chips += `<polygon points="${pts.join(' ')}" fill="${color}" opacity="${prng.rangeFloat(0.2, 0.45)}" />`;
  }

  return `
    <rect width="${width}" height="${height}" fill="${bg}" />
    ${chips}
  `;
}

/** 13. Pressed-Leaf Botanical Motif */
export function generatePressedLeaf({ width, height, palette, prng }) {
  const bg = palette[3] || '#EFF3ED';
  const leafColor = palette[1] || '#52796F';
  const veinColor = palette[2] || '#A0522D';

  const leafCount = prng.rangeInt(3, 5);
  let leaves = '';

  for (let i = 0; i < leafCount; i++) {
    const cx = prng.rangeInt(50, width - 50);
    const cy = prng.rangeInt(50, height - 50);
    const len = prng.rangeInt(80, 150);
    const rot = prng.rangeInt(-60, 60);

    leaves += `
      <g transform="rotate(${rot} ${cx} ${cy})">
        <path d="M ${cx - len/2} ${cy} Q ${cx} ${cy - 40} ${cx + len/2} ${cy} Z" fill="${leafColor}" opacity="0.22" />
        <line x1="${cx - len/2 - 8}" y1="${cy}" x2="${cx + len/2}" y2="${cy}" stroke="${veinColor}" stroke-width="1.5" opacity="0.3" />
        <line x1="${cx - 18}" y1="${cy}" x2="${cx - 4}" y2="${cy - 15}" stroke="${veinColor}" stroke-width="1" opacity="0.25" />
        <line x1="${cx - 18}" y1="${cy}" x2="${cx - 4}" y2="${cy + 15}" stroke="${veinColor}" stroke-width="1" opacity="0.25" />
        <line x1="${cx + 8}" y1="${cy}" x2="${cx + 22}" y2="${cy - 15}" stroke="${veinColor}" stroke-width="1" opacity="0.25" />
        <line x1="${cx + 8}" y1="${cy}" x2="${cx + 22}" y2="${cy + 15}" stroke="${veinColor}" stroke-width="1" opacity="0.25" />
      </g>
    `;
  }

  return `
    <rect width="${width}" height="${height}" fill="${bg}" />
    ${leaves}
  `;
}

/** 14. Notebook-Handwritten Motif */
export function generateNotebookHandwritten({ width, height, palette, prng }) {
  const bg = palette[3] || '#FAF6EE';
  const ink = palette[0] || '#1E3A8A';
  const lineClr = palette[1] || '#0D9488';
  const marginClr = palette[2] || '#E11D48';

  // Lined paper horizontal rules
  let lines = '';
  const lineSpacing = 28;
  for (let y = 35; y < height; y += lineSpacing) {
    lines += `<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="${lineClr}" stroke-width="1" opacity="0.22" />`;
  }

  // Vertical margin line
  const marginX = Math.round(width * 0.14);
  const marginLine = `<line x1="${marginX}" y1="0" x2="${marginX}" y2="${height}" stroke="${marginClr}" stroke-width="2" opacity="0.35" />`;

  // Random doodle curves & hand-drawn loops
  const doodleCount = prng.rangeInt(3, 6);
  let doodles = '';
  for (let i = 0; i < doodleCount; i++) {
    const cx = prng.rangeInt(marginX + 40, width - 40);
    const cy = prng.rangeInt(40, height - 40);
    const r = prng.rangeInt(15, 35);
    doodles += `<path d="M ${cx - r} ${cy} Q ${cx} ${cy - r} ${cx + r} ${cy} T ${cx + r * 2} ${cy}" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round" opacity="0.25" />`;
  }

  return `
    <rect width="${width}" height="${height}" fill="${bg}" />
    ${lines}
    ${marginLine}
    ${doodles}
  `;
}
