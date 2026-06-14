# Removed Batch Coverage

This page records which batch coverage was removed with the old generic shape
batching prototype. It is historical and should not be treated as a feature
roadmap.

## Removed Coverage

The prototype attempted to cover:

- rounded boxes
- chamfer boxes
- simple fill/stroke shapes
- selected gradient fills
- selected inner effects
- selected widget shapes
- data-texture based parameter upload
- run discovery in the paint stream

Coverage kept shrinking as public style records grew. Each new field required
more compatibility checks:

- `style.backdrop`
- `innerGlow`
- `outerGlow`
- `pattern`
- multi-stop gradients
- image masks
- transform
- per-shape fallbacks
- text/clip ordering barriers

The scheduler needed to prove that a shape could be batched without changing
its output. That proof became the hot-path cost.

## Why It Was Removed

The generic approach conflated two goals:

1. reduce draw calls
2. keep immediate UI behavior and visual parity

In GMod, the second goal dominated. UI often relies on explicit paint order,
and the Lua/Source boundary makes classification and upload work expensive.

The prototype was removed because it was a net complexity increase without
stable runtime wins on representative UI.

## Current Coverage Strategy

MGFX now treats "coverage" as implemented render slots on immediate paths.

- Use `GetCapabilities(target)` for supported slots.
- Use `Supports(target, key)` for a specific slot.
- Add shader support to the target family that actually needs it.
- Keep fallback behavior explicit.

If a new optimization is needed, prefer a narrow fused shader or a specialized
path with measured benefits over reviving a general-purpose scheduler.
