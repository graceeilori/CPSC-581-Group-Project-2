"use client";

import { useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Baseplate } from "./Baseplate";
import { Brick } from "./Brick";

export interface BrickData {
    id: string;
    position: [number, number, number];  // world-space centre [x, y, z]
    dimensions: [number, number, number]; // [width, height, depth] in grid units
    color: string;
}

/**
 * Snaps a raw raycaster intersection coordinate to the correct grid centre.
 * Odd-sized bricks centre on half-integers (0.5, 1.5 …).
 * Even-sized bricks centre on whole integers (0, 1, 2 …).
 */
export function snapToGrid(intersectValue: number, dimensionSize: number): number {
    const isEven = dimensionSize % 2 === 0;
    if (isEven) {
        return Math.round(intersectValue);          // snaps to 0.0, 1.0, 2.0 …
    } else {
        return Math.floor(intersectValue) + 0.5;   // snaps to 0.5, 1.5, 2.5 …
    }
}

export default function Workspace() {
    const [bricks, setBricks] = useState<BrickData[]>([]);
    const [currentTool, setCurrentTool] = useState<[number, number, number]>([2, 1, 4]);

    const handlePlaceBrick = (x: number, y: number, z: number) => {
        setBricks((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                position: [x, y, z],
                dimensions: currentTool,
                color: "#ff0000",
            },
        ]);
    };

    return (
        <div style={{ width: "100vw", height: "100vh" }}>
            <div style={{ position: "absolute", zIndex: 10, padding: "20px", display: "flex", gap: "8px" }}>
                <button onClick={() => setCurrentTool([1, 1, 1])}>Equip 1×1</button>
                <button onClick={() => setCurrentTool([2, 1, 2])}>Equip 2×2</button>
                <button onClick={() => setCurrentTool([2, 1, 4])}>Equip 2×4</button>
            </div>

            <Canvas camera={{ position: [5, 5, 5], fov: 50 }} shadows>
                <ambientLight intensity={0.9} />
                <directionalLight position={[10, 20, 10]} intensity={0.5} castShadow />

                <Baseplate
                    size={10}
                    currentTool={currentTool}
                    onPlaceBrick={handlePlaceBrick}
                />

                {bricks.map((brick) => (
                    <Brick
                        key={brick.id}
                        position={brick.position}
                        dimensions={brick.dimensions}
                        color={brick.color}
                        currentTool={currentTool}
                        onPlaceBrick={handlePlaceBrick}
                    />
                ))}

                <OrbitControls makeDefault />
            </Canvas>
        </div>
    );
}