# Corgi puppet v3

Generated art: `parts.png`, produced with the built-in image generation tool.
Rendering: `node tools/render-corgi.cjs` (Sharp and @napi-rs/canvas).
Validation and self-contained phone preview: `node tools/validate-corgi.cjs`.
Open `preview.html` directly; images are embedded and need no network requests.

Seven states, 256px cells, lossless WebP alpha. Walk has 32 frames, sitting down
and standing up have 20 each; other loops have 32 each. Total: 200 frames.
The feet use four staggered contact phases, a 62% planted stance, a smooth
swing arc and two-segment joint solving. Near limbs render above the torso;
far limbs render behind it. The game speed is coupled to planted-foot travel.
The same head, body and tail are reused in every state. This is a stylized
puppet, not motion capture. Pose joins are compared after compositing alpha.

## Image generation prompt

Use case: precise-object-edit. Create a production 2D animation puppet asset
for the corgi in the reference, keeping his identity, warm orange/gold coat,
white bib, triangular ears, expressive dark eyes, friendly proportions and
polished painterly game style. TRANSPARENT background. This is NOT a sprite
animation sheet. Create exactly THREE SEPARATE large parts aligned in a single
horizontal row, equally sized square cells, landscape 1536x512 canvas. LEFT
cell: only the corgi's horizontal elongated oval orange TORSO in right-facing
profile, with broad haunch and white chest on right, beautifully clean fur
outline; NO legs, NO head, NO tail. Middle cell: only matching corgi HEAD plus
a short white neck base, looking right, two triangular upright ears, near ear
in front, muzzle and shiny dark nose, detailed eye, three-quarter profile
consistent with reference, no body or legs. RIGHT cell: only matching fluffy
gently upward-curved orange TAIL, pointed LEFT, thick attachment root at RIGHT,
no body. Each part isolated with generous transparent padding, no overlap.
Fine clean warm brown outlines, detailed fur shading, clean alpha edges without
colored fringe, no ground shadow, no labels or decorations. All three parts
must belong to exactly the same corgi character. The tail should be full and
neat, not ragged. Rounded cute but anatomically plausible, no oversized bobble
head.

Reference: `assets/sprites-v2/dog-corgi-walk-v2.webp`. Actual generated canvas:
2172x724; explicit source crops in the renderer follow the generated layout.
