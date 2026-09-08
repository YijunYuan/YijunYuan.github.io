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
64,659 triangles after trimming and capping the right shoulder, and applies Draco geometry compression. The unlit material
displays the albedo without specular highlights or added lighting.

The viewer-right shoulder is clipped at local X = 0.34, with UVs interpolated
along the cut. The discarded outward-facing shoulder surface is flattened onto
the cut plane to close the opening, retaining its original albedo UVs and fabric
colors. The cap is part of the mesh and follows the model as it turns. Adjust
`trimRightShoulder(doc, 0.34)` in the conversion script to change the cut.

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
