export const UNIT = 1;
export const STUD_HEIGHT = 0.4;

// Converts integer grid coordinates to a Three.js world-space position tuple; called when positioning a brick mesh in the scene.
export function gridToWorld(x: number, y: number, z: number): [number, number, number] {
    return [
        x * UNIT,
        y * STUD_HEIGHT + STUD_HEIGHT / 2,
        z * UNIT,
    ];
}

// Converts a raw raycaster intersection point (float world coords) to snapped integer grid coordinates; called on mouse move/click to determine which cell the cursor is targeting.
export function snapToGrid(point: { x: number; y: number; z: number }): { x: number; y: number; z: number } {
    return {
        x: Math.round(point.x / UNIT),
        y: Math.round(point.y / STUD_HEIGHT),
        z: Math.round(point.z / UNIT),
    };
}

// Returns a deterministic string key for a grid position; used as React key props on brick components and as map keys when storing brick data.
export function cellKey(x: number, y: number, z: number): string {
    return `${x}:${y}:${z}`;
}

// Checks whether any brick in the scene already occupies a given grid cell; called before placing a new brick to prevent overlapping placements.
export function isCellOccupied(
    bricks: Array<{ x: number; y: number; z: number }>,
    x: number,
    y: number,
    z: number
): boolean {
    return bricks.some((b) => b.x === x && b.y === y && b.z === z);
}
