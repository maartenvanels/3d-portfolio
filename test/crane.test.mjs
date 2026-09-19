import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { Box3, Vector3, PerspectiveCamera, Matrix3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { fitViewToBounds, sweptBounds, SLEW_ANGLE } from "../src/world.mjs";

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

test("City-boy exports the tilted crane cabin, connected hoist and bounded geometry", async () => {
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
  // Four shared materials now need separate carrier and upperworks batches.
  assert.ok(drawCalls <= 17, `${drawCalls} material batches exceed the articulated crane budget`);
  const size = new Box3().setFromObject(scene).getSize(new Vector3());
  assert.ok(size.y > 35 && size.y < 37, "Export must retain metre units and Y-up orientation");
  // Inspect the actual exported roof glazing: in crane mode it must be vertical
  // and face the jib (+X), not remain an upward-facing driving roof (+Y).
  let roofWindow;
  scene.traverse((object) => {
    if (object.isMesh && object.material.name === "Cab / roof window becomes crane windshield")
      roofWindow = object;
  });
  assert.ok(roofWindow, "The shared cabin needs a roof window");
  scene.updateMatrixWorld(true);
  const windowBounds = new Box3().setFromObject(roofWindow);
  const windowSize = windowBounds.getSize(new Vector3());
  assert.ok(windowBounds.max.z < 0, "Cabin must sit on vehicle-left: -Z in the Y-up export");
  assert.ok(windowSize.x < .01 && windowSize.y > 2 && windowSize.y < 2.3,
    "The driving roof must become a tall vertical crane windshield");
  const normalMatrix = new Matrix3().getNormalMatrix(roofWindow.matrixWorld);
  const normals = roofWindow.geometry.attributes.normal;
  for (let i = 0; i < normals.count; i++) {
    const normal = new Vector3().fromBufferAttribute(normals, i).applyMatrix3(normalMatrix).normalize();
    assert.ok(normal.x > .99, "Roof glazing must face forward along the jib after pitching");
  }
  const hook = scene.getObjectByName("CityBoy_Hook");
  const lines = scene.getObjectByName("CityBoy_HoistLines");
  assert.ok(hook && lines, "The runtime needs both independently movable hoist parts");
  const rest = hook.position.y;
  const upper = scene.getObjectByName("CityBoy_Upperworks");
  const carrier = scene.getObjectByName("CityBoy_Working");
  assert.ok(upper && upper.parent === carrier, "Upperworks need a bearing pivot on the stationary carrier");
  assert.equal(hook.parent, upper);
  assert.equal(lines.parent, upper);
  const fixedParts = carrier.children.filter(object => object.isMesh);
  const fixedMatrices = fixedParts.map(object => object.matrixWorld.clone());
  const pivot = upper.getWorldPosition(new Vector3());
  assert.ok(pivot.distanceTo(new Vector3(.95, 1.72, 0)) < .001, "Slewing must use the bearing, not the mast foot");
  const upperBounds = new Box3().setFromObject(upper);
  const envelope = sweptBounds(upperBounds, pivot, SLEW_ANGLE);
  const windowRest = windowBounds.getCenter(new Vector3());
  for (const angle of [-SLEW_ANGLE, -.3, 0, .3, SLEW_ANGLE]) {
    upper.rotation.y = angle;
    for (const lift of [-2, 0, 2]) {
      hook.position.y = rest + lift;
      lines.scale.y = 1 - lift / 11.75;
      scene.updateMatrixWorld(true);
      const ropeEnd = new Box3().setFromObject(lines).min.y;
      assert.ok(Math.abs(ropeEnd - (hook.getWorldPosition(new Vector3()).y + .21)) < .02,
        "Ropes must stay attached while hoisting and slewing together");
    }
    fixedParts.forEach((object, i) => assert.deepEqual(object.matrixWorld, fixedMatrices[i],
      "Carrier, wheels, outriggers and rear deck must remain stationary"));
    assert.ok(upper.getWorldPosition(new Vector3()).distanceTo(pivot) < .0001);
    const windowCentre = new Box3().setFromObject(roofWindow).getCenter(new Vector3());
    const expected = windowRest.clone().sub(pivot).applyAxisAngle(new Vector3(0, 1, 0), angle).add(pivot);
    assert.ok(windowCentre.distanceTo(expected) < .001, "Cabin must travel with the upperworks");
    // Sample the full sweep, not just its two endpoints, for both camera shapes.
    for (const aspect of [.55, 1.6]) {
      const camera = new PerspectiveCamera(32, aspect, .1, 400);
      const target = new Vector3(15, 17, 0);
      camera.position.copy(fitViewToBounds(new Vector3(50, 40, 60), target, envelope, 32, aspect));
      camera.lookAt(target);
      camera.updateMatrixWorld(true);
      for (const x of [upperBounds.min.x, upperBounds.max.x])
        for (const y of [upperBounds.min.y, upperBounds.max.y])
          for (const z of [upperBounds.min.z, upperBounds.max.z]) {
            const point = new Vector3(x, y, z).sub(pivot).applyAxisAngle(new Vector3(0, 1, 0), angle).add(pivot);
            assert.ok(envelope.clone().expandByScalar(.001).containsPoint(point), "Sweep envelope must contain the jib");
            point.project(camera);
            assert.ok(Math.abs(point.x) < 1 && Math.abs(point.y) < 1, "Moving jib must remain in view");
          }
    }
  }
});
