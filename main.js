import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';

// ============================================
// PORTFOLIO DATA - Maarten van Els
// ============================================
const portfolioProjects = {
    robots: [
        {
            title: "City-Boy V2 Control System",
            category: "Mobile Crane Software",
            description: "Led software development for the City-Boy V2 mobile tower crane at Spierings. Focused on improving control software reliability and integrating E-lift functionality. Managed a team of engineers under tight deadlines.",
            tech: ["Simulink", "Codesys", "TIA Portal", "Model-Based Design", "Git"],
            features: ["Improved software reliability", "E-lift integration", "Safety system compliance", "Team of 9 engineers"]
        },
        {
            title: "E-lift V1 Development",
            category: "Electric Crane Systems",
            description: "Contributed to the E-lift V1 project at Spierings, the first project using model-based design. Developed control algorithms enabling cranes to operate electrically via grid power or hybrid diesel solution.",
            tech: ["MATLAB", "Simulink", "PLC-Coder", "Codesys", "Model-Based Design"],
            features: ["Concept to production in 1 year", "300+ cranes in operation", "Grid and hybrid operation", "Model-based development"]
        }
    ],
    cranes: [
        {
            title: "SK2400-R E-lift Electrification",
            category: "Mobile Tower Crane",
            description: "Led software development for electrifying the SK2400-R, one of the largest mobile tower cranes. Implemented safety standard updates and E-lift V2 compatibility for full electric operation.",
            tech: ["Simulink", "TIA Portal", "Safety PLC", "Azure Cloud", "Qt"],
            features: ["Full electric operation", "Safety standard compliance", "E-lift V2 compatible", "Sustainability improvement"]
        },
        {
            title: "E-lift V2 Update",
            category: "Electric Crane Systems",
            description: "Implemented software updates and modifications to the E-lift concept based on City-Boy V2 learnings. Developed new battery pack integration due to supply chain challenges.",
            tech: ["Simulink", "Codesys", "Battery Management", "Azure", "CI/CD"],
            features: ["New battery pack design", "Software improvements", "Supply chain adaptation", "Performance optimization"]
        },
        {
            title: "OTA Firmware Updates",
            category: "Remote Systems",
            description: "Implemented Over-The-Air update capability for control firmware on remote mobile tower cranes, enabling efficient software deployment and maintenance.",
            tech: ["Azure Cloud", "Embedded Systems", "CI/CD", "Jenkins", "Git"],
            features: ["Remote firmware updates", "Cloud connectivity", "Efficient deployment", "Reduced downtime"]
        }
    ],
    plc: [
        {
            title: "Crane Control Logic Development",
            category: "PLC Programming",
            description: "Developed crane control logic using Siemens TIA Portal at Spierings. Created control algorithms for hybrid craning and driving operations with safety features.",
            tech: ["TIA Portal", "Siemens PLC", "Codesys", "Simulink", "Safety PLC"],
            features: ["Hybrid control algorithms", "Safety systems", "Crane and drive logic", "Production implementation"]
        },
        {
            title: "Simulink to Codesys Toolchain",
            category: "Development Tools",
            description: "Created a toolchain to streamline development and deployment of Simulink models into Codesys via PLC-coder, improving development efficiency.",
            tech: ["MATLAB", "Simulink", "PLC-Coder", "Codesys", "Automation"],
            features: ["Automated code generation", "Development efficiency", "Model-based workflow", "Deployment automation"]
        },
        {
            title: "Coca-Cola CIP System",
            category: "Industrial Automation",
            description: "Programmed and implemented a CIP (Clean-in-Place) system for a new production line at Coca-Cola during my time at Van Doren Engineers.",
            tech: ["PLC Programming", "SCADA", "Process Control", "HMI"],
            features: ["New production line", "CIP implementation", "Food industry standards", "System integration"]
        },
        {
            title: "Unidek Production Line Optimization",
            category: "Process Improvement",
            description: "Optimized an existing production line at Unidek by analyzing machine code and applying targeted improvements and adjustments.",
            tech: ["PLC Analysis", "Code Optimization", "Process Control", "Testing"],
            features: ["Production optimization", "Code analysis", "Performance improvements", "Existing system enhancement"]
        },
        {
            title: "FrieslandCampina R&D Support",
            category: "R&D Engineering",
            description: "Assisted the R&D department at FrieslandCampina by improving, executing, and implementing tests and solutions for production processes.",
            tech: ["Testing", "Process Control", "R&D", "Implementation"],
            features: ["R&D collaboration", "Test execution", "Process solutions", "Production support"]
        }
    ],
    conveyors: [
        {
            title: "Dashboard Interface Design",
            category: "HMI Development",
            description: "Designed a user-friendly dashboard interface for crane operations using the Qt framework at Spierings Mobile Cranes.",
            tech: ["Qt Framework", "UI/UX Design", "Data Visualization", "C++"],
            features: ["User-friendly interface", "Real-time data display", "Operator focused", "Modern design"]
        },
        {
            title: "Cloud Data Logging",
            category: "IoT Solutions",
            description: "Developed cloud-based data logging solutions using Azure for monitoring and analyzing crane operations remotely.",
            tech: ["Azure Cloud", "Data Logging", "IoT", "Analytics", "Docker"],
            features: ["Remote monitoring", "Data analytics", "Cloud storage", "Real-time insights"]
        },
        {
            title: "Battery Pack Integration",
            category: "Electrical Systems",
            description: "Designed and integrated new battery packs for electric crane operations, including system architecture and control integration.",
            tech: ["Battery Systems", "Electrical Design", "System Integration", "Testing"],
            features: ["New battery design", "System integration", "Electric operation", "Performance validation"]
        }
    ]
};

// Flatten all projects for easy access
let allProjects = Object.entries(portfolioProjects).flatMap(([category, projects]) =>
    projects.map(p => ({ ...p, categoryKey: category }))
);

// GitHub repositories storage
let githubRepos = [];

// ============================================
// GLOBAL VARIABLES
// ============================================
let scene, camera, renderer, controls, composer;
let clock = new THREE.Clock();
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let interactiveObjects = [];
let animatedObjects = [];
let hoveredObject = null;
let currentProjectIndex = 0;
let currentCategory = 'all';

// FPS Counter
let frameCount = 0;
let lastTime = performance.now();
let fps = 60;

// Day/Night system
let isNightMode = false;
let dayLights = [];
let nightLights = [];
let lightTransition = 0; // 0 = day, 1 = night
let targetTransition = 0;

// Color Palette - Modern Industrial (Daylight)
const COLORS = {
    // Ground & Base
    ground: 0x5a7a5a,
    grass: 0x6a9a6a,
    concrete: 0x9a9aaa,
    asphalt: 0x606670,

    // Structures
    steel: 0x8a95a8,
    steelLight: 0xaabbcc,
    steelDark: 0x6a7a88,

    // Accent Colors
    primary: 0x6366f1,
    primaryLight: 0x818cf8,
    accent: 0xf59e0b,
    accentLight: 0xfbbf24,

    // Industrial
    yellow: 0xfbbf24,
    orange: 0xf97316,
    red: 0xef4444,
    blue: 0x3b82f6,
    green: 0x10b981,

    // Neutrals
    white: 0xf8fafc,
    black: 0x0f172a,

    // Special
    glow: 0x6366f1,
    warning: 0xfbbf24,
    glass: 0x94a3b8
};

// ============================================
// INITIALIZATION
// ============================================
function init() {
    setupScene();
    setupCamera();
    setupRenderer();
    setupControls();
    setupLighting();
    setupPostProcessing();

    // Build world
    createGround();
    createFactoryComplex();
    createConveyorSystem();
    createRobotArms();
    createCranes();
    createControlCenter();
    createStorageArea();
    createEnvironment();
    createAtmosphere();

    // UI Setup
    setupEventListeners();
    populateProjectsPanel();
    fetchGitHubRepos(); // Fetch GitHub repos asynchronously

    // Start animation
    animate();

    // Hide loading screen
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        document.getElementById('loader-status').textContent = 'Ready';
    }, 2200);
}

function setupScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x6ca0dc);
    scene.fog = new THREE.FogExp2(0x6ca0dc, 0.003);
}

function setupCamera() {
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(80, 50, 80);
}

function setupRenderer() {
    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('canvas'),
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 2.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
}

function setupControls() {
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1;
    controls.minDistance = 25;
    controls.maxDistance = 180;
    controls.target.set(0, 8, 0);
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;
}

