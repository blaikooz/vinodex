import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Search } from 'lucide-react';
import DeviceLayout from './DeviceLayout';
import worldlink from '../src/assets/images/updatedglobemap.jpg';
import { CONTINENTS } from '../data/continents';

interface RetroGlobeScreenProps {
  onBack: () => void;
  onHome: () => void;
  onSelectContinent: (continent: string) => void;
}

const DRAG_SENSITIVITY = 0.005;
const INERTIA_DAMPING = 0.94;
const MAX_PITCH = 1.0;
const GLOBE_RADIUS = 1.18;

interface RegionMarker {
  id: string;
  label: string;
  continentKey: string;
  color: string;
  lat: number;
  lng: number;
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
  offsetX: number;
  offsetY: number;
  visible: boolean;
}

const toRgba = (hex: string, alpha: number): string => {
  const normalized = hex.replace('#', '');
  const full = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;
  const value = parseInt(full, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const CONTINENT_COLORS: Record<string, string> = CONTINENTS.reduce((acc, continent) => {
  const key = continent.id.replace('CONT_', '');
  acc[key] = continent.color;
  return acc;
}, {} as Record<string, string>);

const MARKER_COLOR_OVERRIDES: Record<string, string> = {
  NORTH_AMERICA: '#E53935',
  SOUTH_AMERICA: '#8E24AA',
  EUROPE: '#1E88E5',
  AFRICA: '#8D6E63',
  ASIA: '#FDD835',
  OCEANIA: '#43A047',
};

const MARKER_COLORS: Record<string, string> = {
  ...CONTINENT_COLORS,
  ...MARKER_COLOR_OVERRIDES,
};

const RetroGlobeScreen: React.FC<RetroGlobeScreenProps> = ({ onBack, onHome, onSelectContinent }) => {
  const handleWorldSearch = () => {
    // Handle world search navigation
  };
  const [isDragging, setIsDragging] = useState(false);
  const [longitudeDeg, setLongitudeDeg] = useState(0);
  const [regionMarkers, setRegionMarkers] = useState<RegionMarker[]>([
    { id: 'north-america', continentKey: 'NORTH_AMERICA', color: MARKER_COLORS.NORTH_AMERICA || '#E53935', label: 'NORTH\nAMERICA', lat: 38, lng: -122, x: 0, y: 0, anchorX: 0, anchorY: 0, offsetX: 0, offsetY: 0, visible: true },
    { id: 'south-america', continentKey: 'SOUTH_AMERICA', color: MARKER_COLORS.SOUTH_AMERICA || '#8E24AA', label: 'SOUTH\nAMERICA', lat: -33, lng: -70, x: 0, y: 0, anchorX: 0, anchorY: 0, offsetX: 0, offsetY: 0, visible: true },
    { id: 'europe', continentKey: 'EUROPE', color: MARKER_COLORS.EUROPE || '#1E88E5', label: 'EUROPE', lat: 43, lng: 12, x: 0, y: 0, anchorX: 0, anchorY: 0, offsetX: 0, offsetY: 0, visible: true },
    { id: 'africa', continentKey: 'AFRICA', color: MARKER_COLORS.AFRICA || '#8D6E63', label: 'AFRICA', lat: -33, lng: 20, x: 0, y: 0, anchorX: 0, anchorY: 0, offsetX: 0, offsetY: 0, visible: true },
    { id: 'asia', continentKey: 'ASIA', color: MARKER_COLORS.ASIA || '#FDD835', label: 'ASIA', lat: 34, lng: 105, x: 0, y: 0, anchorX: 0, anchorY: 0, offsetX: 0, offsetY: 0, visible: true },
    { id: 'oceania', continentKey: 'OCEANIA', color: MARKER_COLORS.OCEANIA || '#43A047', label: 'OCEANIA', lat: -35, lng: 147, x: 0, y: 0, anchorX: 0, anchorY: 0, offsetX: 0, offsetY: 0, visible: true },
  ]);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<THREE.Mesh | null>(null);
  const wireRef = useRef<THREE.Mesh | null>(null);
  const cameraRef = useRef<THREE.Camera | null>(null);
  const markersRef = useRef<RegionMarker[]>(regionMarkers);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);


  const dragRef = useRef({
    active: false,
    x: 0,
    y: 0,
    velocityYaw: 0,
    velocityPitch: 0,
  });

  const latLngToVector3 = (lat: number, lng: number, radius: number): THREE.Vector3 => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);
    return new THREE.Vector3(x, y, z);
  };

  useEffect(() => {
    markersRef.current = regionMarkers;
  }, [regionMarkers]);


  useEffect(() => {
    const host = viewportRef.current;
    const container = containerRef.current;
    if (!host || !container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.set(0, 0, 3.6);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.style.display = 'block';
    host.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const ambient = new THREE.AmbientLight(0x66ff99, 0.33);
    const keyLight = new THREE.DirectionalLight(0x9bffca, 1.1);
    keyLight.position.set(2.5, 1.8, 3.2);
    const rimLight = new THREE.DirectionalLight(0x1fff91, 0.5);
    rimLight.position.set(-3, -1, -2);
    scene.add(ambient, keyLight, rimLight);

    const texture = new THREE.TextureLoader().load(worldlink);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.colorSpace = THREE.SRGBColorSpace;

    const globeGeometry = new THREE.SphereGeometry(GLOBE_RADIUS, 96, 96);
    const globeMaterial = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.92,
      metalness: 0.08,
      emissive: new THREE.Color('#0d311f'),
      emissiveIntensity: 0.3,
    });
    const globe = new THREE.Mesh(globeGeometry, globeMaterial);

    const wireGeometry = new THREE.SphereGeometry(GLOBE_RADIUS + 0.04, 28, 28);
    const wireMaterial = new THREE.MeshBasicMaterial({
      color: '#7bffbc',
      wireframe: true,
      transparent: true,
      opacity: 0.08,
    });
    const wire = new THREE.Mesh(wireGeometry, wireMaterial);

    scene.add(globe, wire);
    globeRef.current = globe;
    wireRef.current = wire;

    const onResize = () => {
      const { clientWidth, clientHeight } = host;
      if (!clientWidth || !clientHeight) return;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      // Keep CSS size matched to host while using DPR internally.
      renderer.setSize(clientWidth, clientHeight, true);
    };

    onResize();
    window.addEventListener('resize', onResize);
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(host);

    let raf = 0;
    let frameCount = 0;

    const animate = () => {
      const drag = dragRef.current;
      const activeGlobe = globeRef.current;
      const activeWire = wireRef.current;

      if (activeGlobe && activeWire) {
        if (!drag.active) {
          drag.velocityYaw *= INERTIA_DAMPING;
          drag.velocityPitch *= INERTIA_DAMPING;
        }

        activeGlobe.rotation.y += drag.velocityYaw + 0.0018;
        activeWire.rotation.y = activeGlobe.rotation.y;

        activeGlobe.rotation.x = THREE.MathUtils.clamp(activeGlobe.rotation.x + drag.velocityPitch, -MAX_PITCH, MAX_PITCH);
        activeWire.rotation.x = activeGlobe.rotation.x;

        frameCount += 1;
        if (frameCount % 8 === 0) {
          const deg = THREE.MathUtils.radToDeg(activeGlobe.rotation.y);
          setLongitudeDeg(Math.round(((deg % 360) + 360) % 360));

          // Update region markers
          const newMarkers = markersRef.current.map((marker) => {
            const pos = latLngToVector3(marker.lat, marker.lng, GLOBE_RADIUS);
            pos.applyQuaternion(activeGlobe.quaternion);

            const screenPos = new THREE.Vector3();
            screenPos.copy(pos);
            screenPos.project(camera);

            const width = container.clientWidth;
            const height = container.clientHeight;
            const anchorX = (screenPos.x * width) / 2 + width / 2;
            const anchorY = -(screenPos.y * height) / 2 + height / 2;
            const x = anchorX + marker.offsetX;
            const y = anchorY + marker.offsetY;

            // Marker half-dimensions (px) — must match button w/h classes.
            const hw = 64;
            const hh = 44;
            const inBounds =
              x - hw >= 0 && x + hw <= width &&
              y - hh >= 0 && y + hh <= height;

            // Hide markers much earlier as they rotate away from the viewer.
            const visible = pos.z > 0.55 && inBounds;

            return { ...marker, x, y, anchorX, anchorY, visible };
          });
          setRegionMarkers(newMarkers);
        }
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      resizeObserver.disconnect();

      globeGeometry.dispose();
      globeMaterial.dispose();
      wireGeometry.dispose();
      wireMaterial.dispose();
      texture.dispose();
      renderer.dispose();

      if (renderer.domElement.parentElement === host) {
        host.removeChild(renderer.domElement);
      }

      globeRef.current = null;
      wireRef.current = null;
    };
  }, []);


  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    // Don't capture pointer when clicking a marker button
    if ((event.target as HTMLElement).closest('button')) return;
    const drag = dragRef.current;
    drag.active = true;
    drag.x = event.clientX;
    drag.y = event.clientY;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const globe = globeRef.current;

    if (!drag.active || !globe) return;

    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;

    drag.x = event.clientX;
    drag.y = event.clientY;

    drag.velocityYaw = dx * DRAG_SENSITIVITY;
    drag.velocityPitch = dy * DRAG_SENSITIVITY * 0.45;

    globe.rotation.y += drag.velocityYaw;
    globe.rotation.x = THREE.MathUtils.clamp(globe.rotation.x + drag.velocityPitch, -MAX_PITCH, MAX_PITCH);

    if (wireRef.current) {
      wireRef.current.rotation.y = globe.rotation.y;
      wireRef.current.rotation.x = globe.rotation.x;
    }
  };

  const handlePointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current.active = false;
    setIsDragging(false);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleLostPointerCapture = () => {
    dragRef.current.active = false;
    setIsDragging(false);
  };

  return (
    <DeviceLayout
      title="GLOBE SCAN"
      subtitle="TACTILE VIEW"
      onBack={onBack}
      showBack={true}
      onHome={onHome}
      centerHeaderText={true}
    >
      <div className="relative w-full h-full bg-black overflow-hidden flex flex-col items-center justify-between py-4">
        <div
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(74, 222, 128, 0.24) 1px, transparent 1px), linear-gradient(90deg, rgba(74, 222, 128, 0.24) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        <div className="relative z-10 flex-1 flex items-center justify-center min-h-0 w-full">
          <div
            className="relative w-full h-full overflow-hidden"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onPointerLeave={handlePointerEnd}
            onLostPointerCapture={handleLostPointerCapture}
            style={{ touchAction: 'none' }}
          >
            <div
              ref={containerRef}
              className="absolute inset-0"
            />
            <div
              ref={viewportRef}
              className={`absolute inset-0 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            />
            <div className="absolute inset-0 overflow-hidden">
              {regionMarkers.map((marker) => (
                <div
                  key={marker.id}
                  className={`absolute pointer-events-none transition-all duration-300 ${marker.visible ? 'opacity-100' : 'opacity-0'}`}
                  style={{
                    left: `${marker.anchorX}px`,
                    top: `${marker.anchorY}px`,
                  }}
                >
                  <button
                    onClick={() => {
                      onSelectContinent(marker.continentKey);
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 w-28 h-[4.5rem] sm:w-32 sm:h-20 rounded-lg border-[3px] transition-all duration-150 font-retro text-[12px] sm:text-[15px] flex items-center justify-center text-center leading-tight whitespace-pre-line px-2 hover:scale-105 hover:brightness-125 active:scale-90 active:brightness-150 active:duration-75 ${
                    marker.visible
                      ? 'pointer-events-auto'
                      : 'pointer-events-none'
                  }`}
                    style={{
                      left: `${marker.x - marker.anchorX}px`,
                      top: `${marker.y - marker.anchorY}px`,
                      borderColor: marker.visible ? toRgba(marker.color, 0.9) : 'transparent',
                      backgroundColor: marker.visible ? toRgba(marker.color, 0.12) : 'transparent',
                      boxShadow: marker.visible ? `0 0 16px ${toRgba(marker.color, 0.55)}` : 'none',
                      touchAction: 'manipulation',
                    }}
                    aria-label={marker.label}
                  >
                    <span className="tracking-tight text-white">{marker.label}</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative z-20 text-center space-y-3 shrink-0">
          <p className="font-retro text-sm sm:text-base text-green-300 tracking-[0.22em]">DRAG TO SPIN GLOBE</p>
          <button onClick={handleWorldSearch} className="group mx-auto flex items-center gap-2.5 px-7 py-2.5 bg-green-400 text-black border border-green-200 rounded-full hover:bg-green-300 hover:border-white transition-all duration-300 shadow-[0_0_20px_rgba(74,222,128,0.4)]">
            <Search size={18} className="group-hover:scale-110 transition-transform" />
            <span className="font-retro tracking-widest text-sm sm:text-base">WORLD SEARCH</span>
          </button>
        </div>
      </div>
    </DeviceLayout>
  );
};

export default RetroGlobeScreen;
