import { createHash } from "node:crypto"
import list from "./test-photo-hashes.json"

/**
 * Pipeline-V2 test photos are never uploaded or analysed (the tests are spent). The list holds only sha256 fingerprints of the
 * upper-case file stems (Pipeline-V2 webapp/serving/make_test_blocklist.py), so this repository does not name the test photos.
 */
const HASHES = new Set<string>(list.hashes)

export function isTestPhotoName(fileName: string): boolean {
  const base = fileName.split(/[\\/]/).pop() ?? fileName
  const stem = base.replace(/\.[^.]+$/, "").toUpperCase()
  return HASHES.has(createHash("sha256").update(stem).digest("hex"))
}
