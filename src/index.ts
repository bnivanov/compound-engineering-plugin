#!/usr/bin/env bun
import { defineCommand, runMain } from "citty"
import packageJson from "../package.json"
import listCommand from "./commands/list"
import pluginPath from "./commands/plugin-path"

const main = defineCommand({
  meta: {
    name: "compound-plugin",
    version: packageJson.version,
    description: "Repository tooling for the Compound Engineering OMP plugin",
  },
  subCommands: {
    list: () => listCommand,
    "plugin-path": () => pluginPath,
  },
})

runMain(main)
