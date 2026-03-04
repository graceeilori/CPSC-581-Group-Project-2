"use client";

// Renders a single placed Lego brick — body + studs — and handles click-to-stack onto its top face.

import { ThreeEvent } from "@react-three/fiber";
import { snapToGrid } from "./Workspace";

interface BrickProps {
    position: [number, number, number];   // world-space centre
    dimensions: [number, number, number]; // [width, height, depth] in grid units
    color: string;
    currentTool: [number, number, number];
    onPlaceBrick: (x: number, y: number, z: number) => void;
}

export function Brick({ position, dimensions, color, currentTool, onPlaceBrick }: BrickProps) {
    const [w, h, d] = dimensions;

    // Generate stud positions centred on the top face
    const studs: { sx: number; sz: number }[] = [];
    for (let col = 0; col < w; col++) {
        for (let row = 0; row < d; row++) {
            studs.push({
                sx: col - (w - 1) / 2,
                sz: row - (d - 1) / 2,
            });
        }
    }

    function handleClick(e: ThreeEvent<MouseEvent>) {
        e.stopPropagation();

        if (e.face) {
            const { x, y, z } = e.point;

            // Push the hit point slightly outward along the face normal so
            // the snap math picks the adjacent cell rather than rounding back inward
            const newX = snapToGrid(x + e.face.normal.x * 0.1, currentTool[0]);
            const newZ = snapToGrid(z + e.face.normal.z * 0.1, currentTool[2]);

            // Stack: current brick centre + half current height + half new tool height
            const newY = position[1] + h / 2 + currentTool[1] / 2;

            onPlaceBrick(newX, newY, newZ);
        }
    }

    return (
        <group position={position}>
            {/* Brick body */}
            <mesh castShadow receiveShadow onClick={handleClick}>
                <boxGeometry args={[w * 0.95, h, d * 0.95]} />
                <meshStandardMaterial color={color} />
            </mesh>

            {/* Studs on top face */}
            {studs.map(({ sx, sz }, i) => (
                <mesh key={i} position={[sx, h / 2 + 0.06, sz]} castShadow onClick={handleClick}>
                    <cylinderGeometry args={[0.18, 0.18, 0.12, 16]} />
                    <meshStandardMaterial color={color} />
                </mesh>
            ))}
        </group>
    );
}
