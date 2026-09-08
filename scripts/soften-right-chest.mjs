// Local coordinates of this portrait: +X is viewer-right, +Y is forward,
// and -Z is up. Deform only the shirt, fading out below the neck.
const smoothstep = (a, b, value) => {
  const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function softenRightChest(doc) {
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      if (primitive.listTargets().length || primitive.getAttribute('JOINTS_0')) {
        throw new Error('Chest shaping requires this static portrait mesh.');
      }
      const positions = primitive.getAttribute('POSITION');
      const point = [];
      for (let i = 0; i < positions.getCount(); i++) {
        positions.getElement(i, point);
        const [x, y, z] = point;
        const height = -z;
        const weight = smoothstep(0.045, 0.23, x)
          * (1 - smoothstep(0.22, 0.29, height));
        if (!weight) continue;
        // Preserve the shoulder height. Fade the chest correction out broadly
        // below the shoulder ridge so it does not acquire a pinched transition.
        const chest = 1 - smoothstep(0.10, 0.24, height);
        point[0] -= 0.014 * weight * (0.35 + 0.65 * chest);
        point[1] -= 0.012 * weight * chest * smoothstep(-0.18, -0.04, y);
        // Ease the shallow dip already present along the right shoulder ridge.
        // A broad local lift blends into the shirt without lowering either side.
        const ridge = smoothstep(0.14, 0.20, x)
          * (1 - smoothstep(0.21, 0.28, x))
          * smoothstep(0.14, 0.21, height)
          * (1 - smoothstep(0.25, 0.29, height));
        point[2] -= 0.009 * ridge;
        positions.setElement(i, point);
      }
    }
  }
}
