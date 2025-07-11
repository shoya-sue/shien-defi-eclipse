const fs = require('fs');
const path = require('path');

// SVGからPNGを生成するためのシンプルなアイコン作成スクリプト
// 実際のプロダクションでは、デザインツールで作成したアイコンを使用してください

const iconSvg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1e40af;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#3b82f6;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="64" fill="url(#grad1)"/>
  <circle cx="256" cy="200" r="80" fill="#ffffff" opacity="0.9"/>
  <rect x="176" y="280" width="160" height="40" rx="20" fill="#ffffff" opacity="0.9"/>
  <rect x="196" y="340" width="120" height="30" rx="15" fill="#ffffff" opacity="0.7"/>
  <text x="256" y="440" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="32" font-weight="bold">Eclipse</text>
  <text x="256" y="470" text-anchor="middle" fill="#ffffff" font-family="Arial, sans-serif" font-size="16" opacity="0.8">DeFi Tools</text>
</svg>`;

// アイコンディレクトリの作成
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// SVGファイルの保存
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), iconSvg);

console.log('✅ アイコンSVGファイルを生成しました');
console.log('📝 注意: 実際のPNGアイコンは、以下の手順で作成してください：');
console.log('1. public/icons/icon.svg を画像編集ソフトで開く');
console.log('2. 192x192 と 512x512 のPNGとして書き出す');
console.log('3. icon-192x192.png と icon-512x512.png として保存');
console.log('');
console.log('または、オンラインのSVG to PNG変換ツールを使用してください。');