function setupLighting() {
    // === DAY LIGHTS ===
    // Ambient - very bright base lighting
    const ambient = new THREE.AmbientLight(0xffffff, 1.0);
    ambient.userData.dayIntensity = 1.0;
    ambient.userData.nightIntensity = 0.15;
    scene.add(ambient);
    dayLights.push(ambient);

    // Main directional (sun) - bright daylight
    const mainLight = new THREE.DirectionalLight(0xfffef5, 2.5);
    mainLight.position.set(60, 100, 40);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 10;
    mainLight.shadow.camera.far = 300;
    mainLight.shadow.camera.left = -100;
    mainLight.shadow.camera.right = 100;
    mainLight.shadow.camera.top = 100;
    mainLight.shadow.camera.bottom = -100;
    mainLight.shadow.bias = -0.0001;
    mainLight.userData.dayIntensity = 2.5;
    mainLight.userData.nightIntensity = 0.1;
    scene.add(mainLight);
    dayLights.push(mainLight);

    // Secondary sun light from different angle
    const secondLight = new THREE.DirectionalLight(0xfff8e8, 1.0);
    secondLight.position.set(-30, 80, 60);
    secondLight.userData.dayIntensity = 1.0;
    secondLight.userData.nightIntensity = 0.05;
    scene.add(secondLight);
    dayLights.push(secondLight);

    // Fill light - bright blue sky bounce
    const fillLight = new THREE.DirectionalLight(0xaaccff, 0.8);
    fillLight.position.set(-40, 30, -40);
    fillLight.userData.dayIntensity = 0.8;
    fillLight.userData.nightIntensity = 0.1;
    scene.add(fillLight);
    dayLights.push(fillLight);

    // Back fill - rim light
    const backFill = new THREE.DirectionalLight(0xffffee, 0.6);
    backFill.position.set(0, 50, -80);
    backFill.userData.dayIntensity = 0.6;
    backFill.userData.nightIntensity = 0.05;
    scene.add(backFill);
    dayLights.push(backFill);

    // Front fill
    const frontFill = new THREE.DirectionalLight(0xffffff, 0.5);
    frontFill.position.set(0, 40, 100);
    frontFill.userData.dayIntensity = 0.5;
    frontFill.userData.nightIntensity = 0.05;
    scene.add(frontFill);
    dayLights.push(frontFill);

    // Hemisphere - bright sky and ground
    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x90a060, 1.2);
    hemi.userData.dayIntensity = 1.2;
    hemi.userData.nightIntensity = 0.2;
    hemi.userData.dayColor = 0x87ceeb;
    hemi.userData.nightColor = 0x1a1a3a;
    scene.add(hemi);
    dayLights.push(hemi);

    // === NIGHT LIGHTS (Factory lights, street lights) ===
    createFactoryLights();
}

function createFactoryLights() {
    // Factory interior lights - warm industrial
    const factoryLightPositions = [
        { x: -25, z: -15 }, { x: 0, z: -15 }, { x: 25, z: -15 },
        { x: -25, z: 5 }, { x: 0, z: 5 }, { x: 25, z: 5 }
    ];

    factoryLightPositions.forEach(pos => {
        // Point light
        const light = new THREE.PointLight(0xffaa55, 0, 30);
        light.position.set(pos.x, 22, pos.z);
        light.userData.nightIntensity = 2.5;
        scene.add(light);
        nightLights.push(light);

        // Light fixture (visible lamp)
        const fixtureGeom = new THREE.CylinderGeometry(0.8, 1.2, 0.5, 8);
        const fixtureMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            metalness: 0.8,
            roughness: 0.3
        });
        const fixture = new THREE.Mesh(fixtureGeom, fixtureMat);
        fixture.position.set(pos.x, 23.5, pos.z);
        scene.add(fixture);

        // Light bulb glow
        const bulbGeom = new THREE.SphereGeometry(0.4, 8, 8);
        const bulbMat = new THREE.MeshStandardMaterial({
            color: 0xffaa55,
            emissive: 0xffaa55,
            emissiveIntensity: 0
        });
        const bulb = new THREE.Mesh(bulbGeom, bulbMat);
        bulb.position.set(pos.x, 23, pos.z);
        bulb.userData.nightEmissive = 2.0;
        scene.add(bulb);
        nightLights.push({ type: 'bulb', mesh: bulb });
    });

    // Outdoor street/pole lights
    const poleLightPositions = [
        { x: -55, z: 30 }, { x: -55, z: -10 },
        { x: 55, z: 30 }, { x: 55, z: -10 },
        { x: 0, z: 45 }, { x: -30, z: 45 }, { x: 30, z: 45 }
    ];

    poleLightPositions.forEach(pos => {
        // Light pole
        const poleGeom = new THREE.CylinderGeometry(0.2, 0.3, 12, 6);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.7 });
        const pole = new THREE.Mesh(poleGeom, poleMat);
        pole.position.set(pos.x, 6, pos.z);
        scene.add(pole);

        // Light head
        const headGeom = new THREE.BoxGeometry(1.5, 0.4, 1);
        const head = new THREE.Mesh(headGeom, poleMat);
        head.position.set(pos.x, 12, pos.z);
        scene.add(head);

        // Point light
        const light = new THREE.PointLight(0xffeedd, 0, 25);
        light.position.set(pos.x, 11.5, pos.z);
        light.userData.nightIntensity = 1.8;
        scene.add(light);
        nightLights.push(light);

        // Bulb glow
        const bulbGeom = new THREE.SphereGeometry(0.3, 6, 6);
        const bulbMat = new THREE.MeshStandardMaterial({
            color: 0xffeedd,
            emissive: 0xffeedd,
            emissiveIntensity: 0
        });
        const bulb = new THREE.Mesh(bulbGeom, bulbMat);
        bulb.position.set(pos.x, 11.5, pos.z);
        bulb.userData.nightEmissive = 1.5;
        scene.add(bulb);
        nightLights.push({ type: 'bulb', mesh: bulb });
    });

    // Control room interior light
    const controlLight = new THREE.PointLight(0x4488ff, 0, 15);
    controlLight.position.set(35, 8, 30);
    controlLight.userData.nightIntensity = 2.0;
    scene.add(controlLight);
    nightLights.push(controlLight);

    // Warning lights on cranes (always visible but brighter at night)
    const warningLight = new THREE.PointLight(0xff4444, 0, 20);
    warningLight.position.set(65, 55, -15);
    warningLight.userData.nightIntensity = 1.5;
    scene.add(warningLight);
    nightLights.push(warningLight);
}

function toggleDayNight() {
    isNightMode = !isNightMode;
    targetTransition = isNightMode ? 1 : 0;

    // Toggle dark theme on UI
    const uiOverlay = document.getElementById('ui-overlay');
    if (isNightMode) {
        uiOverlay.classList.add('dark-theme');
    } else {
        uiOverlay.classList.remove('dark-theme');
    }

    // Update button icon
    const iconSvg = document.getElementById('daynight-icon');
    if (isNightMode) {
        // Moon icon
        iconSvg.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    } else {
        // Sun icon
        iconSvg.innerHTML = `
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        `;
    }
}

function updateDayNightTransition() {
    // Smooth transition
    const speed = 0.02;
    if (Math.abs(lightTransition - targetTransition) > 0.001) {
        lightTransition += (targetTransition - lightTransition) * speed;

        // Update sky color
        const dayColor = new THREE.Color(0x6ca0dc);
        const nightColor = new THREE.Color(0x0a0a1a);
        const currentColor = dayColor.lerp(nightColor, lightTransition);
        scene.background = currentColor;
        scene.fog.color = currentColor;

        // Update day lights
        dayLights.forEach(light => {
            const dayInt = light.userData.dayIntensity || 1;
            const nightInt = light.userData.nightIntensity || 0;
            light.intensity = dayInt + (nightInt - dayInt) * lightTransition;

            // Update hemisphere light color
            if (light.isHemisphereLight && light.userData.dayColor) {
                const dayC = new THREE.Color(light.userData.dayColor);
                const nightC = new THREE.Color(light.userData.nightColor);
                light.color = dayC.lerp(nightC, lightTransition);
            }
        });

        // Update night lights
        nightLights.forEach(light => {
            if (light.type === 'bulb') {
                // Bulb emissive
                const nightEmissive = light.mesh.userData.nightEmissive || 1;
                light.mesh.material.emissiveIntensity = nightEmissive * lightTransition;
            } else if (light.isPointLight) {
                // Point lights
                const nightInt = light.userData.nightIntensity || 1;
                light.intensity = nightInt * lightTransition;
            }
        });
    }
}

