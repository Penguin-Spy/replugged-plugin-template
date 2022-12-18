# THIS IS NOT THE OFFICIAL PLUGIN TEMPLATE
you should [use the real one instead](https://github.com/replugged-org/plugin-template)!!

---

This is an unofficial template for [replugged](https://github.com/replugged-org/replugged) plugins, **without** Typescript support or linting!  
it still supports bundling the plugin into a `.asar` and ~~installing it into replugged automatically~~ (soon)

this was created for personal use because:
- i hate the computer telling me what code i can and can't write
- trying to type a Discord mod is fundamentally flawed and annoying


## Prerequisites
- NodeJS
- pnpm: `npm i -g pnpm`
- [Replugged](https://github.com/replugged-org/replugged#installation)

## Install
1. [Create a copy of this template](https://github.com/penguin-spy/replugged-plugin-template/generate)
2. Clone your new repository and cd into it
3. Install dependencies: `pnpm i`
4. Bundle the plugin: `pnpm run bundle`
5. Copy the resulting `.asar` file to the [plugins folder](https://github.com/replugged-org/replugged#installing-plugins-and-themes)
6. Reload Discord to load the plugin

The unmodified plugin will log "Typing prevented" in the console when you start typing in any
channel.

## Distribution
github workflow and automatic rebundling/installing coming soon™
