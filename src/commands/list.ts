import path from "path"
import { promises as fs } from "fs"
import { defineCommand } from "citty"

export default defineCommand({
  meta: {
    name: "list",
    description: "List available plugins in this repository",
  },
  async run() {
    const root = process.cwd()
    const plugins: string[] = []

    const rootManifestPath = path.join(root, "plugin.json")
    if (await pathExists(rootManifestPath)) {
      const manifest = JSON.parse(await fs.readFile(rootManifestPath, "utf8")) as { name?: string }
      plugins.push(manifest.name ?? path.basename(root))
    }

    if (plugins.length === 0) {
      console.log("No plugins found.")
      return
    }

    const uniquePlugins = [...new Set(plugins)]
    console.log(uniquePlugins.sort().join("\n"))
  },
})

async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.stat(filePath)
    return true
  } catch {
    return false
  }
}
