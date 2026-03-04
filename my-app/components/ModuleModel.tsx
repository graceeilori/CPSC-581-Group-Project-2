"use client";
import { BrickData } from "./Workspace";

interface ModuleProps {
    targetBricks: BrickData[];
}

// renders the module model
export function ModuleModel({ targetBricks }: ModuleProps) {
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
                        transparent={false}
                        opacity={1}
                        depthWrite={true}
                        wireframe={false}
                    />
                </mesh>
            ))}
        </group>
    );
}