function setupPostProcessing() {
    composer = new EffectComposer(renderer);

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.25,  // strength - reduced for performance
        0.3,   // radius - reduced
        0.9    // threshold - higher = less bloom
    );
    composer.addPass(bloomPass);

    // SMAA pass disabled for better performance
    // Uncomment if you need smoother edges:
    // const smaaPass = new SMAAPass(
    //     window.innerWidth * renderer.getPixelRatio(),
    //     window.innerHeight * renderer.getPixelRatio()
    // );
    // composer.addPass(smaaPass);
}

// ============================================
// GEOMETRY HELPERS
// ============================================
function createBox(w, h, d, color, x, y, z, options = {}) {
    const geometry = new THREE.BoxGeometry(w, h, d);

    let material;
    if (options.emissive) {
        material = new THREE.MeshStandardMaterial({
            color,
            emissive: options.emissive,
            emissiveIntensity: options.emissiveIntensity || 0.5,
            metalness: options.metalness || 0,
            roughness: options.roughness || 0.8
        });
    } else {
        material = new THREE.MeshStandardMaterial({
            color,
            metalness: options.metalness || 0.1,
            roughness: options.roughness || 0.8
        });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = !options.noShadow;
    mesh.receiveShadow = true;

    return mesh;
}

function createCylinder(radiusTop, radiusBottom, height, segments, color, x, y, z, options = {}) {
    const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);
    const material = new THREE.MeshStandardMaterial({
        color,
        metalness: options.metalness || 0.3,
        roughness: options.roughness || 0.6
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
}

// ============================================
// GROUND & ENVIRONMENT
// ============================================
function createGround() {
    // Main ground plane
    const groundGeo = new THREE.PlaneGeometry(400, 400);
    const groundMat = new THREE.MeshStandardMaterial({
        color: COLORS.ground,
        roughness: 0.9,
        metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Factory floor - polished concrete
    const floorGeo = new THREE.BoxGeometry(120, 0.5, 80);
    const floorMat = new THREE.MeshStandardMaterial({
        color: COLORS.concrete,
        roughness: 0.4,
        metalness: 0.2
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.position.set(0, 0.25, 0);
    floor.receiveShadow = true;
    scene.add(floor);

    // Floor markings
    createFloorMarkings();

    // Roads
    createRoads();
}

function createFloorMarkings() {
    const markingMat = new THREE.MeshStandardMaterial({
        color: COLORS.yellow,
        roughness: 0.6
    });

    // Safety walkway lines
    const walkways = [
        { x: -55, z: 0, w: 0.3, d: 70 },
        { x: 55, z: 0, w: 0.3, d: 70 },
        { x: 0, z: -35, w: 110, d: 0.3 },
        { x: 0, z: 35, w: 110, d: 0.3 }
    ];

    walkways.forEach(w => {
        const line = new THREE.Mesh(
            new THREE.BoxGeometry(w.w, 0.05, w.d),
            markingMat
        );
        line.position.set(w.x, 0.53, w.z);
        line.receiveShadow = true;
        scene.add(line);
    });

    // Robot cell boundaries
    const cellPositions = [
        { x: -10, z: -15 },
        { x: 10, z: -15 }
    ];

    cellPositions.forEach(pos => {
        // Corner markers
        for (let dx = -4; dx <= 4; dx += 8) {
            for (let dz = -4; dz <= 4; dz += 8) {
                const corner = new THREE.Mesh(
                    new THREE.BoxGeometry(1, 0.05, 1),
                    new THREE.MeshStandardMaterial({
                        color: COLORS.warning,
                        emissive: COLORS.warning,
                        emissiveIntensity: 0.2
                    })
                );
                corner.position.set(pos.x + dx, 0.53, pos.z + dz);
                scene.add(corner);
            }
        }
    });
}

function createRoads() {
    // Main access road
    const roadGeo = new THREE.BoxGeometry(15, 0.2, 200);
    const roadMat = new THREE.MeshStandardMaterial({
        color: COLORS.asphalt,
        roughness: 0.9
    });
    const road = new THREE.Mesh(roadGeo, roadMat);
    road.position.set(-70, 0.1, 0);
    road.receiveShadow = true;
    scene.add(road);

    // Road markings
    for (let z = -95; z < 100; z += 12) {
        const marking = new THREE.Mesh(
            new THREE.BoxGeometry(0.4, 0.05, 5),
            new THREE.MeshStandardMaterial({ color: 0xffffff })
        );
        marking.position.set(-70, 0.25, z);
        scene.add(marking);
    }
}

// ============================================
// FACTORY COMPLEX
// ============================================
function createFactoryComplex() {
    const factory = new THREE.Group();

    // Main building structure
    createMainBuilding(factory);
    createRoof(factory);
    createSmokestacks();

    scene.add(factory);
}

function createMainBuilding(parent) {
    // Steel frame structure
    const frameColor = COLORS.steelDark;
    const panelColor = COLORS.steel;

    // Back wall - solid with panels
    for (let x = -45; x <= 45; x += 6) {
        // Vertical columns
        const column = createBox(1.5, 25, 1.5, frameColor, x, 12.5, -35);
        column.material.metalness = 0.6;
        column.material.roughness = 0.4;
        parent.add(column);
    }

    // Wall panels
    for (let x = -42; x <= 42; x += 6) {
        const panel = createBox(5.5, 22, 0.3, panelColor, x, 12, -35.5);
        parent.add(panel);
    }

    // Side walls with windows
    for (let z = -35; z <= 25; z += 6) {
        // Left side columns
        const colL = createBox(1.5, 25, 1.5, frameColor, -46, 12.5, z);
        colL.material.metalness = 0.6;
        parent.add(colL);

        // Right side columns
        const colR = createBox(1.5, 25, 1.5, frameColor, 46, 12.5, z);
        colR.material.metalness = 0.6;
        parent.add(colR);

        // Window panels
        if (z > -30 && z < 20) {
            // Left windows
            const winL = createBox(0.3, 8, 5, COLORS.glass, -46.5, 14, z);
            winL.material = new THREE.MeshStandardMaterial({
                color: 0x6699cc,
                transparent: true,
                opacity: 0.4,
                metalness: 0.9,
                roughness: 0.1
            });
            parent.add(winL);

            // Right windows
            const winR = createBox(0.3, 8, 5, COLORS.glass, 46.5, 14, z);
            winR.material = winL.material.clone();
            parent.add(winR);
        }
    }

    // Horizontal beams
    for (let y = 8; y <= 24; y += 8) {
        const beamBack = createBox(92, 1, 1, frameColor, 0, y, -35);
        parent.add(beamBack);

        const beamL = createBox(1, 1, 62, frameColor, -46, y, -5);
        parent.add(beamL);

        const beamR = createBox(1, 1, 62, frameColor, 46, y, -5);
        parent.add(beamR);
    }
}

function createRoof(parent) {
    // Main roof structure
    const roofMat = new THREE.MeshStandardMaterial({
        color: COLORS.steelDark,
        metalness: 0.7,
        roughness: 0.3
    });

    // Flat sections with skylights
    for (let x = -40; x <= 40; x += 20) {
        const roofSection = new THREE.Mesh(
            new THREE.BoxGeometry(19, 0.5, 60),
            roofMat
        );
        roofSection.position.set(x, 25, -5);
        roofSection.receiveShadow = true;
        parent.add(roofSection);

        // Skylight
        const skylight = new THREE.Mesh(
            new THREE.BoxGeometry(8, 4, 20),
            new THREE.MeshStandardMaterial({
                color: 0x88aacc,
                transparent: true,
                opacity: 0.5,
                metalness: 0.9,
                roughness: 0.1
            })
        );
        skylight.position.set(x, 27, -5);
        parent.add(skylight);
    }
}

function createSmokestacks() {
    const stackPositions = [
        { x: -35, z: -30 },
        { x: 35, z: -30 }
    ];

    stackPositions.forEach((pos, idx) => {
        const stack = new THREE.Group();

        // Main stack cylinder
        const mainStack = createCylinder(2.5, 3, 40, 16, COLORS.steelLight, 0, 45, 0);
        mainStack.material.metalness = 0.7;
        stack.add(mainStack);

        // Red/white warning stripes
        for (let y = 0; y < 40; y += 8) {
            const stripe = createCylinder(2.6, 3.1, 4, 16, y % 16 === 0 ? COLORS.red : COLORS.white, 0, 27 + y, 0);
            stack.add(stripe);
        }

        // Top rim
        const rim = createCylinder(3, 2.5, 2, 16, COLORS.steelDark, 0, 66, 0);
        stack.add(rim);

        // Warning lights
        const light = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 8, 8),
            new THREE.MeshStandardMaterial({
                color: COLORS.red,
                emissive: COLORS.red,
                emissiveIntensity: 2
            })
        );
        light.position.set(0, 67, 0);
        stack.add(light);

        // Smoke particles
        createSmokeParticles(pos.x, 68, pos.z);

        stack.position.set(pos.x, 0, pos.z);
        scene.add(stack);
    });
}

function createSmokeParticles(x, y, z) {
    const particleCount = 15;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 3;
        positions[i * 3 + 1] = Math.random() * 15;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
        sizes[i] = Math.random() * 2 + 1;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
        color: 0x888888,
        size: 2,
        transparent: true,
        opacity: 0.4,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    particles.position.set(x, y, z);
    scene.add(particles);

    animatedObjects.push({
        type: 'smoke',
        mesh: particles,
        positions: positions
    });
}

// ============================================
// CONVEYOR SYSTEM
// ============================================
function createConveyorSystem() {
    const conveyorGroup = new THREE.Group();

    // Main conveyor loop
    const segments = [
        { start: { x: -25, z: 15 }, end: { x: 25, z: 15 } },
        { start: { x: 25, z: 15 }, end: { x: 25, z: -5 } },
        { start: { x: 25, z: -5 }, end: { x: -25, z: -5 } },
        { start: { x: -25, z: -5 }, end: { x: -25, z: 15 } }
    ];

    segments.forEach((seg, idx) => {
        createConveyorSegment(conveyorGroup, seg.start, seg.end, idx);
    });

    // Packages on conveyor
    createConveyorPackages(conveyorGroup);

    // Interactive marker
    const marker = createInteractiveMarker(0, 8, 15, 'conveyors');
    conveyorGroup.add(marker);

    scene.add(conveyorGroup);
}

function createConveyorSegment(parent, start, end, index) {
    const dx = end.x - start.x;
    const dz = end.z - start.z;
    const length = Math.sqrt(dx * dx + dz * dz);
    const angle = Math.atan2(dz, dx);

    const segmentGroup = new THREE.Group();

    // Frame
    const frame = createBox(length, 1, 4, COLORS.steelDark, 0, 3, 0, { metalness: 0.6 });
    frame.rotation.y = -angle;
    segmentGroup.add(frame);

    // Belt surface
    const belt = createBox(length - 0.5, 0.2, 3, 0x2a2a2a, 0, 3.6, 0, { roughness: 0.95 });
    belt.rotation.y = -angle;
    segmentGroup.add(belt);

    // Side rails
    [-1.8, 1.8].forEach(offset => {
        const rail = createBox(length, 0.5, 0.3, COLORS.yellow, 0, 4, 0);
        rail.rotation.y = -angle;
        rail.position.z = offset * Math.cos(angle);
        rail.position.x = offset * Math.sin(angle);
        segmentGroup.add(rail);
    });

    // Support legs
    const legCount = Math.floor(length / 8);
    for (let i = 0; i <= legCount; i++) {
        const t = i / legCount;
        const legX = start.x + dx * t;
        const legZ = start.z + dz * t;

        [-1.5, 1.5].forEach(offset => {
            const leg = createBox(0.4, 3, 0.4, COLORS.steelLight,
                legX + offset * Math.sin(angle),
                1.5,
                legZ + offset * Math.cos(angle)
            );
            parent.add(leg);
        });
    }

    segmentGroup.position.set((start.x + end.x) / 2, 0, (start.z + end.z) / 2);
    parent.add(segmentGroup);
}

function createConveyorPackages(parent) {
    const packageColors = [COLORS.orange, COLORS.blue, COLORS.green, COLORS.primary];

    for (let i = 0; i < 12; i++) {
        const pkg = createBox(
            1.5 + Math.random() * 0.5,
            1 + Math.random() * 0.5,
            1.5 + Math.random() * 0.5,
            packageColors[i % packageColors.length],
            -20 + i * 4, 4.5, 15
        );
        pkg.userData.packageIndex = i;
        parent.add(pkg);

        animatedObjects.push({
            type: 'package',
            mesh: pkg,
            pathIndex: 0,
            progress: i * 0.08
        });
    }
}

// ============================================
// ROBOT ARMS
// ============================================
function createRobotArms() {
    const robotPositions = [
        { x: -10, z: -15, color: COLORS.orange },
        { x: 10, z: -15, color: COLORS.blue }
    ];

    robotPositions.forEach((pos, idx) => {
        const robot = createRobotArm(pos.color);
        robot.position.set(pos.x, 0, pos.z);
        scene.add(robot);

        // Store animation reference
        animatedObjects.push({
            type: 'robot',
            group: robot,
            parts: robot.userData.parts,
            phase: idx * Math.PI
        });
    });

    // Interactive marker
    const marker = createInteractiveMarker(0, 12, -15, 'robots');
    scene.add(marker);
}

function createRobotArm(accentColor) {
    const robot = new THREE.Group();
    const parts = {};

    // Base platform
    const platform = createBox(6, 0.5, 6, COLORS.steelDark, 0, 0.25, 0, { metalness: 0.7 });
    robot.add(platform);

    // Rotating base
    const base = createCylinder(1.8, 2, 1.5, 16, accentColor, 0, 1.25, 0, { metalness: 0.5 });
    robot.add(base);

    // Base housing
    const housing = createBox(3, 2, 3, COLORS.steelLight, 0, 2.5, 0, { metalness: 0.6 });
    robot.add(housing);

    // Lower arm group
    parts.lowerArm = new THREE.Group();
    const lowerArmMesh = createBox(1.2, 7, 1.2, accentColor, 0, 3.5, 0, { metalness: 0.4 });
    parts.lowerArm.add(lowerArmMesh);
    parts.lowerArm.position.set(0, 3.5, 0);
    robot.add(parts.lowerArm);

    // Elbow joint
    const elbow = createCylinder(0.8, 0.8, 1.5, 12, COLORS.steelDark, 0, 7, 0);
    elbow.rotation.z = Math.PI / 2;
    parts.lowerArm.add(elbow);

    // Upper arm group
    parts.upperArm = new THREE.Group();
    const upperArmMesh = createBox(1, 5, 1, accentColor, 0, 2.5, 0, { metalness: 0.4 });
    parts.upperArm.add(upperArmMesh);
    parts.upperArm.position.set(0, 7, 0);
    parts.lowerArm.add(parts.upperArm);

    // Wrist
    const wrist = createCylinder(0.5, 0.5, 0.8, 12, COLORS.steelDark, 0, 5.2, 0);
    parts.upperArm.add(wrist);

    // End effector / gripper
    parts.gripper = new THREE.Group();
    const gripperBase = createBox(1.2, 0.8, 1.2, COLORS.steelLight, 0, 0, 0, { metalness: 0.7 });
    parts.gripper.add(gripperBase);

    // Gripper fingers
    [-0.4, 0.4].forEach(offset => {
        const finger = createBox(0.2, 1.2, 0.4, COLORS.steelDark, offset, -0.6, 0, { metalness: 0.8 });
        parts.gripper.add(finger);
    });

    parts.gripper.position.set(0, 5.6, 0);
    parts.upperArm.add(parts.gripper);

    // Safety fence posts
    const fenceRadius = 5;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
        const postX = Math.cos(angle) * fenceRadius;
        const postZ = Math.sin(angle) * fenceRadius;

        const post = createBox(0.2, 4, 0.2, COLORS.yellow, postX, 2, postZ);
        robot.add(post);

        // Top cap
        const cap = createBox(0.3, 0.1, 0.3, COLORS.yellow, postX, 4.05, postZ);
        cap.material.emissive = new THREE.Color(COLORS.warning);
        cap.material.emissiveIntensity = 0.3;
        robot.add(cap);
    }

    robot.userData.parts = parts;
    return robot;
}

// ============================================
// CRANES
// ============================================
function createCranes() {
    // Tower crane - moved further right to avoid building
    createTowerCrane(65, 0, -15);

    // Gantry crane - positioned near conveyor belt to pick up packages
    createGantryCrane(0, 0, 5);

    // Interactive marker - updated position for moved crane
    const marker = createInteractiveMarker(65, 55, -15, 'cranes');
    scene.add(marker);
}

function createTowerCrane(x, y, z) {
    const crane = new THREE.Group();

    // Base
    const base = createBox(8, 2, 8, COLORS.concrete, 0, 1, 0);
    crane.add(base);

    // Tower lattice structure
    for (let h = 0; h < 50; h += 3) {
        // Corner posts
        [[-1.5, -1.5], [1.5, -1.5], [-1.5, 1.5], [1.5, 1.5]].forEach(([px, pz]) => {
            const post = createBox(0.4, 3, 0.4, COLORS.yellow, px, h + 3.5, pz, { metalness: 0.5 });
            crane.add(post);
        });

        // Cross braces
        if (h % 6 === 0) {
            const brace1 = createBox(3.5, 0.2, 0.2, COLORS.yellow, 0, h + 2, -1.5);
            const brace2 = createBox(3.5, 0.2, 0.2, COLORS.yellow, 0, h + 2, 1.5);
            const brace3 = createBox(0.2, 0.2, 3.5, COLORS.yellow, -1.5, h + 2, 0);
            const brace4 = createBox(0.2, 0.2, 3.5, COLORS.yellow, 1.5, h + 2, 0);
            crane.add(brace1, brace2, brace3, brace4);
        }
    }

    // Jib (horizontal arm)
    const jib = new THREE.Group();

    // Main jib
    for (let i = 0; i < 35; i += 2) {
        const jibSection = createBox(2, 1.5, 2, COLORS.yellow, i - 5, 0, 0, { metalness: 0.5 });
        jib.add(jibSection);
    }

    // Counter jib
    for (let i = 0; i > -15; i -= 2) {
        const counterSection = createBox(2, 1.5, 2, COLORS.yellow, i - 5, 0, 0, { metalness: 0.5 });
        jib.add(counterSection);
    }

    // Counterweight
    const counterweight = createBox(5, 4, 3, COLORS.concrete, -17, -1, 0);
    jib.add(counterweight);

    // Trolley
    const trolley = new THREE.Group();
    const trolleyBase = createBox(3, 1.5, 2.5, COLORS.red, 0, -1.5, 0);
    trolley.add(trolleyBase);

    // Cable
    const cable = createBox(0.1, 18, 0.1, COLORS.steelDark, 0, -11, 0);
    trolley.add(cable);

    // Hook block
    const hookBlock = createBox(1.5, 2, 1.5, COLORS.orange, 0, -20, 0);
    hookBlock.material.emissive = new THREE.Color(COLORS.orange);
    hookBlock.material.emissiveIntensity = 0.2;
    trolley.add(hookBlock);

    trolley.position.x = 18;
    jib.add(trolley);

    jib.position.y = 53;
    crane.add(jib);

    // Operator cabin
    const cabin = createBox(3, 3, 3, COLORS.glass, 0, 51, 2.5);
    cabin.material = new THREE.MeshStandardMaterial({
        color: 0x88aacc,
        transparent: true,
        opacity: 0.6,
        metalness: 0.9,
        roughness: 0.1
    });
    crane.add(cabin);

    // Warning light on top
    const warningLight = new THREE.Mesh(
        new THREE.SphereGeometry(0.4, 8, 8),
        new THREE.MeshStandardMaterial({
            color: COLORS.red,
            emissive: COLORS.red,
            emissiveIntensity: 2
        })
    );
    warningLight.position.set(0, 55, 0);
    crane.add(warningLight);

    crane.position.set(x, y, z);
    scene.add(crane);

    // Animation
    animatedObjects.push({
        type: 'crane',
        jib: jib,
        trolley: trolley
    });
}

function createGantryCrane(x, y, z) {
    const gantry = new THREE.Group();

    // Legs
    const legPositions = [[-12, -4], [-12, 4], [12, -4], [12, 4]];
    legPositions.forEach(([lx, lz]) => {
        const leg = createBox(1.5, 18, 1.5, COLORS.blue, lx, 9, lz, { metalness: 0.5 });
        gantry.add(leg);

        // Diagonal bracing
        const brace = createBox(0.3, 12, 0.3, COLORS.blue, lx * 0.7, 6, lz);
        brace.rotation.z = lx > 0 ? 0.3 : -0.3;
        gantry.add(brace);
    });

    // Top beam
    const beam = createBox(26, 2.5, 6, COLORS.blue, 0, 19, 0, { metalness: 0.6 });
    gantry.add(beam);

    // Rails on beam
    [-2, 2].forEach(offset => {
        const rail = createBox(26, 0.3, 0.5, COLORS.steelDark, 0, 20.4, offset);
        gantry.add(rail);
    });

    // Hoist trolley (animated)
    const trolley = new THREE.Group();
    const hoistBody = createBox(4, 2, 4, COLORS.orange, 0, 0, 0);
    trolley.add(hoistBody);
    trolley.position.set(0, 19, 0);
    gantry.add(trolley);

    // Cable (animated - variable length)
    const cableGeom = new THREE.BoxGeometry(0.15, 1, 0.15);
    const cableMat = new THREE.MeshStandardMaterial({ color: COLORS.steelDark });
    const cable = new THREE.Mesh(cableGeom, cableMat);
    cable.position.set(0, -1, 0);
    trolley.add(cable);

    // Hook with gripper
    const hookGroup = new THREE.Group();
    const hookBase = createBox(2.5, 1.5, 2.5, COLORS.yellow, 0, 0, 0);
    hookGroup.add(hookBase);

    // Gripper arms
    const gripperL = createBox(0.3, 1.5, 0.3, COLORS.steelDark, -1, -0.75, 0);
    const gripperR = createBox(0.3, 1.5, 0.3, COLORS.steelDark, 1, -0.75, 0);
    hookGroup.add(gripperL, gripperR);
    hookGroup.position.set(0, -2.5, 0);
    trolley.add(hookGroup);

    // Block being carried
    const cargoBlock = createBox(2, 2, 2, COLORS.primary, 0, -2.5, 0);
    hookGroup.add(cargoBlock);

    gantry.position.set(x, y, z);
    scene.add(gantry);

    // Register for animation
    animatedObjects.push({
        type: 'gantry',
        trolley: trolley,
        cable: cable,
        hook: hookGroup,
        cargo: cargoBlock,
        baseX: x,
        baseZ: z,
        phase: 0
    });
}

// ============================================
// CONTROL CENTER
// ============================================
function createControlCenter() {
    const control = new THREE.Group();

    // Building structure
    for (let layer = 0; layer < 3; layer++) {
        const width = 14 - layer * 1;
        const depth = 10 - layer * 0.5;
        const height = 4;

        const floor = createBox(width, height, depth,
            layer === 0 ? COLORS.concrete : COLORS.steelLight,
            0, layer * height + height/2, 0,
            { metalness: layer > 0 ? 0.5 : 0.2 }
        );
        control.add(floor);

        // Windows
        if (layer > 0) {
            for (let side = -1; side <= 1; side += 2) {
                const window = createBox(width * 0.8, height * 0.6, 0.2, COLORS.glass,
                    0, layer * height + height/2, side * depth/2);
                window.material = new THREE.MeshStandardMaterial({
                    color: 0x4488cc,
                    transparent: true,
                    opacity: 0.5,
                    emissive: 0x224466,
                    emissiveIntensity: 0.3,
                    metalness: 0.9,
                    roughness: 0.1
                });
                control.add(window);
            }
        }
    }

    // Satellite dish
    const dishGeom = new THREE.SphereGeometry(2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const dish = new THREE.Mesh(dishGeom, new THREE.MeshStandardMaterial({
        color: COLORS.white,
        metalness: 0.8,
        roughness: 0.2,
        side: THREE.DoubleSide
    }));
    dish.rotation.x = Math.PI / 3;
    dish.position.set(4, 13, 0);
    control.add(dish);

    // Antenna
    const antenna = createBox(0.15, 5, 0.15, COLORS.steelDark, -4, 15, 0);
    control.add(antenna);

    // Blinking light
    const light = new THREE.Mesh(
        new THREE.SphereGeometry(0.3, 8, 8),
        new THREE.MeshStandardMaterial({
            color: COLORS.red,
            emissive: COLORS.red,
            emissiveIntensity: 1
        })
    );
    light.position.set(-4, 17.5, 0);
    control.add(light);

    animatedObjects.push({
        type: 'blink',
        mesh: light
    });

    // Interactive marker
    const marker = createInteractiveMarker(0, 15, 0, 'plc');
    control.add(marker);

    control.position.set(35, 0, 25);
    scene.add(control);
}

// ============================================
// STORAGE AREA
// ============================================
function createStorageArea() {
    // Storage tanks
    const tankPositions = [
        { x: -50, z: -20, color: COLORS.white },
        { x: -50, z: -8, color: COLORS.blue },
        { x: -50, z: 4, color: COLORS.green }
    ];

    tankPositions.forEach(pos => {
        const tank = createCylinder(4, 4, 14, 24, pos.color, pos.x, 7, pos.z, { metalness: 0.6 });
        scene.add(tank);

        // Tank top
        const top = createCylinder(4.2, 4.2, 1, 24, COLORS.steelDark, pos.x, 14.5, pos.z);
        scene.add(top);

        // Ladder
        for (let y = 0; y < 14; y += 1) {
            const rung = createBox(0.15, 0.15, 0.8, COLORS.steelLight, pos.x + 4.3, y + 0.5, pos.z);
            scene.add(rung);
        }

        // Pipes
        const pipe = createCylinder(0.3, 0.3, 8, 8, COLORS.steelDark, pos.x + 2, 4, pos.z + 3);
        pipe.rotation.z = Math.PI / 4;
        scene.add(pipe);
    });

    // Pallets with containers
    for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 4; col++) {
            const x = -20 + col * 5;
            const z = 25 + row * 5;

            // Pallet
            const pallet = createBox(4, 0.2, 4, 0x8b6914, x, 0.6, z);
            scene.add(pallet);

            // Container
            const container = createBox(3.5, 2.5, 3.5,
                [COLORS.orange, COLORS.blue, COLORS.green, COLORS.primary][col % 4],
                x, 2, z
            );
            scene.add(container);
        }
    }
}

// ============================================
// ENVIRONMENT
// ============================================
function createEnvironment() {
    // Trees
    const treePositions = [
        { x: -80, z: 40 }, { x: -85, z: 25 }, { x: -75, z: 10 },
        { x: 80, z: 40 }, { x: 85, z: 25 }, { x: 75, z: -20 },
        { x: -60, z: -50 }, { x: 60, z: -50 }
    ];

    treePositions.forEach(pos => {
        createTree(pos.x, 0, pos.z);
    });

    // Light poles
    const polePositions = [
        { x: -30, z: 35 }, { x: 0, z: 35 }, { x: 30, z: 35 },
        { x: -55, z: 0 }, { x: 55, z: 0 }
    ];

    polePositions.forEach(pos => {
        createLightPole(pos.x, pos.z);
    });
}

function createTree(x, y, z) {
    const tree = new THREE.Group();

    // Trunk
    const trunk = createCylinder(0.4, 0.6, 4, 8, 0x4a3728, 0, 2, 0);
    tree.add(trunk);

    // Foliage (layered cones)
    for (let i = 0; i < 3; i++) {
        const foliage = new THREE.Mesh(
            new THREE.ConeGeometry(2.5 - i * 0.5, 3, 8),
            new THREE.MeshStandardMaterial({
                color: 0x2d5a3f,
                roughness: 0.9
            })
        );
        foliage.position.y = 4 + i * 2;
        foliage.castShadow = true;
        tree.add(foliage);
    }

    tree.position.set(x, y, z);
    scene.add(tree);
}

function createLightPole(x, z) {
    const pole = new THREE.Group();

    // Post
    const post = createCylinder(0.2, 0.25, 10, 8, COLORS.steelDark, 0, 5, 0);
    pole.add(post);

    // Arm
    const arm = createBox(3, 0.15, 0.15, COLORS.steelDark, 1.5, 10, 0);
    pole.add(arm);

    // Light fixture
    const fixture = createBox(1.5, 0.5, 0.8, COLORS.steelLight, 2.5, 9.6, 0);
    pole.add(fixture);

    // Light (emissive)
    const light = new THREE.Mesh(
        new THREE.BoxGeometry(1.3, 0.1, 0.6),
        new THREE.MeshStandardMaterial({
            color: 0xffffee,
            emissive: 0xffffaa,
            emissiveIntensity: 1
        })
    );
    light.position.set(2.5, 9.3, 0);
    pole.add(light);

    // Point light
    const pointLight = new THREE.PointLight(0xffffee, 0.5, 20);
    pointLight.position.set(2.5, 9, 0);
    pole.add(pointLight);

    pole.position.set(x, 0, z);
    scene.add(pole);
}

// ============================================
// ATMOSPHERE
// ============================================
function createAtmosphere() {
    // Floating particles - reduced for performance
    const particleCount = 200;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 200;
        positions[i + 1] = Math.random() * 60 + 5;
        positions[i + 2] = (Math.random() - 0.5) * 200;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        color: 0x6366f1,
        size: 0.3,
        transparent: true,
        opacity: 0.4,
        sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    animatedObjects.push({
        type: 'atmosphere',
        mesh: particles,
        positions: positions
    });
}

// ============================================
// INTERACTIVE MARKERS
// ============================================
function createInteractiveMarker(x, y, z, category) {
    const marker = new THREE.Group();

    // Core
    const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(1.2, 1),
        new THREE.MeshStandardMaterial({
            color: COLORS.primary,
            emissive: COLORS.primary,
            emissiveIntensity: 0.8,
            metalness: 0.5,
            roughness: 0.2
        })
    );
    marker.add(core);

    // Outer ring
    const ring = new THREE.Mesh(
        new THREE.TorusGeometry(2, 0.1, 8, 32),
        new THREE.MeshStandardMaterial({
            color: COLORS.primaryLight,
            emissive: COLORS.primaryLight,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        })
    );
    ring.rotation.x = Math.PI / 2;
    marker.add(ring);

    // Floating particles around marker
    for (let i = 0; i < 8; i++) {
        const particle = new THREE.Mesh(
            new THREE.SphereGeometry(0.15, 8, 8),
            new THREE.MeshStandardMaterial({
                color: COLORS.accent,
                emissive: COLORS.accent,
                emissiveIntensity: 1
            })
        );
        const angle = (i / 8) * Math.PI * 2;
        particle.position.set(Math.cos(angle) * 2.5, 0, Math.sin(angle) * 2.5);
        particle.userData.orbitAngle = angle;
        marker.add(particle);
    }

    marker.position.set(x, y, z);
    marker.userData.category = category;
    marker.userData.isInteractive = true;

    interactiveObjects.push(marker);

    animatedObjects.push({
        type: 'marker',
        mesh: marker
    });

    return marker;
}

// ============================================
// UI & EVENT HANDLERS
// ============================================
function setupEventListeners() {
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onMouseClick);

    // Top Navigation links (Overview, Projects, Skills, Contact)
    document.querySelectorAll('.top-nav .nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;

            // Update active state
            document.querySelectorAll('.top-nav .nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Close all panels first
            closeAllPanels();

            // Open the correct panel
            switch(section) {
                case 'home':
                    closeAllPanels(true); // Keep hero visible
                    document.getElementById('hero-section')?.classList.remove('hidden');
                    navigateToSection('home');
                    controls.autoRotate = true;
                    break;
                case 'overview':
                    openPanel('overview-panel');
                    break;
                case 'projects':
                    openPanel('projects-panel');
                    break;
                case 'skills':
                    openPanel('skills-panel');
                    break;
                case 'contact':
                    openPanel('contact-panel');
                    break;
            }
        });
    });

    // Side Navigation buttons (3D scene navigation)
    document.querySelectorAll('.side-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            navigateToSection(btn.dataset.target);
            setActiveNavButton(btn);
        });
    });

    // Hero buttons
    document.getElementById('explore-btn')?.addEventListener('click', () => {
        document.getElementById('hero-section').classList.add('hidden');
        controls.autoRotate = true;
    });

    document.getElementById('view-projects-btn')?.addEventListener('click', () => {
        openPanel('projects-panel');
    });

    // Panel close buttons
    document.getElementById('close-panel')?.addEventListener('click', () => {
        closeAllPanels();
        document.getElementById('hero-section')?.classList.remove('hidden');
    });

    // Close buttons for all info panels
    document.querySelectorAll('.panel-close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            closeAllPanels();
            document.getElementById('hero-section')?.classList.remove('hidden');
        });
    });

    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterProjects(btn.dataset.filter);
        });
    });

    // Modal controls
    document.getElementById('close-modal')?.addEventListener('click', closeModal);
    document.querySelector('.modal-backdrop')?.addEventListener('click', closeModal);
    document.getElementById('modal-prev')?.addEventListener('click', showPrevProject);
    document.getElementById('modal-next')?.addEventListener('click', showNextProject);
    document.getElementById('modal-view')?.addEventListener('click', viewProjectIn3D);

    // Fullscreen
    document.getElementById('toggle-fullscreen')?.addEventListener('click', toggleFullscreen);

    // Day/Night toggle
    document.getElementById('toggle-daynight')?.addEventListener('click', toggleDayNight);

    // Keyboard
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeAllPanels();
            closeMobileMenu();
        }
        if (e.key === 'ArrowLeft') showPrevProject();
        if (e.key === 'ArrowRight') showNextProject();
    });

    // Mobile Menu
    setupMobileMenu();

    // Touch Controls
    setupTouchControls();
}

