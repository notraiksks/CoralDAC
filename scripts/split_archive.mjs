// Splits lib/data/demo-archive.json (4.9 MB, mostly SAM outlines) into
//   lib/data/demo-index.json        what every page needs (boxes, classes, probabilities; no outlines)   -> bundled
//   public/demo/masks/<id>.json     the outlines of one photo, { "D01": [[x, y], ...], ... }             -> fetched on its page
// Run after the archive changes:  node scripts/split_archive.mjs
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const root = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")
const src = JSON.parse(readFileSync(join(root, "lib/data/demo-archive.json"), "utf8"))
const maskDir = join(root, "public/demo/masks")
mkdirSync(maskDir, { recursive: true })

let maskBytes = 0
const images = src.images.map(({ relpath: _r, month: _m, status: _s, detections, ...img }) => {
  const masks = {}
  const dets = detections.map(({ mask, ...d }) => {
    if (Array.isArray(mask) && mask.length > 2) masks[d.id] = mask
    return d
  })
  const body = JSON.stringify(masks)
  maskBytes += body.length
  writeFileSync(join(maskDir, `${img.id}.json`), body)
  return { ...img, detections: dets }
})
const index = { ...src, images }
writeFileSync(join(root, "lib/data/demo-index.json"), JSON.stringify(index))
console.log(`index ${JSON.stringify(index).length} bytes, ${images.length} mask files ${maskBytes} bytes`)
