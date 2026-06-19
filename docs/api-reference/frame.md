# Frame Scope and Debugging

Frame functions manage the active MGFX draw frame, rectangular clipping, queued
command flush, and debug overlay. Coordinates are relative to the active frame.

Facade aliases: `MGFX.StartPanel`, `MGFX.EndPanel`, `MGFX.StartScreen`,
`MGFX.EndScreen`, `MGFX.PushClip`, `MGFX.PopClip`, `MGFX.DebugOverlay`.

## Scope

- Use `startPanel` / `endPanel` inside `PANEL:Paint`.
- Use `startScreen` / `endScreen` inside `HUDPaint` or screen-space overlays.
- `pushClip` / `popClip` are rectangular scissor clips, not arbitrary shape
  masks.

## This Page

- [startPanel](#startpanel) - Start a panel-local MGFX frame and install panel clipping.
- [endPanel](#endpanel) - End the panel frame, replay queued commands, and clear frame state.
- [startScreen](#startscreen) - Start a screen-space frame, usually for HUDPaint.
- [endScreen](#endscreen) - End the screen-space frame and flush queued commands.
- [pushClip](#pushclip) - Push a frame-local rectangular scissor clip.
- [popClip](#popclip) - Pop the current rectangular clip and restore the previous scissor.
- [debugOverlay](#debugoverlay) - Draw a small internal render statistics overlay.

## Function Reference

## startPanel

```lux
mgfx.api.startPanel(panel, w, h)
```

Starts a panel-local MGFX frame and immediately installs panel clipping.

#### Parameters

| Parameter | Description |
| --- | --- |
| `panel` | VGUI panel. `panel:LocalToScreen(0, 0)` becomes the frame origin. |
| `w, h` | Optional frame size. If omitted, MGFX reads `panel:GetSize()`. |

#### Notes

- Call at the beginning of `PANEL:Paint` or another panel-local paint function.
- Later draw coordinates are panel-local, not screen coordinates.
- Always pair it with `endPanel` in the same paint pass.

#### Example

```lux
client fn paint(panel, w, h) {
  mgfx.api.startPanel(panel, w, h)
  mgfx.api.roundedBox(0, 0, w, h, 8, Color(20, 24, 32, 230))
  mgfx.api.endPanel()
}
```

## endPanel

```lux
mgfx.api.endPanel()
```

Ends the current panel frame, replays queued text/clip commands, and clears
frame state.

#### Notes

- Shapes and images normally draw immediately; text flushes here.
- Call after all MGFX panel drawing for the current frame.

#### Example

```lux
mgfx.api.startPanel(panel, w, h)
mgfx.api.text("Ready", "DermaDefault", 12, 12, color_white)
mgfx.api.endPanel()
```

## startScreen

```lux
mgfx.api.startScreen(w = ScrW(), h = ScrH())
```

Starts a screen-space MGFX frame, usually for `HUDPaint`.

#### Parameters

| Parameter | Description |
| --- | --- |
| `w, h` | Optional screen frame size. Defaults to `ScrW()` and `ScrH()`. |

#### Notes

- Coordinates are already screen-space with the origin at the top left.
- Use for HUD layers, not panel paint.

#### Example

```lux
hook.Add("HUDPaint", "MyHud", () => {
  mgfx.api.startScreen()
  mgfx.api.ring(ScrW() - 72, 72, 28, 5, Color(80, 210, 170))
  mgfx.api.endScreen()
})
```

## endScreen

```lux
mgfx.api.endScreen()
```

Ends the current screen frame and flushes queued commands.

#### Notes

- Pair with `startScreen`.
- If text appears behind shapes, issue the text calls later before `endScreen`.

## pushClip

```lux
mgfx.api.pushClip(x, y, w, h)
```

Pushes a rectangular scissor clip relative to the active frame.

#### Parameters

| Parameter | Description |
| --- | --- |
| `x, y` | Clip origin in active frame-local pixels. |
| `w, h` | Clip size. Non-positive size becomes an empty clip. |

#### Notes

- This is rectangular clipping only, not a shape mask stack.
- Nested clips intersect with parent clips.

## popClip

```lux
mgfx.api.popClip()
```

Pops the current rectangular clip and restores the previous scissor rectangle.

#### Notes

- Every `pushClip` should be matched by one `popClip`.
- An unbalanced clip stack can affect later draws in the same frame.

## debugOverlay

```lux
mgfx.api.debugOverlay(x = 8, y = 8)
```

Draws a small internal render statistics overlay.

#### Parameters

| Parameter | Description |
| --- | --- |
| `x, y` | Optional overlay position. |

#### Notes

- Useful during development for draw count, fallback count, and text stats.
- It uses ordinary GMod text and is not intended as production UI.

[Back to detailed API index](./index)
