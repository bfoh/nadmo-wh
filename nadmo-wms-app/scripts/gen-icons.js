const fs = require('fs');
const svg = fs.readFileSync('public/icon.svg', 'utf8');

// Create sized SVG variants for PWA icons
// (SVGs work as PWA icons and are preferred over PNG for scalability)

// 192x192
const svg192 = svg.replace(
  'viewBox="0 0 512 512"',
  'viewBox="0 0 512 512" width="192" height="192"'
);
fs.writeFileSync('public/icon-192.svg', svg192);

// 512x512
const svg512 = svg.replace(
  'viewBox="0 0 512 512"',
  'viewBox="0 0 512 512" width="512" height="512"'
);
fs.writeFileSync('public/icon-512.svg', svg512);

// Maskable: expand viewBox to add safe-area padding (20% on each side)
const maskable = svg
  .replace(
    'viewBox="0 0 512 512"',
    'viewBox="-64 -64 640 640"'
  )
  .replace(
    '<rect width="512" height="512" rx="64" fill="#006B3F"/>',
    '<rect x="-64" y="-64" width="640" height="640" fill="#006B3F"/>'
  );

const m192 = maskable.replace(
  'viewBox="-64 -64 640 640"',
  'viewBox="-64 -64 640 640" width="192" height="192"'
);
fs.writeFileSync('public/icon-maskable-192.svg', m192);

const m512 = maskable.replace(
  'viewBox="-64 -64 640 640"',
  'viewBox="-64 -64 640 640" width="512" height="512"'
);
fs.writeFileSync('public/icon-maskable-512.svg', m512);

console.log('Created all PWA icon variants');
