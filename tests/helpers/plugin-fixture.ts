import { cpSync, mkdtempSync, rmSync } from "fs"
import os from "os"
import path from "path"

export interface MaterializedPluginFixture {
  root: string
  cleanup: () => void
}

export function materializePluginFixture(sourceRoot: string): MaterializedPluginFixture {
  const root = mkdtempSync(path.join(os.tmpdir(), "plugin-fixture-"))
  try {
    cpSync(sourceRoot, root, { recursive: true })
  } catch (error) {
    rmSync(root, { recursive: true, force: true })
    throw error
  }

  return {
    root,
    cleanup: () => rmSync(root, { recursive: true, force: true }),
  }
}
