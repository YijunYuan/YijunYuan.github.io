# 3D avatar

From the repository root, using Node.js 22 or newer:

```sh
npm ci --prefix scripts
node scripts/optimize-avatar.mjs /path/to/original-source.glb assets/models/avatar.glb
```

The website model is `assets/models/avatar.glb`; no root copy is needed.
Use an unprocessed source model when
rerunning the conversion to avoid simplifying an already optimized mesh again.
The website loads only `assets/models/avatar.glb` (about 471 KiB).

The conversion preserves UVs and the base-color/albedo texture, resizes it to
1024 × 1024 JPEG, removes other PBR maps, reduces the mesh from 1,459,422 to
about 64,650 triangles after trimming, capping and gently reshaping the right shoulder, and applies Draco geometry compression. The unlit material
displays the albedo without specular highlights or added lighting.

The viewer-right shoulder is clipped at local X = 0.34, with UVs interpolated
along the cut. The discarded outward-facing shoulder surface is flattened onto
the cut plane to close the opening, retaining its original albedo UVs and fabric
colors. The cap is part of the mesh and follows the model as it turns. Adjust
`trimRightShoulder(doc, 0.34)` in the conversion script to change the cut.

`soften-right-chest.mjs` then gently pulls the viewer-right shirt inward and
backward without lowering the shoulder. The chest correction fades out below
the shoulder ridge, and a small local lift eases its existing dip. The adjustment fades out toward the
center and neck, with no changes at local Z <= -0.29 (the head and upper neck).
It preserves the original texture and UVs, leaving some natural asymmetry.
To apply this step alone to a trimmed model that has **not yet been reshaped**:

```sh
node scripts/reshape-avatar.mjs /path/to/trimmed-avatar.glb /path/to/reshaped-avatar.glb
```

Do not apply it repeatedly to the website model; the deformation is cumulative.

`assets/js/avatar-model.js` centers and fits the model automatically. The
pointer rotation limits are 0.48 radians horizontally and 0.28 vertically.
Animation stops once the model settles, while offscreen, and while the tab is
hidden. Reduced-motion preferences disable tracking. Loading reserves an empty
space until the model is ready, so the original portrait does not flash. The
original avatar is the fallback on errors, without WebGL or JavaScript, and in print.

The vendored Three.js runtime, GLTFLoader, DRACOLoader and Draco decoder come
from `three@0.134.0`, matching the existing Vanta background. Three.js is MIT
licensed (see `assets/js/vendor/three/LICENSE`); Draco is Apache-2.0 licensed:
https://github.com/google/draco/blob/main/LICENSE.

Compression API: https://gltf-transform.dev/