function closeAllPanels(keepHero = false) {
    document.getElementById('overview-panel')?.classList.add('hidden');
    document.getElementById('projects-panel')?.classList.add('hidden');
    document.getElementById('skills-panel')?.classList.add('hidden');
    document.getElementById('contact-panel')?.classList.add('hidden');
    if (!keepHero) {
        document.getElementById('hero-section')?.classList.add('hidden');
    }
    // Remove panel-open class from body
    document.body.classList.remove('panel-open');
}

function openPanel(panelId) {
    closeAllPanels();
    document.getElementById(panelId)?.classList.remove('hidden');
    // Add panel-open class to body for mobile styling
    document.body.classList.add('panel-open');
}

// ============================================
// MOBILE MENU
// ============================================
function setupMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (!menuBtn || !mobileMenu) return;

    menuBtn.addEventListener('click', () => {
        mobileMenu.classList.toggle('open');
        // Update button icon
        const isOpen = mobileMenu.classList.contains('open');
        menuBtn.innerHTML = isOpen
            ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
               </svg>`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
               </svg>`;
    });

    // Mobile menu links
    mobileMenu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;

            // Update active state
            mobileMenu.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.top-nav .nav-link').forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Also update desktop nav
            const desktopLink = document.querySelector(`.top-nav .nav-link[data-section="${section}"]`);
            if (desktopLink) desktopLink.classList.add('active');

            // Close mobile menu
            closeMobileMenu();

            // Close all panels first
            closeAllPanels();

            // Open the correct panel
            switch(section) {
                case 'home':
                    closeAllPanels(true); // Keep hero visible
                    document.getElementById('hero-section')?.classList.remove('hidden');
                    navigateToSection('home');
                    controls.autoRotate = true;
                    break;
                case 'overview':
                    openPanel('overview-panel');
                    break;
                case 'projects':
                    openPanel('projects-panel');
                    break;
                case 'skills':
                    openPanel('skills-panel');
                    break;
                case 'contact':
                    openPanel('contact-panel');
                    break;
            }
        });
    });
}

