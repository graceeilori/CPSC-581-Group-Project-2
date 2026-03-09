"use client";

// Renders a single placed Lego brick — body + studs. Click to stack a new brick on top.

import { ThreeEvent } from "@react-three/fiber";
import { snapToGrid } from "./Workspace";
import { DragControls, OrbitControls } from "@react-three/drei";
import { useState, KeyboardEvent } from "react";


interface BrickProps {
    position: [number, number, number];
    dimensions: [number, number, number]; // [width, height, depth]
    color: string;
    currentTool: [number, number, number];
    onPlaceBrick?: (x: number, y: number, z: number, newDims: [number, number, number]) => void;
    onDelete?: () => void;
}

export function Brick({ position, dimensions, color, currentTool, onPlaceBrick, onDelete }: BrickProps) {

    const [dims, setDims] = useState<[number, number, number]>(dimensions);
    const [pos, setPos] = useState<[number, number, number]>(position);
    const [w, h, d] = dims;

    //Used during Rotation
    const [isMoved, setIsMoved] = useState<boolean>(false);
    const togglePosition = () => {
        setIsMoved(!isMoved);
    }

    const studs: { sx: number; sz: number }[] = [];
    for (let col = 0; col < w; col++) {
        for (let row = 0; row < d; row++) {
            studs.push({ sx: col - (w - 1) / 2, sz: row - (d - 1) / 2 });
        }
    }

    // Rotate brick when pressing middle button
    //JJ: I would like to make this press r on keyboard, but keyboard events are tricker
    const handleRotate = (e: ThreeEvent<PointerEvent>) => {
    if (e.button === 1) { //middle click
        e.stopPropagation();
        setDims(([W, H, D]) => [D, H, W]); // Swap X/Z, keep Y
            //If a brick is even/even or odd/odd, it rotates fine. This is for odd x even blocks
            if ((dimensions[0] + dimensions[2])%2 != 0){
                if (isMoved){
                    setPos(prev => [prev[0] + 0.5, prev[1], prev[2] + 0.5]);
                } else {
                    setPos(prev => [prev[0] - 0.5, prev[1], prev[2] - 0.5]);
                }
            }
        }
    }

    function handleClick(e: ThreeEvent<MouseEvent>) {
        e.stopPropagation();
        if (!e.face || !onPlaceBrick) return;
        const { x, y, z } = e.point;
        const newX = snapToGrid(x + e.face.normal.x * 0.1, currentTool[0]);
        const newZ = snapToGrid(z + e.face.normal.z * 0.1, currentTool[2]);
        const newY = position[1] + h / 2 + currentTool[1] / 2;
        onPlaceBrick(newX, newY, newZ, dims)
    }

    function handleDelete(e: ThreeEvent<MouseEvent>) {
        if (e.button === 2) {   // right click
            e.stopPropagation();
            if (onDelete) onDelete();
        }
    }
    
    //Used for Rotate and toggle. Will also need to change this even to keypress R
    function handlePointerDown(e:ThreeEvent<PointerEvent>){
        handleRotate(e);
        togglePosition();
    }


    return (
        <DragControls
            axisLock="y" 
            // Manual transform handling to ensure snapping
            autoTransform={false} 
            onDrag={(localMatrix) => {
                // Extract X and Z from the local translation matrix (indices 12 and 14)
                const rawX = localMatrix.elements[12];
                const rawZ = localMatrix.elements[14];
                
                setPos([
                    snapToGrid(rawX, currentTool[0]), 
                    position[1], //y stays the same
                    snapToGrid(rawZ, currentTool[2])
                ]);
                //Again, even x odd blocks need special treatment
                //JJ: this needs to be fixed
                if ((dimensions[0] + dimensions[2])%2 != 0 && isMoved){
                    setPos(prev => [prev[0] + 0.5, prev[1], prev[2] + 0.5]); 
                }   
            }}
        >
            <group position={pos}>
                    <mesh 
                        castShadow 
                        receiveShadow 
                        onClick={handleClick} 
                        onPointerDown={handlePointerDown}
                        onPointerUp={handleDelete}
                        >
                        <boxGeometry args={[w, h, d]} />
                        <meshStandardMaterial color={color} />
                    </mesh>
                    {studs.map(({ sx, sz }, i) => (
                        <mesh key={i} position={[sx, h / 2 + 0.06, sz]} castShadow onClick={handleClick} onPointerUp={handleDelete}>
                            <cylinderGeometry args={[0.18, 0.18, 0.12, 16]} />
                            <meshStandardMaterial color={color} />
                        </mesh>
                    ))}
            </group>
        </DragControls>
    );
}
