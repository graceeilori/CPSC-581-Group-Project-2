"use client";
import { BrickData } from "./Workspace";

interface ObjectiveProps {
    targetBricks: BrickData[];
}

// renders the objective model as a semi-transparent ghost
export function ObjectiveModel({ targetBricks }: ObjectiveProps) {
    return (
        <group>
            {targetBricks.map((brick) => (
                <mesh
                    key={`ghost-${brick.id}`}
                    position={brick.position}
                    raycast={() => null}
                >
                    <boxGeometry args={brick.dimensions} />

                    <meshStandardMaterial
                        color={brick.color}
                        transparent={true}
                        opacity={0.2}
                        depthWrite={false}
                        wireframe={false}
                    />
                </mesh>
            ))}
        </group>
    );
}