function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    const menuBtn = document.getElementById('mobile-menu-btn');

    if (mobileMenu) {
        mobileMenu.classList.remove('open');
    }
    if (menuBtn) {
        menuBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
           </svg>`;
    }
}

// ============================================
// TOUCH CONTROLS
// ============================================
function setupTouchControls() {
    // Zoom In
    const zoomInBtn = document.getElementById('touch-zoom-in');
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => {
            const direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            camera.position.addScaledVector(direction, 10);
        });
    }

    // Zoom Out
    const zoomOutBtn = document.getElementById('touch-zoom-out');
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => {
            const direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            camera.position.addScaledVector(direction, -10);
        });
    }

    // Reset View
    const resetBtn = document.getElementById('touch-reset');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            navigateToSection('home');
            document.getElementById('hero-section')?.classList.remove('hidden');
            controls.autoRotate = true;
        });
    }

    // Toggle Auto Rotate
    const rotateBtn = document.getElementById('touch-rotate');
    if (rotateBtn) {
        rotateBtn.addEventListener('click', () => {
            controls.autoRotate = !controls.autoRotate;
            rotateBtn.style.background = controls.autoRotate
                ? 'var(--color-accent-subtle)'
                : 'var(--color-canvas-default)';
        });
    }

    // Enable touch-friendly orbit controls
    if (controls) {
        controls.touches = {
            ONE: THREE.TOUCH.ROTATE,
            TWO: THREE.TOUCH.DOLLY_PAN
        };
        controls.enablePan = true;
    }
}

function setActiveNavButton(activeBtn) {
    document.querySelectorAll('.side-nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    activeBtn.classList.add('active');
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update cursor
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveObjects, true);

    if (intersects.length > 0) {
        document.body.style.cursor = 'pointer';

        // Show tooltip
        let obj = intersects[0].object;
        while (obj.parent && !obj.userData.isInteractive) {
            obj = obj.parent;
        }
        if (obj.userData.category) {
            showTooltip(event.clientX, event.clientY, getCategoryLabel(obj.userData.category));
        }
    } else {
        document.body.style.cursor = 'default';
        hideTooltip();
    }
}

function onMouseClick(event) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveObjects, true);

    if (intersects.length > 0) {
        let obj = intersects[0].object;
        while (obj.parent && !obj.userData.isInteractive) {
            obj = obj.parent;
        }
        if (obj.userData.category) {
            currentCategory = obj.userData.category;
            const projects = portfolioProjects[currentCategory];
            if (projects && projects.length > 0) {
                currentProjectIndex = 0;
                showProjectModal(projects[0], currentCategory);
            }
        }
    }
}

function getCategoryLabel(category) {
    const labels = {
        robots: 'Robotics Projects',
        cranes: 'Crane Automation',
        plc: 'PLC/SCADA Systems',
        conveyors: 'Material Handling'
    };
    return labels[category] || category;
}

function showTooltip(x, y, text) {
    const tooltip = document.getElementById('tooltip');
    tooltip.querySelector('.tooltip-text').textContent = text;
    tooltip.style.left = x + 15 + 'px';
    tooltip.style.top = y + 15 + 'px';
    tooltip.classList.remove('hidden');
}

function hideTooltip() {
    document.getElementById('tooltip').classList.add('hidden');
}

// ============================================
// PROJECTS PANEL
// ============================================
async function fetchGitHubRepos() {
    try {
        const response = await fetch('https://api.github.com/users/maartenvanels/repos?sort=updated&per_page=30');
        if (!response.ok) throw new Error('GitHub API error');

        const repos = await response.json();
        githubRepos = repos
            .filter(repo => !repo.fork && repo.visibility === 'public')
            .map(repo => ({
                title: repo.name,
                category: 'Open Source',
                categoryKey: 'github',
                description: repo.description || 'No description available',
                tech: [repo.language].filter(Boolean),
                features: [
                    repo.stargazers_count > 0 ? `${repo.stargazers_count} stars` : null,
                    repo.forks_count > 0 ? `${repo.forks_count} forks` : null,
                    `Updated ${new Date(repo.updated_at).toLocaleDateString()}`
                ].filter(Boolean),
                url: repo.html_url,
                isGitHub: true
            }));

        // Update allProjects to include GitHub repos
        allProjects = [
            ...Object.entries(portfolioProjects).flatMap(([category, projects]) =>
                projects.map(p => ({ ...p, categoryKey: category }))
            ),
            ...githubRepos
        ];

        // Re-populate the panel
        populateProjectsPanel();
    } catch (error) {
        console.warn('Could not fetch GitHub repos:', error);
    }
}

function populateProjectsPanel() {
    const container = document.getElementById('projects-list');
    container.innerHTML = '';

    allProjects.forEach((project, index) => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.dataset.category = project.categoryKey;

        // Add GitHub icon for GitHub projects
        const githubIcon = project.isGitHub ? `
            <svg class="github-icon" viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px;margin-right:6px;opacity:0.7;">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
            </svg>
        ` : '';

        card.innerHTML = `
            <div class="project-card-header">
                <span class="project-card-title">${githubIcon}${project.title}</span>
                <span class="project-card-category">${project.category}</span>
            </div>
            <p class="project-card-description">${project.description}</p>
        `;
        card.addEventListener('click', () => {
            currentProjectIndex = index;
            currentCategory = 'all';
            showProjectModal(project, project.categoryKey);
        });
        container.appendChild(card);
    });
}

function filterProjects(filter) {
    currentCategory = filter;
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
        if (filter === 'all' || card.dataset.category === filter) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// ============================================
// MODAL
// ============================================
function showProjectModal(project, categoryKey) {
    const modal = document.getElementById('project-modal');

    document.getElementById('modal-title').textContent = project.title;
    document.getElementById('modal-category').textContent = project.category;
    document.getElementById('modal-description').textContent = project.description;

    // Tech tags
    const techContainer = document.getElementById('modal-tech');
    techContainer.innerHTML = '';
    project.tech.forEach(tech => {
        const span = document.createElement('span');
        span.textContent = tech;
        techContainer.appendChild(span);
    });

    // Features
    const featuresContainer = document.getElementById('modal-features');
    featuresContainer.innerHTML = '';
    if (project.features) {
        project.features.forEach(feature => {
            const li = document.createElement('li');
            li.textContent = feature;
            featuresContainer.appendChild(li);
        });
    }

    // Update View Details button for GitHub projects
    const viewBtn = document.getElementById('modal-view');
    if (viewBtn) {
        const btnText = viewBtn.querySelector('span');
        if (project.isGitHub) {
            btnText.textContent = 'View on GitHub';
            viewBtn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor" style="width:16px;height:16px;">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                <span>View on GitHub</span>
            `;
        } else {
            viewBtn.innerHTML = `
                <span>View Details</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                    <polyline points="15 3 21 3 21 9"/>
                    <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
            `;
        }
    }

    modal.classList.remove('hidden');
}

