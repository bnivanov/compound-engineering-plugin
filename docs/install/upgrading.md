# Upgrading an existing install

Instructions for refreshing Compound Engineering in oh-my-pi (omp), plus moving off an upstream marketplace install.

For a first-time install, see the [README](../../README.md#install).

---

## Refresh the catalog, then upgrade the plugin

`omp plugin upgrade` compares against the **cached** catalog, so refresh it first — order matters:

```text
omp plugin marketplace update compound-engineering-omp
omp plugin upgrade compound-engineering@compound-engineering-omp
```

With `omp config set marketplace.autoUpdate auto`, both happen at startup. In the default `notify` mode, availability is written only to the debug log.

## Moving from the upstream marketplace

If you installed upstream's `compound-engineering@compound-engineering-plugin`, remove it and install this fork's entry; the two plugins share a name and would shadow each other:

```text
omp plugin uninstall compound-engineering@compound-engineering-plugin
omp plugin marketplace remove compound-engineering-plugin
omp plugin marketplace add FORK_OWNER/compound-engineering-omp
omp plugin install compound-engineering@compound-engineering-omp
```

Pass `--scope user|project` to `uninstall` if the plugin exists in both scopes. Removing a marketplace does not uninstall plugins already cached — run the uninstall first.

## Pin-style installs

`omp install <git-url>` has no update mechanism. Re-run it to move to a newer snapshot, or switch to the marketplace flow above.
