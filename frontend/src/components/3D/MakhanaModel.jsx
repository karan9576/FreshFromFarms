import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

export default function MakhanaModel({ color = '#f5e5c0', scale = 1, ...props }) {
  const mesh = useRef();

  // Create a procedural noise texture for realistic organic bumps and pores
  const bumpTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    
    // Fill with noise
    const imgData = ctx.createImageData(256, 256);
    for (let i = 0; i < imgData.data.length; i += 4) {
      const val = Math.floor(Math.random() * 80) + 130; // organic porous values
      imgData.data[i] = val;     // R
      imgData.data[i+1] = val;   // G
      imgData.data[i+2] = val;   // B
      imgData.data[i+3] = 255;   // A
    }
    ctx.putImageData(imgData, 0, 0);
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }, []);

  useFrame((state, delta) => {
    if (mesh.current) {
      mesh.current.rotation.x += delta * 0.12;
      mesh.current.rotation.y += delta * 0.18;
    }
  });

  return (
    <Float speed={1.8} rotationIntensity={0.8} floatIntensity={1.2}>
      <mesh ref={mesh} scale={scale} {...props}>
        {/* Icosahedron geometry forms the irregular organic makhana shape */}
        <icosahedronGeometry args={[1, 3]} />
        <MeshDistortMaterial 
          color={color}
          distort={0.42} 
          speed={1.4} 
          roughness={0.98} // high roughness for organic matte texture
          metalness={0.02}
          bumpMap={bumpTexture}
          bumpScale={0.06} // micro-surface displacements representing pores
        />
      </mesh>
    </Float>
  );
}