function closeModal() {
    document.getElementById('project-modal').classList.add('hidden');
}

function showPrevProject() {
    const projects = currentCategory === 'all' ? allProjects : portfolioProjects[currentCategory];
    if (!projects) return;

    currentProjectIndex = (currentProjectIndex - 1 + projects.length) % projects.length;
    const project = projects[currentProjectIndex];
    showProjectModal(project, project.categoryKey || currentCategory);
}

function showNextProject() {
    const projects = currentCategory === 'all' ? allProjects : portfolioProjects[currentCategory];
    if (!projects) return;

    currentProjectIndex = (currentProjectIndex + 1) % projects.length;
    const project = projects[currentProjectIndex];
    showProjectModal(project, project.categoryKey || currentCategory);
}

function viewProjectIn3D() {
    // Get the current project's category
    const projects = currentCategory === 'all' ? allProjects :
        (currentCategory === 'github' ? githubRepos : portfolioProjects[currentCategory]);
    if (!projects || !projects[currentProjectIndex]) return;

    const project = projects[currentProjectIndex];

    // If it's a GitHub project, open the URL
    if (project.isGitHub && project.url) {
        window.open(project.url, '_blank');
        return;
    }

    const categoryKey = project.categoryKey || currentCategory;

    // Close modal
    closeModal();

    // Navigate to the relevant 3D section
    navigateToSection(categoryKey);

    // Update side nav active state
    const targetBtn = document.querySelector(`.side-nav-btn[data-target="${categoryKey}"]`);
    if (targetBtn) {
        setActiveNavButton(targetBtn);
    }
}

