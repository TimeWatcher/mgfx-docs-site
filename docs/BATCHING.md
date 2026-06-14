# Removed Shape Batching Design

This page is historical. MGFX no longer ships the generic shape/data-texture
batching prototype. It remains documented so future work does not repeat the
same failure mode without stronger evidence.

## Decision

MGFX keeps shape and widget rendering on immediate shader/fallback paths. The
generic batch scheduler, candidate detection, data-texture upload path, and
batch-only shader family were removed from runtime.

## Measured Evidence

The prototype tried to group compatible shapes into larger shader submissions.
On representative GMod UI, the runtime cost moved from draw calls to Lua
scheduling and upload work:

- candidate detection ran on every shape
- compatible runs were often short because UI painter order changes frequently
- data-texture packing and upload cost were not free
- every batched variant expanded the shader matrix and maintenance surface
- fallback parity and effect ordering became difficult to reason about

The result was not a reliable win. It also made the code harder to maintain and
made visual behavior harder to prove.

## Removed Runtime Pieces

The removed design included:

- generic shape candidate collection
- data-texture record packing for shapes
- scheduler state that tried to discover batch runs
- batch-only shape shader variants
- compatibility checks around visual slots that kept expanding
- runtime hooks that could silently route public calls through a different
  renderer path

The documentation keeps this page as a warning, not as a disabled feature flag.

## Failure Reasons

### Data Texture Upload Was Not Cheap

Batching moved cost into record packing, texture upload, and material state. In
GMod's Lua/Source bridge, those operations can be more expensive than the draw
calls they replace.

### Candidate Detection Became Hot

Every shape had to be classified before drawing. The more advanced MGFX style
records became, the more checks were needed for radius, stroke, fill type,
pattern, glow, backdrop, transform, and shader fallback parity.

### GMod UI Rarely Forms Long Runs

Real VGUI paint order often alternates panel backgrounds, text, icons, clipped
regions, and debug overlays. That breaks long homogeneous shape runs, especially
in scoreboards and HUD panels where painter order is visible.

### Shader Count Expanded Maintenance Cost

Each new visual slot forced a decision: immediate shader, batch shader, fallback
path, or some combination. Keeping all paths visually equivalent became more
expensive than the runtime benefit.

### Visual Parity Was Expensive

Source-over order, transparent gradients, AA edges, glow bounds, backdrop reads,
and mask coverage all need exact behavior. A batch path that is "almost" the
same is not acceptable for UI rendering.

## Bar for Reintroducing Batching

Batching can be reconsidered only with:

- representative GMod UI profiles showing a real draw-call bottleneck after
  current immediate optimizations
- a narrow target family rather than a generic scheduler
- pixel-level parity tests for blend order and AA
- a parameter upload path with measured benefit in GMod
- a maintenance plan that does not duplicate every public visual slot

Until then, MGFX should optimize immediate paths, fused shaders, parameter
upload, allocation behavior, and text routing first.
