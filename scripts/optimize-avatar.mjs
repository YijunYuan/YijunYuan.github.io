import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, KHRMaterialsUnlit } from '@gltf-transform/extensions';
import { weld, simplify, prune, draco, textureCompress } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import draco3d from 'draco3dgltf';
import sharp from 'sharp';
import { trimRightShoulder } from './trim-right-shoulder.mjs';
import { softenRightChest } from './soften-right-chest.mjs';
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
 'draco3d.encoder': await draco3d.createEncoderModule(),
 'draco3d.decoder': await draco3d.createDecoderModule(),
});
await MeshoptSimplifier.ready;
const doc = await io.read(process.argv[2] || 'model.glb');
const unlit = doc.createExtension(KHRMaterialsUnlit);
for (const material of doc.getRoot().listMaterials()) {
 material.setNormalTexture(null).setMetallicRoughnessTexture(null).setOcclusionTexture(null).setEmissiveTexture(null);
 for (const extension of material.listExtensions()) material.setExtension(extension.extensionName, null);
 material.setMetallicFactor(0).setRoughnessFactor(1).setExtension('KHR_materials_unlit', unlit.createUnlit());
}
await doc.transform(prune(), weld(), simplify({simplifier: MeshoptSimplifier, ratio: 0.045, error: 0.002}));
// This portrait's local +X points to the viewer's right. Trim only the outer shoulder.
trimRightShoulder(doc, 0.34);
softenRightChest(doc);
await doc.transform(weld(), prune(), textureCompress({encoder: sharp, targetFormat: 'jpeg', resize: [1024,1024], quality: 88}), draco());
await io.write(process.argv[3] || 'assets/models/avatar.glb', doc);
for (const mesh of doc.getRoot().listMeshes()) for(const p of mesh.listPrimitives()) console.log('Triangles:',p.getIndices().getCount()/3);
