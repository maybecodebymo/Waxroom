import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { useGesture } from '@use-gesture/react';
import { useMemo, useRef, useState, useEffect } from 'react';
import * as THREE from 'three';
import AlbumDisc from './AlbumDisc';
import { useGalleryStore } from '../../store/useGalleryStore';

const defaultLookAt = new THREE.Vector3(0, 0.1, 0);
const discRadius = 0.88;

const createGlobeLayout = (albumIds, controls) => {
  // Apply dynamic physical morphing based on camera zoomOut offset (-8 to 8)
  const zoom = controls.zoomOut;
  const radius = controls.globeRadius * (1 - zoom * 0.045);
  const vertical = controls.globeHeight * (1 - zoom * 0.08);
  const tilt = controls.tiltFactor * (1 - zoom * 0.035);

  const count = Math.max(1, albumIds.length);
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const map = new Map();

  albumIds.forEach((id, index) => {
    const ySphere = 1 - ((index + 0.5) / count) * 2;
    const spread = Math.sqrt(1 - ySphere * ySphere);
    const theta = goldenAngle * index;

    const x = Math.cos(theta) * spread * radius;
    const z = Math.sin(theta) * spread * radius - radius * 0.45;
    const y = ySphere * vertical;

    map.set(id, {
      position: [x, y, z],
      rotationY: Math.atan2(x, z),
      rotationX: -ySphere * tilt,
      scale: 1,
    });
  });

  return map;
};

