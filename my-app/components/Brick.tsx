"use client";

// Renders a single placed Lego brick — body + studs. Click to stack a new brick on top.

import { ThreeEvent } from "@react-three/fiber";
import { snapToGrid } from "./Workspace";
import { DragControls, OrbitControls } from "@react-three/drei";


interface BrickProps {
    position: [number, number, number];
    dimensions: [number, number, number]; // [width, height, depth]
    color: string;
    currentTool: [number, number, number];
    onPlaceBrick?: (x: number, y: number, z: number) => void;
    onDelete?: () => void;
}

export function Brick({ position, dimensions, color, currentTool, onPlaceBrick, onDelete }: BrickProps) {

    const [w, h, d] = dimensions;

    const studs: { sx: number; sz: number }[] = [];
    for (let col = 0; col < w; col++) {
        for (let row = 0; row < d; row++) {
            studs.push({ sx: col - (w - 1) / 2, sz: row - (d - 1) / 2 });
        }
    }

    function handleClick(e: ThreeEvent<MouseEvent>) {
        e.stopPropagation();
        if (!e.face || !onPlaceBrick) return;
        const { x, y, z } = e.point;
        const newX = snapToGrid(x + e.face.normal.x * 0.1, currentTool[0]);
        const newZ = snapToGrid(z + e.face.normal.z * 0.1, currentTool[2]);
        const newY = position[1] + h / 2 + currentTool[1] / 2;
        onPlaceBrick(newX, newY, newZ)
    }

    function handleDelete(e: ThreeEvent<MouseEvent>) {
        if (e.button === 2) {   // right click
            e.stopPropagation();
            if (onDelete) onDelete();
        }
    }


    return (
        <group position={position}>
            <DragControls>
                <mesh castShadow receiveShadow onClick={handleClick} onPointerUp={handleDelete}>
                    <boxGeometry args={[w, h, d]} />
                    <meshStandardMaterial color={color} />
                </mesh>
                {studs.map(({ sx, sz }, i) => (
                    <mesh key={i} position={[sx, h / 2 + 0.06, sz]} castShadow onClick={handleClick} onPointerUp={handleDelete}>
                        <cylinderGeometry args={[0.18, 0.18, 0.12, 16]} />
                        <meshStandardMaterial color={color} />
                    </mesh>
                ))}</DragControls>
        </group>
    );
}
