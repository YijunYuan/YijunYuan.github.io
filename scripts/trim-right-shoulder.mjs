// Clip the mesh and flatten the removed outer shoulder into a textured end cap.
// Reusing its UVs keeps the original shirt texture and colors at the seam.
// This static portrait has no skinning or morph targets.
export function trimRightShoulder(doc, maxX) {
  for (const mesh of doc.getRoot().listMeshes()) {
    for (const primitive of mesh.listPrimitives()) {
      if (primitive.getMode() !== 4 || primitive.listTargets().length) {
        throw new Error('Shoulder trimming requires a static triangle mesh.');
      }
      const attributes = primitive.listSemantics().map((semantic) => {
        const accessor = primitive.getAttribute(semantic);
        if (accessor.getComponentType() !== 5126) {
          throw new Error('Trim before quantizing the mesh attributes.');
        }
        return { semantic, accessor, size: accessor.getElementSize(), data: Array.from(accessor.getArray()) };
      });
      const position = attributes.find((attribute) => attribute.semantic === 'POSITION');
      const input = primitive.getIndices()?.getArray() || Array.from({ length: position.accessor.getCount() }, (_, i) => i);
      const output = [];
      const intersections = new Map();
      const projected = new Map();
      const inside = (index) => position.data[index * 3] <= maxX;
      function intersect(a, b) {
        const key = a < b ? `${a}:${b}` : `${b}:${a}`;
        if (intersections.has(key)) return intersections.get(key);
        const ax = position.data[a * 3];
        const bx = position.data[b * 3];
        const t = (maxX - ax) / (bx - ax);
        const index = position.data.length / 3;
        for (const attribute of attributes) {
          for (let k = 0; k < attribute.size; k++) {
            const av = attribute.data[a * attribute.size + k];
            const bv = attribute.data[b * attribute.size + k];
            attribute.data.push(av + (bv - av) * t);
          }
        }
        position.data[index * 3] = maxX;
        intersections.set(key, index);
        return index;
      }
      function project(index) {
        if (projected.has(index)) return projected.get(index);
        const result = position.data.length / 3;
        for (const attribute of attributes) {
          for (let k = 0; k < attribute.size; k++) {
            attribute.data.push(attribute.semantic === 'NORMAL'
              ? (k === 0 ? 1 : 0)
              : attribute.data[index * attribute.size + k]);
          }
        }
        position.data[result * 3] = maxX;
        projected.set(index, result);
        return result;
      }
      for (let i = 0; i < input.length; i += 3) {
        const triangle = [input[i], input[i + 1], input[i + 2]];
        const polygon = [];
        for (let edge = 0; edge < 3; edge++) {
          const a = triangle[edge];
          const b = triangle[(edge + 1) % 3];
          if (inside(a)) polygon.push(a);
          if (inside(a) !== inside(b)) polygon.push(intersect(a, b));
        }
        for (let j = 1; j + 1 < polygon.length; j++) {
          output.push(polygon[0], polygon[j], polygon[j + 1]);
        }
        // Project the outward-facing part of the discarded shoulder onto the cut.
        // Its original UVs retain the fabric detail without inventing a flat color.
        const removed = [];
        for (let edge = 0; edge < 3; edge++) {
          const a = triangle[edge];
          const b = triangle[(edge + 1) % 3];
          if (!inside(a)) removed.push(a);
          if (inside(a) !== inside(b)) removed.push(intersect(a, b));
        }
        for (let j = 1; j + 1 < removed.length; j++) {
          const [a, b, c] = [removed[0], removed[j], removed[j + 1]];
          const area = (position.data[b * 3 + 1] - position.data[a * 3 + 1])
            * (position.data[c * 3 + 2] - position.data[a * 3 + 2])
            - (position.data[b * 3 + 2] - position.data[a * 3 + 2])
            * (position.data[c * 3 + 1] - position.data[a * 3 + 1]);
          // Reject back-facing folds and degenerate projected triangles.
          if (area > 1e-12) output.push(project(a), project(b), project(c));
        }
      }
      for (const { accessor, data } of attributes) accessor.setArray(new Float32Array(data));
      const indices = doc.createAccessor().setType('SCALAR')
        .setBuffer(position.accessor.getBuffer()).setArray(new Uint32Array(output));
      primitive.setIndices(indices);
    }
  }
}
