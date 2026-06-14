# Widgets

Widget functions draw renderer-level controls: progress bars, segment bars,
rings, arcs, and radial sectors.

Facade aliases: `MGFX.ProgressBar`, `MGFX.ProgressBarEx`, `MGFX.SegmentBar`,
`MGFX.SegmentBarEx`, `MGFX.Ring`, `MGFX.RingEx`, `MGFX.Arc`, `MGFX.ArcEx`,
`MGFX.Sector`, `MGFX.SectorEx`.

## Scope

- `ringEx(cx, cy, radius, width, style)` and
  `arcEx(cx, cy, radius, width, startDeg, endDeg, style)` keep thickness in
  geometry parameters.
- `sectorEx(cx, cy, innerRadius, outerRadius, startDeg, endDeg, style)` is a
  true radial sector, not a thick arc.
- Shape-local angular gradients are not the same as global conic gradients.

## This Page

- [progressBar](#progressbar) - Simple horizontal progress bar.
- [progressBarEx](#progressbarex) - Advanced progress bar with effect slots.
- [segmentBar](#segmentbar) - Simple segmented value bar.
- [segmentBarEx](#segmentbarex) - Advanced segmented bar.
- [ring](#ring) - Simple full ring.
- [ringEx](#ringex) - Advanced ring with effects.
- [arc](#arc) - Simple arc segment.
- [arcEx](#arcex) - Advanced arc with ring-style effects.
- [sector](#sector) - Simple straight-edged radial sector.
- [sectorEx](#sectorex) - Advanced radial sector.

## Function Reference

## progressBar

```lux
mgfx.widgets.progressBar(x, y, w, h, value, radius, track, fill, stroke = nil, strokeWidth = nil)
```

Draws a simple horizontal progress bar. `value` is clamped to `0..1`.

## progressBarEx

```lux
mgfx.widgets.progressBarEx(x, y, w, h, value, style)
```

Advanced progress bar.

| Field | Description |
| --- | --- |
| `radius` | Track and fill radius. Defaults near `min(4, h * 0.5)`. |
| `padding` | Inset between track and fill. |
| `track` | Unfilled track paint. |
| `fill` | Filled paint. |
| `stroke / strokeWidth` | Optional track stroke. |
| `trackPattern / fillPattern` | Pattern slots. |
| `outerGlow / innerGlow` | Extra effects on fallback paths. |
| `fx` | Optional `{glow, sheen, marker, ticks}` fast-path effect flags. |

## segmentBar

```lux
mgfx.widgets.segmentBar(x, y, w, h, value, segments, fill, track)
```

Draws a segmented value bar for ammo, charges, perk points, or compact discrete
meters.

## segmentBarEx

```lux
mgfx.widgets.segmentBarEx(x, y, w, h, value, style)
```

Advanced segmented bar.

| Field | Description |
| --- | --- |
| `segments` | Segment count, clamped to a reasonable range. |
| `gap` | Pixel gap between segments. |
| `radius` | Per-segment radius. |
| `background / backgroundRadius` | Optional container behind all segments. |
| `track` | Inactive segment paint. |
| `fill / color` | Active segment paint. |
| `fillPattern / trackPattern` | Pattern slots. |
| `stroke / strokeWidth` | Per-segment stroke on fallback paths. |

## ring

```lux
mgfx.widgets.ring(cx, cy, radius, width, fill)
```

Draws a simple full ring. `radius` is the outer radius and `width` is the band
thickness.

## ringEx

```lux
mgfx.widgets.ringEx(cx, cy, radius, width, style)
```

Advanced ring with fill, stroke, pattern, glow, backdrop, and transform.

```lux
mgfx.widgets.ringEx(cx, cy, 38, 7, {
  fill = mgfx.style.conicGradient(0.5, 0.5, 20, Color(80, 170, 255), Color(255, 210, 110)),
  outerGlow = { color = Color(80, 170, 255, 55), width = 12 },
})
```

## arc

```lux
mgfx.widgets.arc(cx, cy, radius, startDeg, endDeg, width, fill)
```

Draws a simple round-capped arc segment.

## arcEx

```lux
mgfx.widgets.arcEx(cx, cy, radius, width, startDeg, endDeg, style)
```

Advanced arc. Angles are in degrees. Use for gauges, progress arcs, circular
ticks, and partial cooldown meters.

## sector

```lux
mgfx.widgets.sector(cx, cy, innerRadius, outerRadius, startDeg, endDeg, fill)
```

Draws a straight-edged radial sector. `innerRadius = 0` makes a solid sector.

## sectorEx

```lux
mgfx.widgets.sectorEx(cx, cy, innerRadius, outerRadius, startDeg, endDeg, style)
```

Advanced sector. Use `sectorRadialGradient` and `sectorAngularGradient` for
sector-local gradients.

```lux
mgfx.widgets.sectorEx(cx, cy, 36, 92, -45, 45, {
  fill = mgfx.style.sectorAngularGradient(Color(80, 170, 255, 170), Color(255, 210, 110, 145)),
  stroke = Color(255, 255, 255, 36),
  strokeWidth = 1,
})
```

[Back to detailed API index](./index)
