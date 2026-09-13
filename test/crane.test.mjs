import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Box3, Vector3, PerspectiveCamera } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { fitViewToBounds } from "../src/world.mjs";

test("Crane framing retains the full jib and carrier on desktop and narrow mobile screens", () => {
  const bounds = new Box3(new Vector3(-9.2, .2, -4.8), new Vector3(11, 14.6, -1.8));
  for (const aspect of [.55, 1, 1.6, 2.2]) {
    const camera = new PerspectiveCamera(32, aspect, .1, 180);
    const target = new Vector3(.5, 7, -3.3);
    camera.position.copy(fitViewToBounds(new Vector3(20, 17, 24), target, bounds, 32, aspect));
    camera.lookAt(target);
    camera.updateMatrixWorld(true);
    for (const x of [bounds.min.x, bounds.max.x])
      for (const y of [bounds.min.y, bounds.max.y])
        for (const z of [bounds.min.z, bounds.max.z]) {
          const point = new Vector3(x, y, z).project(camera);
          assert.ok(Math.abs(point.x) < 1 && Math.abs(point.y) < 1, `Clipped corner at aspect ${aspect}`);
        }
  }
});

test("City-boy loads offline within its geometry budget and its hoist stays connected", async () => {
  const bytes = await readFile(new URL("../assets/cityboy-working.glb", import.meta.url));
  assert.ok(bytes.length < 1_200_000, "Keep the lazy-loaded model below 1.2 MB");
  const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString());
  assert.ok(!json.images?.length, "This model needs no texture downloads");
  assert.ok(json.buffers.every((buffer) => !buffer.uri), "All buffers must be embedded");
  const { scene } = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), "",
  );
  let triangles = 0, drawCalls = 0;
  scene.traverse((object) => {
    if (!object.isMesh) return;
    drawCalls++;
    triangles += (object.geometry.index?.count || object.geometry.attributes.position.count) / 3;
    for (const value of object.geometry.attributes.position.array) assert.ok(Number.isFinite(value));
  });
  assert.ok(triangles < 30_000, `${triangles} triangles exceed the crane budget`);
  assert.ok(drawCalls <= 12, `${drawCalls} material batches exceed the crane budget`);
  const size = new Box3().setFromObject(scene).getSize(new Vector3());
  assert.ok(size.y > 35 && size.y < 37, "Export must retain metre units and Y-up orientation");
  const hook = scene.getObjectByName("CityBoy_Hook");
  const lines = scene.getObjectByName("CityBoy_HoistLines");
  assert.ok(hook && lines, "The runtime needs both independently movable hoist parts");
  const rest = hook.position.y;
  for (const lift of [-2, 0, 2]) {
    hook.position.y = rest + lift;
    lines.scale.y = 1 - lift / 11.75;
    scene.updateMatrixWorld(true);
    const ropeEnd = new Box3().setFromObject(lines).min.y;
    assert.ok(Math.abs(ropeEnd - (hook.position.y + .21)) < .02,
      "Changing cable length must keep the rope connected to the hook block");
  }
});
