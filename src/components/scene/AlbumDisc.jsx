import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { Suspense, useMemo, useRef, Component } from 'react';
import * as THREE from 'three';

const EASE = 0.12;

/* ── tiny 1×1 grey fallback data-URI (only used as placeholder) ── */
const FALLBACK_TEX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQI12NgAAIABQAB' +
  'nl6KlQAAAABJRU5ErkJggg==';

/* ── Error boundary keeps the rest of the scene alive ── */
class DiscErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? null : this.props.children; }
}

/* ── Inner disc that actually loads the texture ── */
function DiscMesh({ album, target, opacity = 1, isSelected, onSelect }) {
  const meshRef = useRef(null);
  const materialRef = useRef(null);
  const tempVec = useMemo(() => new THREE.Vector3(), []);

  // useTexture will suspend inside <Suspense> while loading
  const texture = useTexture(album.texture_url || FALLBACK_TEX);

  useFrame((_, delta) => {
    if (!meshRef.current) {
      return;
    }

    if (isSelected && target.scale > 0.01) {
      const pRot = meshRef.current.parent ? meshRef.current.parent.rotation.y : 0;
      
      const isMobile = window.innerWidth < 768;
      const worldX = isMobile ? 0.0 : 0.6;
      const worldY = isMobile ? 3.4 : 0.5;
      const worldZ = isMobile ? 2.2 : 2.0;

      const localX = worldX * Math.cos(-pRot) + worldZ * Math.sin(-pRot);
      const localZ = -worldX * Math.sin(-pRot) + worldZ * Math.cos(-pRot);

      tempVec.set(localX, worldY, localZ);
      meshRef.current.position.lerp(tempVec, EASE);

      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, -pRot, EASE);
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0, EASE);

      const nextScale = THREE.MathUtils.lerp(meshRef.current.scale.x, target.scale, EASE);
      meshRef.current.scale.setScalar(nextScale);
      
      meshRef.current.rotation.z += delta * 1.8;
      
      if (materialRef.current) {
        materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, opacity, EASE);
      }
    } else {
      tempVec.set(target.position[0], target.position[1], target.position[2]);
      meshRef.current.position.lerp(tempVec, EASE);

      const nextScale = THREE.MathUtils.lerp(meshRef.current.scale.x, target.scale, EASE);
      meshRef.current.scale.setScalar(nextScale);

      meshRef.current.rotation.y = THREE.MathUtils.lerp(meshRef.current.rotation.y, target.rotationY, EASE);
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, target.rotationX, EASE);
      meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, 0, EASE);
      
      if (materialRef.current) {
        materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, opacity, EASE);
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      scale={[0.001, 0.001, 0.001]}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(album.id);
      }}
    >
      <circleGeometry args={[0.88, 64]} />
      <meshStandardMaterial
        ref={materialRef}
        map={texture}
        transparent
        opacity={0.98}
        metalness={0.12}
        roughness={0.52}
        onBeforeCompile={(shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <alphatest_fragment>',
            `
            #include <alphatest_fragment>
            float d = distance(vMapUv, vec2(0.5));
            if (d > 0.49 || d < 0.07) discard;
            `
          );
        }}
        customProgramCacheKey={() => 'cd-mask'}
      />
    </mesh>
  );
}

/* ── Public component wraps inner disc with resilience layers ── */
function AlbumDisc(props) {
  return (
    <DiscErrorBoundary>
      <Suspense fallback={null}>
        <DiscMesh {...props} />
      </Suspense>
    </DiscErrorBoundary>
  );
}

export default AlbumDisc;
