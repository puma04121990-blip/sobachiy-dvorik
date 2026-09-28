# Animation playback pass

All seven breeds use distance-driven gait playback. Each breed now has an
explicit cycle duration and stride measured in actor widths. These values are
visual tuning parameters, not measurements of a real dog's gait.

- Labrador: existing 24-frame rig and authored cadence retained.
- Corgi, Husky, Dachshund, Shiba, Poodle, Beagle: individual walking cadence,
  shorter strides for short-legged breeds, separate rest and reaction rates.
- Resting poses in the legacy sheets ping-pong instead of abruptly wrapping.
- The kennel arrival leads to sitting. After standing, a brief stationary turn
  precedes departure. Left-boundary turns also pause before changing direction.
- Missing optional sheets fall back to a loaded pose instead of freezing the
  complete actor. A breed switch clears the previous petting reaction.

Open `animations.html` to inspect all breeds and six states, pause, step each
breed one frame, reverse the direction, or change playback speed. This is a
sprite inspection page; runtime transitions are covered by the game tests.

## Artwork limitations

The subsequent Corgi v3 pass replaces its six legacy sheets with a consistent
32-frame textured puppet, including a dedicated seated tail reaction. See
`assets/corgi-v3/README.md` and the self-contained `preview.html` in that folder.
The five remaining legacy breeds
still have seven walk frames and some blue chroma edging in their source
textures. Timing changes cannot supply missing in-between drawings or repair
anatomy. A later artwork pass should replace these with consistent, registered
rigs, preserving breed silhouettes and distinct near/far limbs. Do not use
cross-fading between frames: it creates doubled paws.

## Checks

`npm test` exercises all seven breeds through walking, sitting down, sitting,
standing up and resting. It verifies frame bounds, sheet selection, flowerbed
bounds, reduced motion, seated clicks and optional-image load failure.
