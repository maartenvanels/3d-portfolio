import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// Fit every corner of the selected subject, including the long jib on narrow screens.
export function fitViewToBounds(position, target, bounds, fov, aspect) {
  const back = position.clone().sub(target).normalize();
  const right = new THREE.Vector3(0, 1, 0).cross(back).normalize();
  const up = back.clone().cross(right);
  const tangent = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  let distance = position.distanceTo(target);
  for (const x of [bounds.min.x, bounds.max.x])
    for (const y of [bounds.min.y, bounds.max.y])
      for (const z of [bounds.min.z, bounds.max.z]) {
        const point = new THREE.Vector3(x, y, z).sub(target);
        distance = Math.max(distance, point.dot(back) + 1.12 * Math.max(
          Math.abs(point.dot(right)) / (tangent * aspect),
          Math.abs(point.dot(up)) / tangent,
        ));
      }
  return position.copy(target).addScaledVector(back, distance);
}

// Original geometry: a Blender-authored crane plus a procedural workshop. No runtime CDN.
// Static geometry is batched by material; the handful of moving parts stay separate.
export async function mountWorld({ canvas, stage, onZone, onError }) {
  const { scene: crane } = await new GLTFLoader().loadAsync(new URL("./cityboy-working.glb", import.meta.url).href);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  const mobile = matchMedia("(max-width: 700px)").matches;
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.25 : 1.6));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.25;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 180);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.enableZoom = false; // Page scrolling remains native; zoom has explicit buttons.
  controls.minPolarAngle = 0.22;
  controls.maxPolarAngle = Math.PI / 2.12;
  controls.minDistance = 10;
  controls.maxDistance = 120;
  controls.rotateSpeed = 0.6;
  controls.touches.ONE = null; // One finger scrolls the page. Two fingers rotate the scene.
  controls.touches.TWO = THREE.TOUCH.DOLLY_ROTATE;
  canvas.style.touchAction = "pan-y";

  const geometries = new Set(),
    materials = new Set(),
    textures = new Set(),
    batches = new Map();
  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  geometries.add(unitBox);
  const unitCylinder = new THREE.CylinderGeometry(1, 1, 1, 12);
  geometries.add(unitCylinder);
  const rounded = new RoundedBoxGeometry(1, 1, 1, 2, 0.08);
  geometries.add(rounded);
  function material(color, roughness = 0.65, metalness = 0.08, glow = false) {
    const mat = new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      ...(glow ? { emissive: color, emissiveIntensity: 0.65 } : {}),
    });
    materials.add(mat);
    return mat;
  }
  const palette = {
    paper: material("#ecebdc"),
    concrete: material("#c7cdc0"),
    edge: material("#809080"),
    dark: material("#253d3c", 0.48, 0.35),
    steel: material("#91a5a0", 0.35, 0.55),
    orange: material("#db6d35", 0.4, 0.25),
    yellow: material("#eec875", 0.5),
    teal: material("#35786d", 0.45, 0.3),
    glass: material("#254d57", 0.19, 0.6),
    rubber: material("#293632", 0.92, 0),
    green: material("#759875"),
    wood: material("#c49a67"),
    light: material("#d6f3c5", 0.5, 0, true),
    blue: material("#6baca9", 0.5, 0.1, true),
    solar: material("#334e5f", 0.24, 0.5),
    road: material("#a6b0a4"),
  };
  const transform = new THREE.Object3D();
  const worldRoot = new THREE.Group();
  scene.add(worldRoot);
  function part(
    geometry,
    mat,
    size,
    pos,
    zone = null,
    rotation = [0, 0, 0],
    parent = null,
  ) {
    if (parent) {
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.scale.set(...size);
      mesh.position.set(...pos);
      mesh.rotation.set(...rotation);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.zone = zone;
      parent.add(mesh);
      return mesh;
    }
    transform.position.set(...pos);
    transform.scale.set(...size);
    transform.rotation.set(...rotation);
    transform.updateMatrix();
    const key = geometry.uuid + mat.uuid;
    if (!batches.has(key))
      batches.set(key, { geometry, mat, matrices: [], zones: [] });
    batches.get(key).matrices.push(transform.matrix.clone());
    batches.get(key).zones.push(zone);
  }
  const box = (mat, size, pos, zone, rotation, parent) =>
    part(unitBox, mat, size, pos, zone, rotation, parent);
  const cyl = (mat, r, h, pos, zone, rotation = [0, 0, 0], parent = null) =>
    part(unitCylinder, mat, [r, h, r], pos, zone, rotation, parent);
  function beam(a, b, r, mat, zone, parent = null) {
    const start = new THREE.Vector3(...a),
      end = new THREE.Vector3(...b),
      middle = start.clone().add(end).multiplyScalar(0.5);
    const direction = end.clone().sub(start);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      direction.clone().normalize(),
    );
    const e = new THREE.Euler().setFromQuaternion(q);
    return part(
      unitCylinder,
      mat,
      [r, direction.length(), r],
      middle.toArray(),
      zone,
      [e.x, e.y, e.z],
      parent,
    );
  }
  function label(text, x, y, z, width = 2.6) {
    const surface = document.createElement("canvas");
    surface.width = 512;
    surface.height = 80;
    const ctx = surface.getContext("2d");
    ctx.fillStyle = "#e9ecdf";
    ctx.fillRect(0, 0, 512, 80);
    ctx.fillStyle = "#334e42";
    ctx.font = "500 28px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text, 256, 50);
    const texture = new THREE.CanvasTexture(surface);
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.add(texture);
    const mat = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.DoubleSide,
    });
    materials.add(mat);
    const geometry = new THREE.PlaneGeometry(width, (width * 80) / 512);
    geometries.add(geometry);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.x = -Math.PI / 2;
    worldRoot.add(mesh);
  }

  // A floating architectural plinth, with a recessed engineering floor.
  part(rounded, palette.edge, [22, 0.8, 18], [0, -0.5, 0]);
  part(rounded, palette.paper, [21.8, 0.28, 17.8], [0, -0.01, 0]);
  box(palette.road, [20.3, 0.04, 3.25], [0, 0.155, 3.95]);
  for (let x = -9; x < 10; x += 1.5)
    box(palette.paper, [0.8, 0.018, 0.07], [x, 0.185, 4.05]);
  for (const x of [-10, 10])
    box(palette.dark, [0.06, 0.03, 15.8], [x, 0.16, 0]);
  for (const z of [-7.9, 7.9])
    box(palette.dark, [20, 0.03, 0.06], [0, 0.16, z]);
  // Four islands organize the workshop.
  for (const [x, z, w, d] of [
    [-4, -3, 10, 7],
    [5, -3.8, 6.3, 5.5],
    [-6, 6.3, 5.5, 2.5],
    [5, 6.2, 5.4, 2.7],
  ]) {
    box(palette.concrete, [w, 0.07, d], [x, 0.18, z]);
  }
  // Original Blender model: three-axle carrier, closed telescopic mast and lifting cab.
  // One shared mesh per material keeps the detailed model cheap to render.
  crane.scale.setScalar(0.4);
  crane.position.set(-6.5, 0.18, -3.3);
  crane.traverse((obj) => {
    if (!obj.isMesh) return;
    obj.userData.zone = "crane";
    obj.castShadow = true;
    obj.receiveShadow = true;
    geometries.add(obj.geometry);
    for (const mat of Array.isArray(obj.material) ? obj.material : [obj.material]) {
      materials.add(mat);
      for (const value of Object.values(mat)) if (value?.isTexture) textures.add(value);
    }
  });
  worldRoot.add(crane);
  const hoistLines = crane.getObjectByName("CityBoy_HoistLines");
  const hoistHook = crane.getObjectByName("CityBoy_Hook");
  const hookRestHeight = hoistHook.position.y;
  label("01 / ELECTRIC & HYBRID", -4, 0.241, -6.05, 5.5);

  // Industrial cell: open-sided workshop, sawtooth roof and solar panels.
  const pz = "production";
  box(palette.paper, [6.1, 2.65, 0.16], [5, 1.53, -6.3], pz);
  box(palette.paper, [0.16, 2.65, 4.5], [8.04, 1.53, -4.05], pz);
  for (const x of [2.05, 8.03])
    for (const z of [-6.25, -2.05])
      box(palette.steel, [0.14, 3.05, 0.14], [x, 1.73, z], pz);
  for (let x = 2.4; x < 8; x += 0.67)
    box(palette.glass, [0.49, 1.04, 0.035], [x, 2.1, -6.19], pz);
  for (let x = 2.35; x < 8; x += 0.65)
    box(palette.concrete, [0.018, 2.6, 0.04], [x, 1.53, -6.2], pz);
  box(palette.dark, [6.3, 0.12, 2.1], [5, 3.3, -5.45], pz, [-0.09, 0, 0]);
  for (let x = 2.5; x < 8; x += 1.05)
    for (const z of [-5.85, -5.04]) {
      box(
        palette.solar,
        [0.93, 0.04, 0.72],
        [x, 3.42 + (z + 5.45) * 0.09, z],
        pz,
        [-0.09, 0, 0],
      );
      for (let s = 0; s < 3; s++)
        box(
          palette.steel,
          [0.008, 0.01, 0.72],
          [x - 0.3 + s * 0.3, 3.445 + (z + 5.45) * 0.09, z],
          pz,
          [-0.09, 0, 0],
        );
    }
  // Conveyor with individually animated packages.
  box(palette.steel, [5.3, 0.28, 1.05], [4.85, 0.9, -2.05], pz);
  for (let x = 2.35; x < 7.5; x += 0.22)
    cyl(palette.dark, 0.075, 0.9, [x, 1.07, -2.05], pz, [Math.PI / 2, 0, 0]);
  for (const x of [2.7, 7])
    for (const z of [-2.44, -1.66])
      box(palette.steel, [0.12, 0.7, 0.12], [x, 0.55, z], pz);
  const packages = [];
  for (let i = 0; i < 4; i++) {
    const group = new THREE.Group();
    group.position.set(2.6 + i * 1.25, 1.38, -2.05);
    worldRoot.add(group);
    box(palette.wood, [0.59, 0.5, 0.61], [0, 0, 0], pz, [0, 0, 0], group);
    box(palette.paper, [0.12, 0.013, 0.61], [0, 0.26, 0], pz, [0, 0, 0], group);
    packages.push(group);
  }
  // Six-axis-inspired robot, readable silhouette with articulated shoulder.
  cyl(palette.dark, 0.47, 0.36, [5.3, 0.4, -3.9], pz);
  const robot = new THREE.Group();
  robot.position.set(5.3, 0.6, -3.9);
  worldRoot.add(robot);
  cyl(palette.orange, 0.31, 0.53, [0, 0.28, 0], pz, [0, 0, 0], robot);
  beam([0, 0.48, 0], [-0.68, 1.43, 0.1], 0.22, palette.orange, pz, robot);
  cyl(
    palette.dark,
    0.25,
    0.48,
    [-0.68, 1.43, 0.1],
    pz,
    [Math.PI / 2, 0, 0],
    robot,
  );
  beam([-0.68, 1.43, 0.1], [0.0, 1.85, 1.0], 0.16, palette.orange, pz, robot);
  cyl(palette.dark, 0.19, 0.35, [0, 1.85, 1], pz, [Math.PI / 2, 0, 0], robot);
  beam([0, 1.85, 1], [0.1, 1.28, 1.28], 0.11, palette.steel, pz, robot);
  for (const x of [-0.07, 0.27])
    box(palette.dark, [0.06, 0.26, 0.08], [x, 1.1, 1.28], pz, [0, 0, 0], robot);
  label("02 / INDUSTRIAL AUTOMATION", 5, 0.242, -0.6, 5.3);

  // Energy island: battery racks, a compact generator and illuminated power bus.
  const ez = "energy";
  for (let i = 0; i < 3; i++) {
    part(
      rounded,
      palette.teal,
      [0.96, 1.88, 1.0],
      [-7.9 + i * 1.15, 1.16, 6.2],
      ez,
    );
    box(palette.dark, [0.73, 1.43, 0.04], [-7.9 + i * 1.15, 1.17, 6.72], ez);
    for (let j = 0; j < 5; j++) {
      box(
        palette.steel,
        [0.61, 0.2, 0.055],
        [-7.9 + i * 1.15, 0.65 + j * 0.26, 6.75],
        ez,
      );
      box(
        palette.light,
        [0.12, 0.035, 0.07],
        [-7.68 + i * 1.15, 0.65 + j * 0.26, 6.77],
        ez,
      );
    }
  }
  part(rounded, palette.paper, [1.3, 1.1, 1.05], [-3.96, 0.76, 6.2], ez);
  for (let x = -4.4; x < -3.5; x += 0.16)
    box(palette.dark, [0.07, 0.67, 0.03], [x, 0.79, 6.74], ez);
  cyl(palette.steel, 0.045, 0.46, [-3.7, 1.52, 5.94], ez);
  label("03 / ENERGY SYSTEMS", -6.25, 0.24, 7.43, 4.7);
  // OT / IT: connected cabinet and operator console.
  const iz = "connected";
  for (let i = 0; i < 2; i++) {
    part(
      rounded,
      palette.dark,
      [1.1, 2.22, 1.04],
      [4.05 + i * 1.3, 1.36, 6.13],
      iz,
    );
    for (let y = 0.65; y < 2.3; y += 0.27) {
      box(palette.steel, [0.88, 0.19, 0.05], [4.05 + i * 1.3, y, 6.66], iz);
      box(palette.blue, [0.2, 0.035, 0.07], [4.29 + i * 1.3, y, 6.7], iz);
    }
  }
  box(palette.steel, [0.1, 0.91, 0.1], [7, 0.7, 6.2], iz);
  box(palette.dark, [1.33, 0.89, 0.12], [7, 1.38, 6.1], iz, [-0.18, 0, 0]);
  box(palette.glass, [1.14, 0.68, 0.03], [7, 1.39, 6.19], iz, [-0.18, 0, 0]);
  for (let i = 0; i < 5; i++)
    box(
      palette.light,
      [0.07, 0.12 + i * 0.07, 0.025],
      [6.59 + i * 0.18, 1.35, 6.24],
      iz,
    );
  label("04 / CONNECTED MACHINERY", 5.4, 0.24, 7.48, 4.7);
  // Cable routes connect the islands, without expensive glow postprocessing.
  const routes = [
    [
      [-6, 0.28, 5.55],
      [-6, 0.28, 4.9],
      [-8.65, 0.28, 4.9],
      [-8.65, 0.28, -2.4],
      [-7.25, 0.28, -2.4],
    ],
    [
      [4.7, 0.28, 5.5],
      [4.7, 0.28, 4.9],
      [9, 0.28, 4.9],
      [9, 0.28, -4],
      [8.1, 0.28, -4],
    ],
  ];
  for (const route of routes)
    for (let i = 1; i < route.length; i++)
      beam(route[i - 1], route[i], 0.045, palette.teal, null);
  // Warm workshop detail: bench, lumber, planted corners and bollards.
  box(palette.wood, [2.1, 0.12, 0.65], [-8.9, 1, -5.5]);
  for (const x of [-9.7, -8.1])
    box(palette.dark, [0.11, 0.85, 0.48], [x, 0.53, -5.5]);
  for (let i = 0; i < 4; i++)
    box(palette.wood, [1.8, 0.13, 0.25], [-8.9, 0.32 + i * 0.13, -6.2]);
  for (const [x, z] of [
    [-9, -7],
    [-9, 7],
    [9, 7],
    [9, -7],
  ]) {
    part(rounded, palette.dark, [0.65, 0.46, 0.65], [x, 0.46, z]);
    const geo = new THREE.IcosahedronGeometry(0.58, 0);
    geometries.add(geo);
    part(geo, palette.green, [0.85, 1.35, 0.85], [x, 1.02, z]);
  }
  for (const x of [-9, 9])
    for (const z of [2.1, 5.9]) {
      cyl(palette.dark, 0.075, 0.55, [x, 0.48, z]);
      cyl(palette.light, 0.081, 0.1, [x, 0.7, z]);
    }
  label("MVE / ENGINEERING WORKSHOP", 0, 0.17, 8.36, 5.5);

  // The robot also batches its rigid parts instead of drawing each joint separately.
  for (const group of [robot]) {
    const localBatches = new Map();
    for (const mesh of [...group.children]) {
      if (!mesh.isMesh) continue;
      const key = mesh.geometry.uuid + mesh.material.uuid;
      if (!localBatches.has(key))
        localBatches.set(key, {
          geometry: mesh.geometry,
          material: mesh.material,
          meshes: [],
        });
      mesh.updateMatrix();
      localBatches.get(key).meshes.push(mesh);
    }
    for (const { geometry, material, meshes } of localBatches.values()) {
      const instance = new THREE.InstancedMesh(
        geometry,
        material,
        meshes.length,
      );
      instance.userData.zones = meshes.map((mesh) => mesh.userData.zone);
      instance.castShadow = true;
      instance.receiveShadow = true;
      meshes.forEach((mesh, index) => {
        instance.setMatrixAt(index, mesh.matrix);
        group.remove(mesh);
      });
      group.add(instance);
    }
  }
  const pickable = [];
  for (const { geometry, mat, matrices, zones } of batches.values()) {
    const mesh = new THREE.InstancedMesh(geometry, mat, matrices.length);
    matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.zones = zones;
    worldRoot.add(mesh);
    pickable.push(mesh);
  }
  worldRoot.traverse((obj) => {
    if (
      obj.isMesh &&
      !pickable.includes(obj) &&
      (obj.userData.zone || obj.userData.zones)
    )
      pickable.push(obj);
  });
  const ambient = new THREE.HemisphereLight("#fff7de", "#66847c", 2.6);
  scene.add(ambient);
  const sun = new THREE.DirectionalLight("#fff3d5", 4.2);
  sun.position.set(-7, 17, 9);
  scene.add(sun);
  sun.castShadow = true;
  sun.shadow.mapSize.set(mobile ? 512 : 1024, mobile ? 512 : 1024);
  Object.assign(sun.shadow.camera, {
    left: -17,
    right: 17,
    top: 17,
    bottom: -17,
    near: 0.5,
    far: 55,
  });
  sun.shadow.normalBias = 0.045;
  sun.shadow.bias = -0.0002;
  sun.shadow.radius = 3;
  const fill = new THREE.DirectionalLight("#b8d6ed", 1.4);
  fill.position.set(10, 6, -8);
  scene.add(fill);
  const floorGeo = new THREE.PlaneGeometry(150, 150);
  geometries.add(floorGeo);
  const floorMat = new THREE.ShadowMaterial({ opacity: 0.13 });
  materials.add(floorMat);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.94;
  floor.receiveShadow = true;
  scene.add(floor);

  let disposed = false,
    frame = 0,
    visible = true,
    motion = false,
    transition = null,
    last = 0,
    phase = 0,
    activeView = "overview";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const views = {
    overview: { position: [29, 26, 32], target: [0, 4.1, 0] },
    crane: { position: [20, 17, 24], target: [0.5, 7, -3.3] },
    cabin: { position: [-1.2, 12.8, 3.1], target: [-4.98, 11.38, -2.85] },
    production: { position: [17, 12, 13], target: [5, 1.4, -3.3] },
    energy: { position: [-16, 10, 20], target: [-5.8, 1.0, 5.4] },
    connected: { position: [15, 10, 21], target: [5, 1.0, 5.8] },
  };
  const craneBounds = new THREE.Box3().setFromObject(crane);
  const viewBounds = {
    // Separate the low workshop and tall crane so empty upper corners do not force
    // an unnecessarily distant overview camera.
    overview: [new THREE.Box3(new THREE.Vector3(-11, -.94, -9), new THREE.Vector3(11, 4, 9)), craneBounds],
    crane: [craneBounds],
    cabin: [new THREE.Box3(new THREE.Vector3(-5.5, 10.3, -3.25), new THREE.Vector3(-4.4, 12.5, -2.35))],
  };
  function resize() {
    if (disposed) return;
    const width = stage.clientWidth,
      height = stage.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (activeView) setView(activeView, true);
    invalidate();
  }
  function invalidate() {
    if (!disposed && !frame && visible && !document.hidden)
      frame = requestAnimationFrame(render);
  }
  function render(time) {
    frame = 0;
    if (disposed || !visible || document.hidden) return;
    if (motion && !transition && time - last < 1000 / 30) {
      invalidate();
      return;
    }
    const dt = Math.min((time - last) / 1000, 0.05);
    last = time;
    if (transition) {
      const progress = Math.min((time - transition.start) / 650, 1),
        ease = 1 - Math.pow(1 - progress, 3);
      camera.position.lerpVectors(transition.from, transition.to, ease);
      controls.target.lerpVectors(
        transition.fromTarget,
        transition.toTarget,
        ease,
      );
      controls.update();
      if (progress === 1) transition = null;
    }
    if (motion) {
      phase += dt;
      const lift = Math.sin(phase * 0.7) * 2;
      hoistHook.position.y = hookRestHeight + lift;
      hoistLines.scale.y = 1 - lift / 11.75;
      robot.rotation.y = Math.sin(phase * 0.8) * 0.3;
      packages.forEach((item, i) => {
        item.position.x = 2.5 + ((i * 1.25 + phase * 0.48) % 4.85);
      });
      renderer.shadowMap.needsUpdate = true;
    }
    renderer.render(scene, camera);
    // Counters make the on-demand rendering behavior inspectable during development.
    canvas.dataset.frames = String(renderer.info.render.frame);
    canvas.dataset.drawCalls = String(renderer.info.render.calls);
    canvas.dataset.triangles = String(renderer.info.render.triangles);
    if (motion || transition) invalidate();
  }
  function setView(zone, immediate = false) {
    activeView = zone;
    controls.minDistance = zone === "cabin" ? 3 : 10;
    const view = views[zone] || views.overview;
    const target = new THREE.Vector3(...view.target),
      position = new THREE.Vector3(...view.position);
    for (const bounds of viewBounds[zone] || [])
      fitViewToBounds(position, target, bounds, camera.fov, camera.aspect);
    if (immediate || reduced.matches) {
      camera.position.copy(position);
      controls.target.copy(target);
      transition = null;
      controls.update();
    } else
      transition = {
        start: performance.now(),
        from: camera.position.clone(),
        to: position,
        fromTarget: controls.target.clone(),
        toTarget: target,
      };
    onZone(zone);
    invalidate();
  }
  function onControlStart() {
    transition = null;
    activeView = null;
  }
  controls.addEventListener("change", invalidate);
  controls.addEventListener("start", onControlStart);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) {
      last = performance.now();
      invalidate();
    } else {
      cancelAnimationFrame(frame);
      frame = 0;
    }
  });
  visibilityObserver.observe(stage);
  function visibilityChanged() {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else {
      last = performance.now();
      invalidate();
    }
  }
  document.addEventListener("visibilitychange", visibilityChanged);
  const raycaster = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  let pointerStart = null;
  function down(event) {
    pointerStart = {
      x: event.clientX,
      y: event.clientY,
      time: performance.now(),
    };
  }
  function up(event) {
    if (
      !pointerStart ||
      Math.hypot(
        event.clientX - pointerStart.x,
        event.clientY - pointerStart.y,
      ) > 6 ||
      performance.now() - pointerStart.time > 450
    )
      return;
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      (-(event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster
      .intersectObjects(pickable, false)
      .find(
        (item) =>
          item.object.userData.zone ||
          item.object.userData.zones?.[item.instanceId],
      );
    if (hit)
      setView(
        hit.object.userData.zone || hit.object.userData.zones[hit.instanceId],
      );
    pointerStart = null;
  }
  function lost(event) {
    event.preventDefault();
    onError();
  }
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("webglcontextlost", lost);
  resize();
  setView("overview", true);
  renderer.shadowMap.needsUpdate = true;
  invalidate();
  return {
    setView,
    zoom(factor) {
      transition = null;
      activeView = null;
      const offset = camera.position.clone().sub(controls.target);
      offset.multiplyScalar(factor).clampLength(10, 120);
      camera.position.copy(controls.target).add(offset);
      controls.update();
      invalidate();
    },
    setMotion(enabled) {
      motion = enabled;
      last = performance.now();
      invalidate();
    },
    setNight(enabled) {
      ambient.intensity = enabled ? 0.6 : 2.6;
      sun.intensity = enabled ? 1.25 : 4.2;
      fill.intensity = enabled ? 2 : 1.4;
      sun.color.set(enabled ? "#83aacb" : "#fff3d5");
      renderer.toneMappingExposure = enabled ? 0.85 : 1.25;
      renderer.shadowMap.needsUpdate = true;
      invalidate();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(frame);
      controls.dispose();
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      document.removeEventListener("visibilitychange", visibilityChanged);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("webglcontextlost", lost);
      for (const geometry of geometries) geometry.dispose();
      for (const mat of materials) mat.dispose();
      for (const tex of textures) tex.dispose();
      scene.traverse((obj) => {
        if (obj.isInstancedMesh) obj.dispose();
      });
      renderer.dispose();
    },
  };
}
