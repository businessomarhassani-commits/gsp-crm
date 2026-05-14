/**
 * generate-icon.js
 * Converts the ArchiCRM SVG logo into icon.png and icon.ico
 * Requires: sharp (installed as dep)
 */
const path = require('path')
const fs = require('fs')

const ASSETS = path.join(__dirname, '..', 'assets')

// ArchiCRM triangle logo — rendered on dark background at full 512px
const SVG_512 = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0A0A0A"/>
  <!-- Glow circle -->
  <circle cx="256" cy="256" r="200" fill="rgba(232,168,56,0.04)"/>
  <!-- Back triangle (shadow layer) -->
  <polygon
    points="256,80 460,420 52,420"
    fill="#E8A838"
    opacity="0.30"
  />
  <!-- Front triangle -->
  <polygon
    points="256,108 448,440 64,440"
    fill="#E8A838"
  />
</svg>`

async function main() {
  let sharp
  try {
    sharp = require('sharp')
  } catch (e) {
    console.error('sharp not found — run: npm install')
    process.exit(1)
  }

  // ── 1. Generate icon.png (512×512) ─────────────────────────────────────────
  const pngPath = path.join(ASSETS, 'icon.png')
  await sharp(Buffer.from(SVG_512))
    .resize(512, 512)
    .png()
    .toFile(pngPath)
  console.log('✓  assets/icon.png  (512×512)')

  // ── 2. Generate multi-size buffers for ICO ─────────────────────────────────
  const sizes = [16, 24, 32, 48, 64, 128, 256]
  const pngBuffers = await Promise.all(
    sizes.map(s =>
      sharp(Buffer.from(SVG_512)).resize(s, s).png().toBuffer()
    )
  )

  // ── 3. Write ICO file manually (PNG-inside-ICO format) ────────────────────
  // ICO header: ICONDIR
  //   idReserved (2) + idType=1 (2) + idCount (2)
  // Each ICONDIRENTRY (16 bytes):
  //   bWidth(1) bHeight(1) bColorCount(1) bReserved(1)
  //   wPlanes(2) wBitCount(2) dwBytesInRes(4) dwImageOffset(4)
  const count = sizes.length
  const headerSize = 6
  const entrySize = 16
  const dataOffset = headerSize + entrySize * count

  let totalSize = dataOffset
  for (const buf of pngBuffers) totalSize += buf.length

  const ico = Buffer.alloc(totalSize)
  // ICONDIR header
  ico.writeUInt16LE(0, 0)      // reserved
  ico.writeUInt16LE(1, 2)      // type = 1 (ICO)
  ico.writeUInt16LE(count, 4)  // image count

  let offset = dataOffset
  for (let i = 0; i < count; i++) {
    const size = sizes[i]
    const buf = pngBuffers[i]
    const entry = headerSize + i * entrySize
    ico.writeUInt8(size >= 256 ? 0 : size, entry)      // width (0=256)
    ico.writeUInt8(size >= 256 ? 0 : size, entry + 1)  // height
    ico.writeUInt8(0, entry + 2)    // color count (0 = >256 colors)
    ico.writeUInt8(0, entry + 3)    // reserved
    ico.writeUInt16LE(1, entry + 4) // planes
    ico.writeUInt16LE(32, entry + 6)// bit count
    ico.writeUInt32LE(buf.length, entry + 8)  // bytes in resource
    ico.writeUInt32LE(offset, entry + 12)     // image offset

    buf.copy(ico, offset)
    offset += buf.length
  }

  const icoPath = path.join(ASSETS, 'icon.ico')
  fs.writeFileSync(icoPath, ico)
  console.log('✓  assets/icon.ico  (' + sizes.join(', ') + 'px)')
  console.log('\nIcon generation complete.')
}

main().catch(err => {
  console.error('Icon generation failed:', err.message)
  process.exit(1)
})
