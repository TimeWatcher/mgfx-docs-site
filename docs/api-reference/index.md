# Detailed API Reference

This is the function-level reference for the MGFX public API. Start with
[Use MGFX](../USAGE) if you are setting up a project, and read
[API Overview](../API) for the conceptual model.

MGFX has two public surfaces:

```text
Lux                 mgfx.api.roundedBoxEx(...)
Plain GLua facade   MGFX.RoundedBoxEx(...)
```

The detailed pages are grouped by topic for reading, not by import path. Lux
examples use `mgfx.api.*`; the installed facade uses the same operation names
in PascalCase.

## Choose by Task

| Need | Read first | Main entry points |
| --- | --- | --- |
| Panels, buttons, badges, arrows, convex polygons | [Primitives](./primitives) | `roundedBoxEx`, `chamferBoxEx`, `regularPolyEx`, `diamondEx`, `caretEx`, `polyEx` |
| Avatars, icons, cropping, rounded/chamfer/texture masks | [Images and Masks](./images) | `imageEx`, `iconEx`, `mask` |
| Health bars, ammo pips, rings, gauges, wheel sectors | [Widgets](./widgets) | `progressBarEx`, `segmentBarEx`, `ringEx`, `arcEx`, `sectorEx` |
| Plain labels, outlined text, glow titles, text boxes | [Text API](./text-api) | `text`, `textEx`, `textBoxEx`, `measureTextBox` |
| Gradients, stops, patterns, draw transforms | [Paint, Patterns, Transforms, and Capabilities](./paint) | `linearGradient`, `radialGradient`, `sectorAngularGradient`, `stripePattern`, `pointerTilt` |
| VGUI Paint / HUDPaint lifecycle | [Frame Scope and Debugging](./frame) | `startPanel`, `startScreen`, `pushClip`, `debugOverlay` |

For ordinary controls, use the short signature or the matching `Ex` style
table. Avoid adding a second helper layer unless it removes real project-level
duplication.

## Groups

<div class="mgfx-capability-grid">
  <a href="./frame">
    <span>Frame</span>
    <strong>Frame Scope and Debugging</strong>
    <small>Panel/screen frames, rectangular clips, command flush, and debug overlay.</small>
  </a>
  <a href="./primitives">
    <span>Shape</span>
    <strong>Primitives</strong>
    <small>Rounded boxes, chamfers, convex polygons, lines, circles, capsules, backdrop, and transforms.</small>
  </a>
  <a href="./images">
    <span>Image</span>
    <strong>Images and Masks</strong>
    <small>Images, icons, fit/crop/UV, rounded masks, chamfer masks, circle masks, and texture masks.</small>
  </a>
  <a href="./widgets">
    <span>Widget</span>
    <strong>Widgets</strong>
    <small>Progress bars, segment bars, rings, arcs, and radial sectors.</small>
  </a>
  <a href="./text-api">
    <span>Text</span>
    <strong>Text API</strong>
    <small>Font aliases, text styles, measurement, prewarm, native text routing, and shader effects.</small>
  </a>
  <a href="./paint">
    <span>Paint</span>
    <strong>Paint, Patterns, Transforms, and Capabilities</strong>
    <small>Colors, gradients, patterns, 2.5D transforms, and target capability queries.</small>
  </a>
</div>

## Reading Order

- New Lux code should import `@lux/mgfx` and call `mgfx.api.*`.
- Existing GLua code may call the installed `MGFX.*` facade after
  `mgfx.installGlobal("MGFX")`.
- When changing public behavior, update the overview and the relevant detailed
  family page together.
