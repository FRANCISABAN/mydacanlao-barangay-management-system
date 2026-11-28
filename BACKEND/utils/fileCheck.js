import fs from 'node:fs'

// The browser-declared MIME type can be faked, so check the real file signature too.
const SIGNATURES = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'application/pdf': [0x25, 0x50, 0x44, 0x46],
}

export async function hasValidSignature(file) {
  const sig = SIGNATURES[file.mimetype]
  if (!sig) return false
  const fh = await fs.promises.open(file.path, 'r')
  try {
    const buf = Buffer.alloc(sig.length)
    await fh.read(buf, 0, sig.length, 0)
    return sig.every((b, i) => buf[i] === b)
  } finally {
    await fh.close()
  }
}

export const removeFiles = (files = []) => Promise.all(files.map((f) => fs.promises.unlink(f.path).catch(() => {})))
