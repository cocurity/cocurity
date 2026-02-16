"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Environment, Float } from "@react-three/drei";
import { useRef } from "react";
import type { Group } from "three";
import * as THREE from "three";

function OrbCluster() {
  const group = useRef<Group>(null);

  useFrame((state, delta) => {
    if (!group.current) return;
    group.current.rotation.y += delta * 0.18;
    group.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
  });

  return (
    <group ref={group}>
      <Float speed={1.5} rotationIntensity={0.6} floatIntensity={0.8}>
        <mesh position={[0, 0, 0]}>
          <icosahedronGeometry args={[1.25, 10]} />
          <meshStandardMaterial color="#8bb2ff" metalness={0.3} roughness={0.1} />
        </mesh>
      </Float>

      <Float speed={1.1} rotationIntensity={0.9} floatIntensity={0.7}>
        <mesh position={[0, 0, 0]}>
          <torusGeometry args={[2.1, 0.12, 16, 150]} />
          <meshStandardMaterial color="#5eead4" metalness={0.4} roughness={0.2} />
        </mesh>
      </Float>

      <Float speed={0.9} rotationIntensity={0.7} floatIntensity={0.6}>
        <mesh position={[0, 0, 0]}>
          <torusGeometry args={[2.65, 0.06, 12, 180]} />
          <meshStandardMaterial color="#c4b5fd" metalness={0.55} roughness={0.25} />
        </mesh>
      </Float>
    </group>
  );
}

export default function HeroScene() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden rounded-[28px]">
      <Canvas
        dpr={[1, 1.5]}
        gl={{ antialias: true, powerPreference: "high-performance", toneMapping: THREE.ACESFilmicToneMapping }}
        camera={{ position: [0, 0, 6], fov: 45 }}
      >
        <color attach="background" args={["#070a16"]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[4, 6, 3]} intensity={2.1} color="#9bc6ff" />
        <pointLight position={[-4, -2, 3]} intensity={2.4} color="#5eead4" />
        <pointLight position={[3, 1, -2]} intensity={1.8} color="#c4b5fd" />
        <OrbCluster />
        <Environment preset="night" />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#070a16]/55" />
    </div>
  );
}
