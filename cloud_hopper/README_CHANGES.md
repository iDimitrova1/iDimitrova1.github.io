# Cloud Hopper upgrade patch

This patch builds on the previous global leaderboard and mountain/cloud patches.

## New files

```text
js/settings.js       Quality presets and shared render settings
js/performance.js    F3 developer performance overlay
js/difficulty.js     Route patterns and difficulty progression
js/audio.js          Lightweight generated sound scaffold
```

## Main upgrades

### Smoother rendering

- Cloud puffs are now rendered with `THREE.InstancedMesh` groups per cloud platform instead of many separate mesh objects.
- Cloud collision checks now use only platforms near the player instead of scanning the full platform array every frame.
- Raycasting frequency now follows the selected quality preset.
- Ocean normal recomputation now follows the selected quality preset.
- Mountain trees and snow caps are hidden at distance to reduce rendering cost.
- Renderer pixel ratio, camera far plane, shadow size, tree density, star count, cloud density, mountain distance, and ocean work are now quality-controlled.

### Quality presets

The start menu now has:

```text
Low
Medium
High
Ultra
```

The selected preset is stored in localStorage.

### Performance/debug overlay

Press:

```text
F3
```

The overlay shows:

```text
FPS
draw calls
triangles
geometries/textures
cloud count
pooled cloud groups
collision cloud count
mountain chunks
tree instances
ray targets
```

### More engaging runs

Cloud generation now uses route patterns:

```text
straight
gentle zigzag
wide jumps
climb sections
boost chains
wind lines
crumble gaps
recovery sections
```

Special clouds were added:

```text
Gold cloud      bonus score
Blue boost      launches the player upward
Grey crumble    disappears after landing
Cyan wind       pushes sideways
```

The HUD now shows a combo counter and toast messages for special cloud events.

### Sound scaffold

Generated Web Audio sounds were added for:

```text
jump
landing
boost
bonus
crumble
wind intensity
```

No external audio files are required. Audio starts only after the first player click, which matches browser autoplay restrictions.

## Files changed

```text
index.html
css/style.css
js/settings.js
js/performance.js
js/difficulty.js
js/audio.js
js/world.js
js/clouds.js
js/environment.js
js/raytracing.js
js/ocean.js
js/mountains.js
js/physics.js
js/input.js
js/hud.js
js/main.js
```

`leaderboard-config.js` is included unchanged so your Firebase setup remains in place.