function GalleryScene() {
  const albums = useGalleryStore((state) => state.albums);
  const crateInbox = useGalleryStore((state) => state.crateInbox);
  const activeGenre = useGalleryStore((state) => state.activeGenre);
  const selectedAlbumId = useGalleryStore((state) => state.selectedAlbumId);
  const selectAlbum = useGalleryStore((state) => state.selectAlbum);
  const controls = useGalleryStore((state) => state.sceneControls);
  const activeBgColor = useGalleryStore((state) => state.activeBgColor);
  const setSceneControl = useGalleryStore((state) => state.setSceneControl);
  const { camera, gl } = useThree();
  const groupRef = useRef(null);
  const rotationRef = useRef(0);
  const targetRotationRef = useRef(0);
  const baseRotationRef = useRef(0);
  const targetBgColor = useRef(new THREE.Color('#f5f5f3'));

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectedAlbum = useMemo(() => {
    if (!selectedAlbumId) return null;
    return albums.find((a) => a.id === selectedAlbumId) ||
           crateInbox.find((a) => a.id === selectedAlbumId);
  }, [albums, crateInbox, selectedAlbumId]);

  const visibleAlbums = useMemo(
    () => albums.filter((album) => activeGenre === 'All' || album.genre === activeGenre),
    [albums, activeGenre]
  );

  const renderAlbums = useMemo(() => {
    const list = [...visibleAlbums];
    if (selectedAlbum && !list.some((a) => a.id === selectedAlbum.id)) {
      list.push(selectedAlbum);
    }
    return list;
  }, [visibleAlbums, selectedAlbum]);

  const visibleIds = useMemo(() => visibleAlbums.map((album) => album.id), [visibleAlbums]);
  const layoutMap = useMemo(() => createGlobeLayout(visibleIds, controls), [visibleIds, controls]);
  const gridFitDistance = useMemo(() => {
    if (!layoutMap.size) {
      return 16;
    }

    let maxRadius = 0;
    layoutMap.forEach(({ position }) => {
      const [x, y, z] = position;
      const radius = Math.sqrt(x * x + (y - defaultLookAt.y) * (y - defaultLookAt.y) + z * z);
      if (radius > maxRadius) {
        maxRadius = radius;
      }
    });

    const fovRadians = THREE.MathUtils.degToRad(camera.fov);
    const paddedRadius = maxRadius + discRadius * Math.max(1, controls.focusScale);
    return (paddedRadius / Math.sin(Math.max(0.05, fovRadians * 0.5))) * 1.06;
  }, [layoutMap, controls.focusScale, camera.fov]);

  useGesture(
    {
      onDrag: ({ movement: [mx] }) => {
        const speedMultiplier = isMobile ? 1.6 : 1.0;
        targetRotationRef.current = baseRotationRef.current + mx * controls.dragSpeed * speedMultiplier;
      },
      onDragEnd: () => {
        baseRotationRef.current = targetRotationRef.current;
      },
      onWheel: ({ delta: [dx, dy], event }) => {
        if (event && event.cancelable) {
          event.preventDefault();
        }
        targetRotationRef.current -= (dx + dy) * controls.dragSpeed * 0.5;
        baseRotationRef.current = targetRotationRef.current;
      },
      onPinch: ({ delta: [d], event }) => {
        if (event && event.cancelable) {
          event.preventDefault();
        }
        // Two-finger pinch on trackpads / touch mobile screens changes the zoomOut factor
        const change = -d * 6.0;
        const currentZoom = useGalleryStore.getState().sceneControls.zoomOut;
        const nextZoom = Math.max(-8, Math.min(8, currentZoom + change));
        setSceneControl('zoomOut', nextZoom);
      }
    },
    {
      target: gl.domElement,
      eventOptions: { passive: false },
      drag: {
        from: () => {
          const speedMultiplier = isMobile ? 1.6 : 1.0;
          return [(targetRotationRef.current - baseRotationRef.current) / (controls.dragSpeed * speedMultiplier), 0];
        },
        filterTaps: true,
      },
      wheel: {
        eventOptions: { passive: false }
      },
      pinch: {
        eventOptions: { passive: false }
      }
    }
  );

  useFrame((state, delta) => {
    rotationRef.current = THREE.MathUtils.damp(
      rotationRef.current,
      targetRotationRef.current,
      1 / Math.max(0.01, controls.dragDamp),
      delta
    );

    const selectedBase = selectedAlbumId ? layoutMap.get(selectedAlbumId) : null;
    const spin = rotationRef.current;
    const cosA = Math.cos(spin);
    const sinA = Math.sin(spin);

    const selectedTarget = selectedBase
      ? {
          x: selectedBase.position[0] * cosA + selectedBase.position[2] * sinA,
          y: selectedBase.position[1],
          z: -selectedBase.position[0] * sinA + selectedBase.position[2] * cosA,
        }
      : null;

    const cameraTarget = selectedAlbumId
      ? (isMobile ? new THREE.Vector3(0, 3.2, 5.2) : new THREE.Vector3(1.2, 0.6, 4.2))
      : new THREE.Vector3(0, 1.2, gridFitDistance + controls.zoomOut);

    const lookAtTarget = selectedAlbumId
      ? (isMobile ? new THREE.Vector3(0, 2.8, 0) : new THREE.Vector3(1.2, 0.6, 0))
      : defaultLookAt;

    camera.position.lerp(cameraTarget, controls.camDamp);
    camera.lookAt(lookAtTarget);

    if (groupRef.current) {
      groupRef.current.rotation.y = rotationRef.current;

      // Centrifugal flattening physics (group stretches horizontally, squashes vertically when spun)
      // Disabled when an album is selected to keep artwork undistorted
      const hasSelection = Boolean(selectedAlbumId);
      const targetStretch = hasSelection ? 0 : Math.abs(rotationRef.current - targetRotationRef.current) * 0.14;
      const stretch = THREE.MathUtils.damp(
        groupRef.current.scale.x - 1,
        targetStretch,
        4.5,
        delta
      );
      groupRef.current.scale.set(1 + stretch, 1 - stretch * 0.35, 1 + stretch);
    }

    // Smooth background color lerp
    try {
      targetBgColor.current.set(activeBgColor);
    } catch {
      targetBgColor.current.set('#f5f5f3');
    }
    if (state.scene.background instanceof THREE.Color) {
      state.scene.background.lerp(targetBgColor.current, 1 - Math.pow(0.005, delta));
    } else {
      state.scene.background = targetBgColor.current.clone();
    }
  });

  return (
    <>
      <color attach="background" args={['#f5f5f3']} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[2, 6, 5]} intensity={1.1} />
      <pointLight position={[-6, 3, 4]} intensity={0.6} />
      <Environment preset="city" />
      <group ref={groupRef}>
        {renderAlbums.map((album) => {
          const visibleTarget = layoutMap.get(album.id);
          const hasSelection = Boolean(selectedAlbumId);

          let target;
          let opacity = 0;

          if (visibleTarget) {
            const isSelected = selectedAlbumId === album.id;

            target = isSelected
              ? {
                  position: visibleTarget.position,
                  rotationY: visibleTarget.rotationY,
                  rotationX: visibleTarget.rotationX,
                  scale: isMobile ? 0.48 : 0.8,
                }
              : {
                  position: visibleTarget.position,
                  rotationY: visibleTarget.rotationY,
                  rotationX: visibleTarget.rotationX,
                  scale: hasSelection ? controls.dimScale : 1,
                };

            opacity = hasSelection && !isSelected ? controls.dimOpacity : 1;
          } else {
            const isSelected = selectedAlbumId === album.id;
            if (isSelected) {
              target = {
                position: [0, 0.6, 0],
                rotationY: 0,
                rotationX: 0,
                scale: isMobile ? 0.48 : 0.8,
              };
              opacity = 1;
            } else {
              target = {
                position: [0, -8.2, -14],
                rotationY: 0,
                rotationX: 0,
                scale: 0.001,
              };
              opacity = 0;
            }
          }

          return (
            <AlbumDisc
              key={album.id}
              album={album}
              target={target}
              opacity={opacity}
              onSelect={selectAlbum}
              isSelected={selectedAlbumId === album.id}
            />
          );
        })}
      </group>
    </>
  );
}

function GalleryCanvas() {
  const selectAlbum = useGalleryStore((state) => state.selectAlbum);

  return (
    <div className="absolute inset-0 z-0 touch-none">
      <Canvas camera={{ position: [0, 1.2, 18], fov: 42 }} onPointerMissed={() => selectAlbum(null)}>
        <GalleryScene />
      </Canvas>
    </div>
  );
}

export default GalleryCanvas;
