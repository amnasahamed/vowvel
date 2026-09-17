import fs from 'node:fs/promises';
import sharp from 'sharp';

// 1. High-resolution vector master for Vowvel Monogram "V"
// Concept: "The Fold" — sculptural luxury serif V with folded-paper incision on warm porcelain ivory
const masterSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bgLight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FAF7F0" />
      <stop offset="100%" stop-color="#F2EDE2" />
    </linearGradient>
    <filter id="subtleShade" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#1A1218" flood-opacity="0.08" />
    </filter>
  </defs>
  <!-- Background rounded squircle for SERP and App Icon -->
  <rect width="512" height="512" rx="112" fill="url(#bgLight)" />
  <rect width="510" height="510" x="1" y="1" rx="111" fill="none" stroke="#E6DEC9" stroke-width="2" opacity="0.6" />
  
  <!-- Sculptural Vowvel "V" with folded-paper terminal -->
  <g transform="translate(256, 266)" filter="url(#subtleShade)">
    <!-- Left Bold Stem -->
    <path d="M -132 -135 
             L -62 -135 
             C -75 -105, -78 -75, -55 0 
             L -22 108 
             C -14 135, -4 145, 12 145 
             L 2 145 
             L -46 145 
             L -56 108 
             L -125 -105 
             C -142 -125, -150 -132, -165 -135 
             Z" 
          fill="#24141E" />
          
    <!-- Main Angular Body & Sharp Vertex -->
    <path d="M -122 -130 
             L -56 -130 
             C -64 -100, -56 -60, -32 20 
             L -2 120 
             L 18 120 
             L 86 -85 
             C 98 -118, 102 -125, 120 -130 
             L 78 -130 
             L 10 -130 
             L 25 -100 
             C 32 -85, 34 -75, 24 -40 
             L -2 45 
             L -42 -85 
             C -50 -110, -54 -122, -62 -130 
             Z" 
          fill="#24141E" />
          
    <!-- Folded Terminal on Right Wing (The Fold) -->
    <path d="M 68 -75 
             L 115 -130 
             L 142 -130 
             C 134 -115, 126 -95, 114 -60 
             L 84 35 
             L 64 35 
             Z" 
          fill="#24141E" />
          
    <!-- Fold Accenting Slice / Incision -->
    <polygon points="112,-132 144,-132 128,-106" fill="#C5A880" />
    <polygon points="128,-106 144,-132 140,-95" fill="#8C6F4B" opacity="0.6" />
  </g>
</svg>`;

// 2. Responsive Vector Favicon (changes with Dark/Light mode in browser tab)
const responsiveSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <style>
    :root {
      --bg: #FAF7F0;
      --border: #E6DEC9;
      --ink: #24141E;
      --gold: #C5A880;
      --gold-dark: #8C6F4B;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #1C181B;
        --border: #3A3237;
        --ink: #F7F3EB;
        --gold: #D6BC96;
        --gold-dark: #B89B72;
      }
    }
    .bg { fill: var(--bg); }
    .border { stroke: var(--border); }
    .ink { fill: var(--ink); }
    .gold { fill: var(--gold); }
    .gold-dark { fill: var(--gold-dark); }
  </style>
  <rect width="512" height="512" rx="112" class="bg" />
  <rect width="510" height="510" x="1" y="1" rx="111" fill="none" class="border" stroke-width="2" opacity="0.6" />
  <g transform="translate(256, 266)">
    <path d="M -132 -135 L -62 -135 C -75 -105, -78 -75, -55 0 L -22 108 C -14 135, -4 145, 12 145 L 2 145 L -46 145 L -56 108 L -125 -105 C -142 -125, -150 -132, -165 -135 Z" class="ink" />
    <path d="M -122 -130 L -56 -130 C -64 -100, -56 -60, -32 20 L -2 120 L 18 120 L 86 -85 C 98 -118, 102 -125, 120 -130 L 78 -130 L 10 -130 L 25 -100 C 32 -85, 34 -75, 24 -40 L -2 45 L -42 -85 C -50 -110, -54 -122, -62 -130 Z" class="ink" />
    <path d="M 68 -75 L 115 -130 L 142 -130 C 134 -115, 126 -95, 114 -60 L 84 35 L 64 35 Z" class="ink" />
    <polygon points="112,-132 144,-132 128,-106" class="gold" />
    <polygon points="128,-106 144,-132 140,-95" class="gold-dark" opacity="0.6" />
  </g>
</svg>`;

// 3. Monochrome Safari pinned tab SVG
const maskSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <path d="M 124 131 L 194 131 C 181 161, 178 191, 201 266 L 234 374 C 242 401, 252 411, 268 411 L 258 411 L 210 411 L 200 374 L 131 161 C 114 141, 106 134, 91 131 Z M 134 136 L 200 136 C 192 166, 200 206, 224 286 L 254 386 L 274 386 L 342 181 C 354 148, 358 141, 376 136 L 334 136 L 266 136 L 281 166 C 288 181, 290 191, 280 226 L 254 311 L 214 181 C 206 156, 202 144, 194 136 Z M 324 191 L 371 136 L 398 136 C 390 151, 382 171, 370 206 L 340 301 L 320 301 Z" fill="#000000" />
</svg>`;

console.log('Generating favicons, SERP icons, and app icons...');

const svgBuffer = Buffer.from(masterSvg);

// Write SVG files
await fs.writeFile('public/favicon.svg', responsiveSvg);
await fs.writeFile('public/safari-pinned-tab.svg', maskSvg);

// Generate raster icons using Sharp
const targets = [
  { file: 'public/favicon-16x16.png', size: 16 },
  { file: 'public/favicon-32x32.png', size: 32 },
  { file: 'public/favicon-48x48.png', size: 48 },   // Primary Google SERP favicon
  { file: 'public/favicon-96x96.png', size: 96 },   // High-res Google SERP favicon
  { file: 'public/apple-touch-icon.png', size: 180 },
  { file: 'public/apple-touch-icon-precomposed.png', size: 180 },
  { file: 'public/android-chrome-192x192.png', size: 192 },
  { file: 'public/android-chrome-512x512.png', size: 512 }
];

for (const t of targets) {
  await sharp(svgBuffer)
    .resize(t.size, t.size)
    .png({ quality: 95, compressionLevel: 9 })
    .toFile(t.file);
  console.log(`Generated: ${t.file} (${t.size}x${t.size})`);
}

// Generate favicon.ico (Standard multi-resolution or 48x48 PNG/ICO)
// Modern browsers accept a 48x48 PNG saved as favicon.ico or 32x32
const icoBuffer = await sharp(svgBuffer).resize(48, 48).png().toBuffer();
await fs.writeFile('public/favicon.ico', icoBuffer);
console.log('Generated: public/favicon.ico (48x48)');

// Generate site.webmanifest
const manifest = {
  name: 'Vowvel',
  short_name: 'Vowvel',
  description: 'Luxury wedding and engagement invitations worth opening.',
  start_url: '/',
  display: 'standalone',
  background_color: '#f8f6ef',
  theme_color: '#f8f6ef',
  icons: [
    {
      src: '/favicon-48x48.png',
      sizes: '48x48',
      type: 'image/png',
      purpose: 'any'
    },
    {
      src: '/android-chrome-192x192.png',
      sizes: '192x192',
      type: 'image/png',
      purpose: 'any maskable'
    },
    {
      src: '/android-chrome-512x512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'any maskable'
    }
  ]
};
await fs.writeFile('public/site.webmanifest', JSON.stringify(manifest, null, 2));
console.log('Generated: public/site.webmanifest');
