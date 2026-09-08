import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { draco } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { softenRightChest } from './soften-right-chest.mjs';

const [input, output] = process.argv.slice(2);
if (!input || !output || input === output) {
  throw new Error('Usage: node scripts/reshape-avatar.mjs INPUT.glb OUTPUT.glb (distinct paths)');
}
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.encoder': await draco3d.createEncoderModule(),
  'draco3d.decoder': await draco3d.createDecoderModule(),
});
const doc = await io.read(input);
softenRightChest(doc);
// Retain the existing mesh detail, UVs and texture; only recompress geometry.
await doc.transform(draco());
await io.write(output, doc);
