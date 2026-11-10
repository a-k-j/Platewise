import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const publicDir = resolve(root, 'public')
mkdirSync(publicDir, { recursive: true })

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n += 1) {
    let c = n
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii')
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0)
  return Buffer.concat([length, typeBuffer, data, crc])
}

function encodePng(size, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  ihdr[10] = 0
  ihdr[11] = 0
  ihdr[12] = 0

  const stride = size * 4
  const raw = Buffer.alloc((stride + 1) * size)
  for (let y = 0; y < size; y += 1) {
    raw[y * (stride + 1)] = 0
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function insideRoundedSquare(x, y, size, radius) {
  const cx = Math.min(Math.max(x, radius), size - radius)
  const cy = Math.min(Math.max(y, radius), size - radius)
  return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2
}

function distanceToSegment(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1
  const dy = y2 - y1
  const lengthSquared = dx * dx + dy * dy
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lengthSquared))
  const cx = x1 + t * dx
  const cy = y1 + t * dy
  return Math.hypot(px - cx, py - cy)
}

const TEAL = [15, 118, 110]
const WHITE = [255, 255, 255]
const SOFT_TEAL = [204, 251, 241]

function makeIcon(size, { maskable = false } = {}) {
  const scale = 4
  const big = size * scale
  const radius = maskable ? 0 : big * 0.22
  const center = big / 2
  const plateRadius = big * (maskable ? 0.3 : 0.335)
  const ringRadius = big * (maskable ? 0.22 : 0.245)
  const ringWidth = big * 0.012
  const checkWidth = big * (maskable ? 0.05 : 0.055)
  const p1 = [big * 0.382, big * 0.512]
  const p2 = [big * 0.462, big * 0.598]
  const p3 = [big * 0.636, big * 0.414]
  const checkHalf = checkWidth / 2

  function sample(x, y) {
    if (!insideRoundedSquare(x, y, big, radius)) return [0, 0, 0, 0]

    const distance = Math.hypot(x - center, y - center)
    if (distance <= plateRadius) {
      if (Math.abs(distance - ringRadius) <= ringWidth) return [...SOFT_TEAL, 255]
      const onCheck =
        distanceToSegment(x, y, p1[0], p1[1], p2[0], p2[1]) <= checkHalf ||
        distanceToSegment(x, y, p2[0], p2[1], p3[0], p3[1]) <= checkHalf
      if (onCheck) return [...TEAL, 255]
      return [...WHITE, 255]
    }

    return [...TEAL, 255]
  }

  const data = Buffer.alloc(size * size * 4)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      let r = 0
      let g = 0
      let b = 0
      let a = 0
      for (let sy = 0; sy < scale; sy += 1) {
        for (let sx = 0; sx < scale; sx += 1) {
          const [cr, cg, cb, ca] = sample(x * scale + sx + 0.5, y * scale + sy + 0.5)
          const alpha = ca / 255
          r += cr * alpha
          g += cg * alpha
          b += cb * alpha
          a += alpha
        }
      }
      const count = scale * scale
      const offset = (y * size + x) * 4
      if (a === 0) {
        data[offset] = 0
        data[offset + 1] = 0
        data[offset + 2] = 0
        data[offset + 3] = 0
      } else {
        data[offset] = Math.round(r / a)
        data[offset + 1] = Math.round(g / a)
        data[offset + 2] = Math.round(b / a)
        data[offset + 3] = Math.round((a / count) * 255)
      }
    }
  }

  return encodePng(size, data)
}

const icons = [
  ['pwa-192x192.png', 192, {}],
  ['pwa-512x512.png', 512, {}],
  ['maskable-512x512.png', 512, { maskable: true }],
  ['apple-touch-icon.png', 180, { maskable: true }],
]

for (const [name, size, options] of icons) {
  writeFileSync(resolve(publicDir, name), makeIcon(size, options))
  console.log(`Generated public/${name}`)
}

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Platewise">
  <rect width="64" height="64" rx="14" fill="#0f766e"/>
  <circle cx="32" cy="32" r="21.5" fill="#ffffff"/>
  <circle cx="32" cy="32" r="15.7" fill="none" stroke="#ccfbf1" stroke-width="1.6"/>
  <path d="M24 32.5l5.1 5.1L40.1 26" fill="none" stroke="#0f766e" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`
writeFileSync(resolve(publicDir, 'favicon.svg'), favicon)
console.log('Generated public/favicon.svg')
