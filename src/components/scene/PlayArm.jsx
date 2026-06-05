import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * A stylised turntable play-arm built entirely from Three.js mesh primitives.
 *
 * Layout (local space, pivot at origin):
 *   ─ Base cylinder (pivot hinge)
 *   ─ Counterweight sphere behind the pivot
 *   ─ Arm rod (long thin cylinder extending forward)
 *   ─ Head-shell box at the tip
 *   ─ Stylus (tiny cone beneath the head-shell)
 *
 * When `selected` is true the arm sweeps from its resting angle to the
 * "on-record" angle and lowers slightly. All transitions are smooth lerps.
 */

const ARM_REST_Y = Math.PI * 0.28;   // resting rotation around Y (swung away)
const ARM_PLAY_Y = Math.PI * 0.04;   // playing rotation around Y (over the disc)
const ARM_REST_X = 0;                 // level when resting
const ARM_PLAY_X = -0.06;            // slightly lowered when playing

// Metallic material presets
const baseMat = { color: '#3f3f46', metalness: 0.85, roughness: 0.25 };
const rodMat  = { color: '#a1a1aa', metalness: 0.9,  roughness: 0.18 };
const headMat = { color: '#18181b', metalness: 0.7,  roughness: 0.35 };
const cwMat   = { color: '#52525b', metalness: 0.8,  roughness: 0.3 };

export default function PlayArm({ selected = false, isMobile = false }) {
  const groupRef = useRef();

  // Memoised target quaternions to avoid GC churn
  const targets = useMemo(() => ({
    restQ: new THREE.Quaternion().setFromEuler(new THREE.Euler(ARM_REST_X, ARM_REST_Y, 0)),
    playQ: new THREE.Quaternion().setFromEuler(new THREE.Euler(ARM_PLAY_X, ARM_PLAY_Y, 0)),
  }), []);

  // Position the arm relative to the selected disc area
  const armPosition = useMemo(() => {
    if (isMobile) {
      return [1.2, 3.6, 4.4];
    }
    return [3.8, 1.8, 3.2];
  }, [isMobile]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    const targetQ = selected ? targets.playQ : targets.restQ;
    groupRef.current.quaternion.slerp(targetQ, 1 - Math.pow(0.001, delta));

    // Smooth scale / visibility
    const targetScale = selected ? 1 : 0.6;
    groupRef.current.scale.lerp(
      { x: targetScale, y: targetScale, z: targetScale },
      1 - Math.pow(0.003, delta)
    );

    // Fade in/out via material opacity would be expensive for many meshes,
    // instead we scale down gracefully when hidden.
  });

  return (
    <group ref={groupRef} position={armPosition} scale={[0.6, 0.6, 0.6]}>
      {/* ── Pivot base ────────────────────────────────── */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.16, 24]} />
        <meshStandardMaterial {...baseMat} />
      </mesh>

      {/* ── Pivot cap (shiny sphere) ──────────────────── */}
      <mesh position={[0, 0.12, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#71717a" metalness={0.95} roughness={0.1} />
      </mesh>

      {/* ── Counterweight (behind pivot) ──────────────── */}
      <mesh position={[0, 0.06, 0.35]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial {...cwMat} />
      </mesh>

      {/* ── Counterweight arm (short rod behind pivot) ── */}
      <mesh position={[0, 0.06, 0.18]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.025, 0.025, 0.34, 8]} />
        <meshStandardMaterial {...rodMat} />
      </mesh>

      {/* ── Main arm rod ──────────────────────────────── */}
      <mesh position={[0, 0.06, -0.72]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.022, 0.018, 1.44, 8]} />
        <meshStandardMaterial {...rodMat} />
      </mesh>

      {/* ── Head-shell (small box at the tip) ─────────── */}
      <group position={[0, 0.02, -1.48]}>
        <mesh>
          <boxGeometry args={[0.08, 0.04, 0.18]} />
          <meshStandardMaterial {...headMat} />
        </mesh>

        {/* ── Stylus / cartridge tip ──────────────────── */}
        <mesh position={[0, -0.05, -0.06]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.012, 0.08, 6]} />
          <meshStandardMaterial color="#e11d48" metalness={0.4} roughness={0.5} />
        </mesh>
      </group>
    </group>
  );
}
