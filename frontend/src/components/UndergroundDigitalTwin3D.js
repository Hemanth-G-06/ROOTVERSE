// frontend/src/components/UndergroundDigitalTwin3D.js
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Layers, Droplets, Thermometer, ShieldAlert, Activity, Eye, RotateCw, ZoomIn } from 'lucide-react';

export default function UndergroundDigitalTwin3D({
  digitalTwinData,
  selectedLayer,
  onSelectLayer,
  activeMode = 'moisture', // 'moisture' | 'temperature' | 'compaction' | 'stress'
  onChangeMode
}) {
  const mountRef = useRef(null);
  const [selectedProbe, setSelectedProbe] = useState(null);
  const [isRotating, setIsRotating] = useState(true);
  const [viewMode, setViewMode] = useState(activeMode);
  const [isolatedLayer, setIsolatedLayer] = useState(selectedLayer || 'all');

  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const layerMeshesRef = useRef([]);
  const probeMeshesRef = useRef([]);
  const rootMeshRef = useRef(null);

  // Sync mode changes from parent
  useEffect(() => {
    setViewMode(activeMode);
  }, [activeMode]);

  useEffect(() => {
    setIsolatedLayer(selectedLayer || 'all');
  }, [selectedLayer]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 520;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a1410); // Deep subterranean ambient slate
    scene.fog = new THREE.FogExp2(0x0a1410, 0.04);

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(5.5, 2.5, 6.5);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controlsRef.current = controls;
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI * 0.85; // Allow viewing slightly beneath
    controls.minDistance = 3.5;
    controls.maxDistance = 14;

    // 5. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(5, 8, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const undergroundLight = new THREE.PointLight(0x10b981, 1.5, 10);
    undergroundLight.position.set(0, -1.5, 0);
    scene.add(undergroundLight);

    // 6. Ground Surface (Y = 0)
    const surfaceGeo = new THREE.BoxGeometry(4.2, 0.08, 4.2);
    const surfaceMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a1e,
      roughness: 0.9,
      metalness: 0.1
    });
    const surfaceMesh = new THREE.Mesh(surfaceGeo, surfaceMat);
    surfaceMesh.position.y = 0.04;
    surfaceMesh.receiveShadow = true;
    scene.add(surfaceMesh);

    // Surface Grid
    const grid = new THREE.GridHelper(4.2, 8, 0x10b981, 0x14532d);
    grid.position.y = 0.082;
    scene.add(grid);

    // 7. Above-Ground Plant Stem & Foliage
    const stemGeo = new THREE.CylinderGeometry(0.06, 0.09, 1.4, 16);
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 });
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.position.y = 0.7;
    stemMesh.castShadow = true;
    scene.add(stemMesh);

    // Foliage Clusters
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.5 });
    for (let i = 0; i < 4; i++) {
      const leafGeo = new THREE.SphereGeometry(0.28, 12, 12);
      const leafMesh = new THREE.Mesh(leafGeo, leafMat);
      const angle = (i * Math.PI) / 2;
      leafMesh.position.set(Math.cos(angle) * 0.35, 1.1 + (i % 2) * 0.2, Math.sin(angle) * 0.35);
      leafMesh.scale.set(1.4, 0.5, 1.0);
      scene.add(leafMesh);
    }

    // 8. Procedural Subterranean Root System
    const rootGroup = new THREE.Group();
    rootMeshRef.current = rootGroup;
    const rootMat = new THREE.MeshStandardMaterial({
      color: 0xe2b072,
      roughness: 0.8,
      metalness: 0.1
    });

    // Central Taproot descending through all layers (0 to -2.7)
    const taprootCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.04, -0.6, 0.03),
      new THREE.Vector3(-0.05, -1.4, 0.02),
      new THREE.Vector3(0.02, -2.1, -0.04),
      new THREE.Vector3(0, -2.7, 0)
    ]);
    const taprootGeo = new THREE.TubeGeometry(taprootCurve, 32, 0.05, 8, false);
    const taprootMesh = new THREE.Mesh(taprootGeo, rootMat);
    rootGroup.add(taprootMesh);

    // Lateral Branch Roots (Spreading into 10cm, 20cm, 30cm)
    const lateralSeeds = [
      { start: new THREE.Vector3(0.02, -0.4, 0), dir: new THREE.Vector3(0.7, -0.7, 0.4), rad: 0.028 },
      { start: new THREE.Vector3(-0.02, -0.6, 0), dir: new THREE.Vector3(-0.8, -0.9, -0.3), rad: 0.028 },
      { start: new THREE.Vector3(0, -1.0, 0.02), dir: new THREE.Vector3(0.4, -1.4, -0.8), rad: 0.024 },
      { start: new THREE.Vector3(0, -1.3, -0.02), dir: new THREE.Vector3(-0.6, -1.6, 0.6), rad: 0.022 },
      { start: new THREE.Vector3(0.02, -1.8, 0), dir: new THREE.Vector3(0.5, -2.2, 0.3), rad: 0.020 },
      { start: new THREE.Vector3(-0.01, -2.0, 0), dir: new THREE.Vector3(-0.4, -2.4, -0.4), rad: 0.018 }
    ];

    lateralSeeds.forEach((s) => {
      const mid = s.start.clone().add(s.dir).multiplyScalar(0.5);
      const branchCurve = new THREE.CatmullRomCurve3([s.start, mid, s.dir]);
      const branchGeo = new THREE.TubeGeometry(branchCurve, 16, s.rad, 6, false);
      const branchMesh = new THREE.Mesh(branchGeo, rootMat);
      rootGroup.add(branchMesh);
    });

    scene.add(rootGroup);

    // 9. Three Subterranean Soil Layers (10cm, 20cm, 30cm)
    const layerDefs = [
      { id: '10cm', name: '10 cm Layer (Topsoil)', y: -0.45, height: 0.9, depth: 10 },
      { id: '20cm', name: '20 cm Layer (Mid Root)', y: -1.35, height: 0.9, depth: 20 },
      { id: '30cm', name: '30 cm Layer (Deep Subsoil)', y: -2.25, height: 0.9, depth: 30 }
    ];

    layerMeshesRef.current = [];
    layerDefs.forEach((def, idx) => {
      const geo = new THREE.BoxGeometry(4.0, def.height - 0.04, 4.0);
      const mat = new THREE.MeshPhysicalMaterial({
        color: 0x22c55e,
        transparent: true,
        opacity: 0.35,
        roughness: 0.3,
        transmission: 0.4,
        ior: 1.2
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.y = def.y;
      mesh.userData = { ...def, index: idx };
      scene.add(mesh);
      layerMeshesRef.current.push(mesh);

      // Layer Boundary Wireframe Outline
      const wireMat = new THREE.LineBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.4 });
      const wireframe = new THREE.LineSegments(new THREE.EdgesGeometry(geo), wireMat);
      wireframe.position.y = def.y;
      scene.add(wireframe);
    });

    // 10. Sensor Probes & Glowing Status Beacons
    probeMeshesRef.current = [];
    const probeDepths = [
      { depthCm: 10, y: -0.45, label: 'Probe 10cm' },
      { depthCm: 20, y: -1.35, label: 'Probe 20cm' },
      { depthCm: 30, y: -2.25, label: 'Probe 30cm' }
    ];

    // Vertical Sensor Stem
    const rodGeo = new THREE.CylinderGeometry(0.02, 0.02, 2.8, 8);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.2 });
    const rodMesh = new THREE.Mesh(rodGeo, rodMat);
    rodMesh.position.set(1.4, -1.4, 1.4);
    scene.add(rodMesh);

    probeDepths.forEach((p) => {
      const beaconGroup = new THREE.Group();
      beaconGroup.position.set(1.4, p.y, 1.4);

      // Sensor Node Sphere
      const sphereGeo = new THREE.SphereGeometry(0.12, 16, 16);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x10b981,
        emissiveIntensity: 0.8,
        roughness: 0.2
      });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      beaconGroup.add(sphereMesh);

      // Glowing Halo Ring
      const ringGeo = new THREE.RingGeometry(0.16, 0.24, 24);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0x34d399,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 2;
      beaconGroup.add(ringMesh);

      beaconGroup.userData = { ...p };
      scene.add(beaconGroup);
      probeMeshesRef.current.push({ group: beaconGroup, sphereMat, ringMesh, depth: p.depthCm });
    });

    // 11. Raycaster for clicking probes & layers
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handlePointerDown = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        // Find nearest parent with userData
        let obj = intersects[0].object;
        while (obj && !obj.userData?.depthCm && !obj.userData?.depth && obj.parent) {
          obj = obj.parent;
        }
        if (obj && (obj.userData?.depthCm || obj.userData?.depth)) {
          setSelectedProbe(obj.userData);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    // 12. Animation Loop
    let animationId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Slow ambient rotation
      if (isRotating) {
        scene.rotation.y = elapsed * 0.12;
      }

      // Pulse probe halos
      probeMeshesRef.current.forEach((pm, i) => {
        const scale = 1 + Math.sin(elapsed * 3 + i) * 0.18;
        pm.ringMesh.scale.set(scale, scale, scale);
      });

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.dispose();
    };
  }, [isRotating]);

  // Update Layer Colors & Visibility dynamically when Data / Mode / Isolation changes
  useEffect(() => {
    if (!digitalTwinData || !layerMeshesRef.current.length) return;

    const layers = digitalTwinData.layers || [];

    layerMeshesRef.current.forEach((mesh, idx) => {
      const layerData = layers[idx] || {};
      const depthId = idx === 0 ? '10cm' : idx === 1 ? '20cm' : '30cm';

      // Visibility based on layer isolation
      if (isolatedLayer !== 'all' && isolatedLayer !== depthId) {
        mesh.material.opacity = 0.05;
        mesh.visible = true;
      } else {
        mesh.material.opacity = 0.42;
        mesh.visible = true;
      }

      // Heatmap Color Interpolation
      let targetColor = new THREE.Color(0x10b981); // default green

      if (viewMode === 'moisture') {
        const m = layerData.moisture || 35;
        if (m < 20) targetColor.setHex(0xef4444); // Red drought
        else if (m < 30) targetColor.setHex(0xf59e0b); // Yellow dry
        else if (m < 60) targetColor.setHex(0x10b981); // Green optimal
        else if (m < 85) targetColor.setHex(0x06b6d4); // Cyan moist
        else targetColor.setHex(0x3b82f6); // Deep blue waterlogged
      } else if (viewMode === 'temperature') {
        const t = layerData.temperature || 22;
        if (t < 18) targetColor.setHex(0x38bdf8); // Cool blue
        else if (t < 27) targetColor.setHex(0x10b981); // Optimal green
        else if (t < 34) targetColor.setHex(0xf97316); // Warm orange
        else targetColor.setHex(0xdc2626); // Thermal stress red
      } else if (viewMode === 'compaction') {
        const c = layerData.compaction || 900;
        if (c < 1200) targetColor.setHex(0x10b981); // Loose / well-aerated
        else if (c < 1800) targetColor.setHex(0xeab308); // Moderate density
        else if (c < 2200) targetColor.setHex(0xf97316); // High resistance
        else targetColor.setHex(0xb91c1c); // Impenetrable hardpan
      } else {
        // Root Stress Mode
        const m = layerData.moisture || 35;
        const c = layerData.compaction || 900;
        if (m < 20 || m > 88 || c > 2200) {
          targetColor.setHex(0xef4444);
        } else if (m < 28 || c > 1700) {
          targetColor.setHex(0xf59e0b);
        } else {
          targetColor.setHex(0x10b981);
        }
      }

      mesh.material.color = targetColor;

      // Update probe beacon colors
      if (probeMeshesRef.current[idx]) {
        probeMeshesRef.current[idx].sphereMat.color = targetColor;
        probeMeshesRef.current[idx].sphereMat.emissive = targetColor;
      }
    });

    // Root system coloring based on deep layer health
    if (rootMeshRef.current) {
      const deepMoisture = layers[2]?.moisture || 35;
      const midCompaction = layers[1]?.compaction || 950;
      const rootMat = rootMeshRef.current.children[0]?.material;
      if (rootMat) {
        if (deepMoisture < 20) {
          rootMat.color.setHex(0xc27842); // Brittle dehydrated amber
        } else if (midCompaction > 2200) {
          rootMat.color.setHex(0x9ca3af); // Pale constrained gray
        } else {
          rootMat.color.setHex(0xe2b072); // Healthy vibrant root cream
        }
      }
    }
  }, [digitalTwinData, viewMode, isolatedLayer]);

  const layers = digitalTwinData?.layers || [
    { depthLabel: '10 cm', moisture: 38.2, temperature: 22.4, compaction: 850 },
    { depthLabel: '20 cm', moisture: 36.5, temperature: 21.8, compaction: 950 },
    { depthLabel: '30 cm', moisture: 35.1, temperature: 21.2, compaction: 1040 }
  ];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-emerald-900/60 bg-gradient-to-b from-slate-950 via-slate-900 to-black shadow-2xl">
      {/* Top Floating Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* View Mode Heatmap Toggles */}
        <div className="flex items-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md rounded-xl border border-emerald-500/30 shadow-lg pointer-events-auto">
          <button
            onClick={() => { setViewMode('moisture'); onChangeMode && onChangeMode('moisture'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'moisture'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Droplets className="w-3.5 h-3.5" />
            Moisture Distribution
          </button>

          <button
            onClick={() => { setViewMode('temperature'); onChangeMode && onChangeMode('temperature'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'temperature'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Thermometer className="w-3.5 h-3.5" />
            Underground Temp
          </button>

          <button
            onClick={() => { setViewMode('compaction'); onChangeMode && onChangeMode('compaction'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'compaction'
                ? 'bg-orange-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Hardpan Compaction
          </button>

          <button
            onClick={() => { setViewMode('stress'); onChangeMode && onChangeMode('stress'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'stress'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Root Stress Zones
          </button>
        </div>

        {/* Orbit Action Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setIsRotating(!isRotating)}
            className={`p-2 rounded-xl backdrop-blur-md border text-xs font-medium flex items-center gap-1 transition-all ${
              isRotating
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900/80 border-slate-700 text-slate-400'
            }`}
            title="Toggle Ambient Auto-Rotation"
          >
            <RotateCw className={`w-4 h-4 ${isRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
            <span className="hidden sm:inline">{isRotating ? 'Rotating' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Viewport */}
      <div ref={mountRef} className="w-full h-[520px] cursor-grab active:cursor-grabbing" />

      {/* Layer Depth Quick Selector (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2 p-1.5 bg-slate-950/85 backdrop-blur-md rounded-xl border border-emerald-800/50 shadow-xl">
        <span className="text-[11px] font-semibold text-emerald-400 px-2 flex items-center gap-1">
          <Eye className="w-3 h-3" />
          Layer Focus:
        </span>
        {['all', '10cm', '20cm', '30cm'].map((layerKey) => (
          <button
            key={layerKey}
            onClick={() => {
              setIsolatedLayer(layerKey);
              onSelectLayer && onSelectLayer(layerKey);
            }}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              isolatedLayer === layerKey
                ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            {layerKey === 'all' ? 'All Depths' : layerKey}
          </button>
        ))}
      </div>

      {/* Real-time Probe Telemetry Badge (Bottom-Right) */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2 p-3 bg-slate-950/90 backdrop-blur-md rounded-xl border border-emerald-800/50 shadow-2xl max-w-xs text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span className="font-semibold text-emerald-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" />
            Underground Telemetry
          </span>
          <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-700/50 px-1.5 py-0.5 rounded">
            3-Depth IoT
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="p-1.5 bg-slate-900/80 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">10 cm Top</div>
            <div className="text-sm font-bold text-emerald-400">{layers[0]?.moisture}%</div>
            <div className="text-[10px] text-slate-500">{layers[0]?.temperature}°C</div>
          </div>
          <div className="p-1.5 bg-slate-900/80 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">20 cm Mid</div>
            <div className="text-sm font-bold text-emerald-400">{layers[1]?.moisture}%</div>
            <div className="text-[10px] text-slate-500">{layers[1]?.temperature}°C</div>
          </div>
          <div className="p-1.5 bg-slate-900/80 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-400">30 cm Deep</div>
            <div className="text-sm font-bold text-emerald-400">{layers[2]?.moisture}%</div>
            <div className="text-[10px] text-slate-500">{layers[2]?.temperature}°C</div>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800/80">
          <span>Max Compaction: <strong className="text-slate-200">{Math.max(layers[0]?.compaction || 0, layers[1]?.compaction || 0, layers[2]?.compaction || 0)} kPa</strong></span>
          <span className="text-emerald-400">Click & Drag to Rotate</span>
        </div>
      </div>
    </div>
  );
}