// ============================================
// NAVIGATION
// ============================================
function navigateToSection(target) {
    const positions = {
        robots: { pos: new THREE.Vector3(0, 20, 10), target: new THREE.Vector3(0, 5, -15) },
        cranes: { pos: new THREE.Vector3(110, 55, 35), target: new THREE.Vector3(65, 25, -15) },
        plc: { pos: new THREE.Vector3(55, 20, 45), target: new THREE.Vector3(35, 8, 25) },
        conveyors: { pos: new THREE.Vector3(0, 25, 40), target: new THREE.Vector3(0, 4, 5) },
        home: { pos: new THREE.Vector3(80, 50, 80), target: new THREE.Vector3(0, 8, 0) }
    };

    const config = positions[target];
    if (!config) return;

    // Hide hero
    document.getElementById('hero-section').classList.add('hidden');
    controls.autoRotate = false;

    // Animate camera
    animateCamera(config.pos, config.target);
}

function animateCamera(targetPos, targetLookAt) {
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    let progress = 0;

    const animate = () => {
        progress += 0.02;
        if (progress <= 1) {
            const t = easeInOutCubic(progress);
            camera.position.lerpVectors(startPos, targetPos, t);
            controls.target.lerpVectors(startTarget, targetLookAt, t);
            controls.update();
            requestAnimationFrame(animate);
        }
    };
    animate();
}

