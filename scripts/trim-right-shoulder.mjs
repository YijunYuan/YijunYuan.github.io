// Clip the actual mesh, interpolating UVs at the cut to retain the albedo mapping.
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
      }
      for (const { accessor, data } of attributes) accessor.setArray(new Float32Array(data));
      const indices = doc.createAccessor().setType('SCALAR')
        .setBuffer(position.accessor.getBuffer()).setArray(new Uint32Array(output));
      primitive.setIndices(indices);
    }
  }
}
