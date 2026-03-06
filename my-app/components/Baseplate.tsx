"use client";

import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { ThreeEvent } from "@react-three/fiber";
import { snapToGrid } from "./Workspace";

interface BaseplateProps {
    size: number;
    currentTool: [number, number, number];
    onPlaceBrick?: (x: number, y: number, z: number) => void;
}

const STUD_RADIUS = 0.18;
const STUD_HEIGHT = 0.12;
const STUD_SEGMENTS = 16;
const PLATE_THICKNESS = 0.1;
const PLATE_Y = -PLATE_THICKNESS / 2;
const STUD_Y = STUD_HEIGHT / 2;
const LINE_Y = 0.011;

const PLATE_COLOR = new THREE.Color("#E6F0FE");
const LINE_COLOR = new THREE.Color("#E8EDF5");
const STUD_COLOR = new THREE.Color("#CAD5E8");

/**
 * Lego-style baseplate
 */
export function Baseplate({ size, currentTool, onPlaceBrick }: BaseplateProps) {
    const instancedRef = useRef<THREE.InstancedMesh>(null!);
    const half = size / 2;

    const studGeometry = useMemo(
        () => new THREE.CylinderGeometry(STUD_RADIUS, STUD_RADIUS, STUD_HEIGHT, STUD_SEGMENTS),
        []
    );
    const studMaterial = useMemo(
        () => new THREE.MeshStandardMaterial({ color: STUD_COLOR }),
        []
    );

    useEffect(() => {
        const mesh = instancedRef.current;
        if (!mesh) return;
        const dummy = new THREE.Object3D();
        let i = 0;
        for (let xi = 0; xi < size; xi++) {
            for (let zi = 0; zi < size; zi++) {
                dummy.position.set(xi - half + 0.5, STUD_Y, zi - half + 0.5);
                dummy.updateMatrix();
                mesh.setMatrixAt(i++, dummy.matrix);
            }
        }
        mesh.instanceMatrix.needsUpdate = true;
    }, [size, half]);

    const lineGeometry = useMemo(() => {
        const points: number[] = [];
        for (let i = 0; i <= size; i++) {
            const offset = i - half;
            points.push(offset, LINE_Y, -half, offset, LINE_Y, half);
            points.push(-half, LINE_Y, offset, half, LINE_Y, offset);
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
        return geo;
    }, [size, half]);

    const lineMaterial = useMemo(
        () => new THREE.LineBasicMaterial({ color: LINE_COLOR }),
        []
    );

    function handleClick(e: ThreeEvent<MouseEvent>) {
        e.stopPropagation();
        if (!onPlaceBrick) return;
        const { x, z } = e.point;
        const snappedX = snapToGrid(x, currentTool[0]);
        const snappedZ = snapToGrid(z, currentTool[2]);
        const snappedY = currentTool[1] / 2;
        onPlaceBrick(snappedX, snappedY, snappedZ);
    }

    return (
        <group>
            <mesh position={[0, PLATE_Y, 0]} receiveShadow onClick={handleClick}>
                <boxGeometry args={[size, PLATE_THICKNESS, size]} />
                <meshStandardMaterial color={PLATE_COLOR} />
            </mesh>
            <lineSegments geometry={lineGeometry} material={lineMaterial} />
            <instancedMesh
                ref={instancedRef}
                args={[studGeometry, studMaterial, size * size]}
                castShadow
            />
        </group>
    );
}
