import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { join } from 'path';

// 간단한 SVG 아이콘 생성 (링크 수집기를 나타내는 심볼)
const svgIcon = `
<svg width="128" height="128" xmlns="http://www.w3.org/2000/svg">
  <!-- 배경 -->
  <rect width="128" height="128" rx="20" fill="#4285F4"/>
  
  <!-- 링크 체인 아이콘 -->
  <g transform="translate(32, 32)">
    <!-- 첫 번째 링크 -->
    <circle cx="20" cy="32" r="12" fill="none" stroke="white" stroke-width="4"/>
    <path d="M 32 32 L 48 16" stroke="white" stroke-width="4" stroke-linecap="round"/>
    
    <!-- 두 번째 링크 -->
    <circle cx="48" cy="16" r="12" fill="none" stroke="white" stroke-width="4"/>
    <path d="M 60 16 L 64 12" stroke="white" stroke-width="4" stroke-linecap="round"/>
    
    <!-- 화살표 -->
    <path d="M 56 8 L 64 12 L 56 16" fill="white"/>
  </g>
  
  <!-- 텍스트 "Link" -->
  <text x="64" y="100" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" text-anchor="middle">Link</text>
</svg>
`;

const sizes = [16, 48, 128];
const outputDir = join(process.cwd(), 'icons');

async function generateIcons() {
  for (const size of sizes) {
    const buffer = await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toBuffer();
    
    const filename = join(outputDir, `icon${size}.png`);
    writeFileSync(filename, buffer);
    console.log(`✓ Generated ${filename} (${size}x${size})`);
  }
  
  console.log('\n✅ All icons generated successfully!');
}

generateIcons().catch(console.error);