function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// ============================================
// ANIMATION LOOP
// ============================================
function animate() {
    requestAnimationFrame(animate);

    const time = clock.getElapsedTime();
    const delta = clock.getDelta();

    // FPS counter
    frameCount++;
    const currentTime = performance.now();
    if (currentTime - lastTime >= 1000) {
        fps = frameCount;
        frameCount = 0;
        lastTime = currentTime;
        document.getElementById('fps-value').textContent = fps;
    }

    // Camera position display
    document.getElementById('camera-pos').textContent =
        `X: ${camera.position.x.toFixed(0)} Y: ${camera.position.y.toFixed(0)} Z: ${camera.position.z.toFixed(0)}`;

    // Update day/night transition
    updateDayNightTransition();

    // Animate objects
    animatedObjects.forEach(obj => {
        switch (obj.type) {
            case 'smoke':
                const pos = obj.positions;
                for (let i = 0; i < pos.length; i += 3) {
                    pos[i + 1] += 0.05;
                    if (pos[i + 1] > 15) {
                        pos[i + 1] = 0;
                        pos[i] = (Math.random() - 0.5) * 3;
                        pos[i + 2] = (Math.random() - 0.5) * 3;
                    }
                }
                obj.mesh.geometry.attributes.position.needsUpdate = true;
                break;

            case 'package':
                // Conveyor path animation
                obj.progress += 0.002;
                if (obj.progress > 1) obj.progress = 0;

                const path = [
                    { x: -25, z: 15 },
                    { x: 25, z: 15 },
                    { x: 25, z: -5 },
                    { x: -25, z: -5 }
                ];
                const totalProgress = obj.progress * 4;
                const segIndex = Math.floor(totalProgress) % 4;
                const segProgress = totalProgress - segIndex;

                const start = path[segIndex];
                const end = path[(segIndex + 1) % 4];

                obj.mesh.position.x = start.x + (end.x - start.x) * segProgress;
                obj.mesh.position.z = start.z + (end.z - start.z) * segProgress;
                break;

            case 'robot':
                if (obj.parts) {
                    obj.parts.lowerArm.rotation.z = Math.sin(time * 0.8 + obj.phase) * 0.4;
                    obj.parts.upperArm.rotation.z = Math.sin(time * 1.2 + obj.phase) * 0.6 - 0.3;
                    obj.parts.lowerArm.rotation.y = Math.sin(time * 0.5 + obj.phase) * 0.8;
                    obj.parts.gripper.rotation.z = Math.sin(time * 2 + obj.phase) * 0.2;
                }
                break;

            case 'crane':
                obj.jib.rotation.y = Math.sin(time * 0.15) * 0.4;
                obj.trolley.position.x = 12 + Math.sin(time * 0.3) * 10;
                break;

            case 'gantry':
                // Trolley moves back and forth along beam
                const trolleyX = Math.sin(time * 0.4) * 10;
                obj.trolley.position.x = trolleyX;

                // Cable length varies (picking up and putting down)
                const cycleTime = (time * 0.3) % (Math.PI * 2);
                const cableLength = 8 + Math.sin(cycleTime) * 4; // 4 to 12
                obj.cable.scale.y = cableLength;
                obj.cable.position.y = -cableLength / 2;

                // Hook follows cable
                obj.hook.position.y = -cableLength - 1.5;

                // Cargo visibility based on cycle (simulate pick/drop)
                const pickPhase = Math.sin(cycleTime);
                obj.cargo.visible = pickPhase > -0.3; // Hide when "dropped"
                break;

            case 'marker':
                obj.mesh.rotation.y = time * 0.5;
                obj.mesh.children[0].rotation.x = time * 0.3;
                obj.mesh.children[1].rotation.z = time * 0.2;

                // Orbit particles
                obj.mesh.children.forEach((child, i) => {
                    if (i > 1 && child.userData.orbitAngle !== undefined) {
                        const angle = child.userData.orbitAngle + time * 0.5;
                        child.position.x = Math.cos(angle) * 2.5;
                        child.position.z = Math.sin(angle) * 2.5;
                        child.position.y = Math.sin(time * 2 + i) * 0.5;
                    }
                });

                // Hover effect
                obj.mesh.position.y += Math.sin(time * 2) * 0.005;
                break;

            case 'blink':
                obj.mesh.material.emissiveIntensity = 0.5 + Math.sin(time * 4) * 0.5;
                break;

            case 'atmosphere':
                const positions = obj.positions;
                for (let i = 0; i < positions.length; i += 3) {
                    positions[i + 1] += 0.02;
                    if (positions[i + 1] > 65) {
                        positions[i + 1] = 5;
                    }
                }
                obj.mesh.geometry.attributes.position.needsUpdate = true;
                obj.mesh.rotation.y = time * 0.02;
                break;
        }
    });

    controls.update();
    composer.render();
}

// ============================================
// START APPLICATION
// ============================================
init();
