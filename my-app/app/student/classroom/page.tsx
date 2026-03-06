"use client";

import { useRef, useState, useCallback, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import * as THREE from "three";
import { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Baseplate } from "@/components/Baseplate";
import { Brick } from "@/components/Brick";
import { type BrickData } from "@/components/Workspace";
import wallData from "@/modules/wall.json";
import pyramidData from "@/modules/pyramid.json";
import { ObjectiveModel } from "@/components/ObjectiveModel";
import { socket } from "@/lib/socket";
import Link from "next/link";


function CameraResetter({ onReady }: { onReady: (reset: () => void) => void }) {
    const { controls } = useThree();
    useEffect(() => {
        if (controls && typeof (controls as OrbitControlsImpl).reset === "function") {
            onReady(() => (controls as OrbitControlsImpl).reset());
        }
    }, [controls]);
    return null;
}

function CadSessionInner() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionName = searchParams.get("sessionName") || "Introduction to CAD";
    const [selectedTool, setSelectedTool] = useState("Brick 2x4");
    const [showSettings, setShowSettings] = useState(false);
    const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
    const [bricks, setBricks] = useState<BrickData[]>([]);
    const resetCameraRef = useRef<(() => void) | null>(null);

    const BASEPLATE_SIZE = 10;

    const [sessionModule, setSessionModule] = useState("The Wall");

    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = sessionStorage.getItem("activeSession");
            if (saved) {
                try {
                    const sessionData = JSON.parse(saved);
                    if (sessionData.module) setSessionModule(sessionData.module);
                } catch (e) {
                    // ignore
                }
            }
        }
    }, []);

    const isPyramid = sessionModule === "The Pyramid";

    const tools = (isPyramid
        ? [
            { label: "Brick 1x2", dims: [1, 1, 2], color: "#BF5426" },
            { label: "Brick 2x2", dims: [2, 1, 2], color: "#d45050" },
            { label: "Brick 2x4", dims: [2, 1, 4], color: "#6970eb" },
        ]
        : [
            { label: "Brick 1x2", dims: [1, 1, 2], color: "#BF5426" },
            { label: "Brick 1x2", dims: [1, 1, 2], color: "#D2892D" },
            { label: "Plate 1x6", dims: [1, 0.4, 6], color: "#E8B987" },
        ]) as { label: string; dims: [number, number, number]; color: string }[];

    const targetData = isPyramid ? pyramidData.targetData : wallData.targetData;

    const [selectedIndex, setSelectedIndex] = useState(0);
    const currentTool = tools[selectedIndex].dims;
    const currentColor = tools[selectedIndex].color;

    const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const pressOrigin = useRef<{ x: number; y: number } | null>(null);
    const LONG_PRESS_MS = 500;
    const DRAG_THRESHOLD_PX = 8;

    const handleSessionEnded = useCallback(() => {
        sessionStorage.removeItem("activeSession");
        alert("The expert ended the session.");
        router.push("/student");
    }, [router]);

    useEffect(() => {
        socket.on("session:ended", handleSessionEnded);
        return () => { socket.off("session:ended", handleSessionEnded); };
    }, [handleSessionEnded]);

    const handleCameraReady = useCallback((fn: () => void) => {
        resetCameraRef.current = fn;
    }, []);

    function closeCtxMenu() {
        setCtxMenu(null);
    }

    function handleResetCamera() {
        resetCameraRef.current?.();
        closeCtxMenu();
    }

    function handlePointerDown(e: React.PointerEvent) {
        if (e.button !== 2) return;
        pressOrigin.current = { x: e.clientX, y: e.clientY };
        longPressTimer.current = setTimeout(() => {
            setCtxMenu({ x: pressOrigin.current!.x, y: pressOrigin.current!.y });
        }, LONG_PRESS_MS);
    }

    function handlePointerMove(e: React.PointerEvent) {
        if (!pressOrigin.current || longPressTimer.current === null) return;
        const dx = e.clientX - pressOrigin.current.x;
        const dy = e.clientY - pressOrigin.current.y;
        if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD_PX) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    }

    function handlePointerUp(e: React.PointerEvent) {
        if (e.button !== 2) return;
        if (longPressTimer.current !== null) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
        pressOrigin.current = null;
    }

    function deleteBrick(id: string) {
        setBricks((prev) => prev.filter((b) => b.id !== id));
    }

    // returns true if the new brick's 3D footprint overlaps any existing brick.
    // epsilon prevents adjacent touching faces from counting as collisions.
    function checkCollision(
        newPos: [number, number, number],
        newDim: [number, number, number],
        existingBricks: BrickData[]
    ): boolean {
        const epsilon = 0.05;
        const [nx, ny, nz] = newPos;
        const [nw, nh, nd] = newDim;
        const nMinX = nx - nw / 2, nMaxX = nx + nw / 2;
        const nMinY = ny - nh / 2, nMaxY = ny + nh / 2;
        const nMinZ = nz - nd / 2, nMaxZ = nz + nd / 2;

        return existingBricks.some(({ position: [ex, ey, ez], dimensions: [ew, eh, ed] }) => {
            return (
                nMinX < ex + ew / 2 - epsilon && nMaxX > ex - ew / 2 + epsilon &&
                nMinY < ey + eh / 2 - epsilon && nMaxY > ey - eh / 2 + epsilon &&
                nMinZ < ez + ed / 2 - epsilon && nMaxZ > ez - ed / 2 + epsilon
            );
        });
    }

    function handlePlaceBrick(x: number, y: number, z: number) {
        const [w, , d] = currentTool;
        const half = BASEPLATE_SIZE / 2;
        if (
            x - w / 2 < -half || x + w / 2 > half ||
            z - d / 2 < -half || z + d / 2 > half
        ) return;

        const newPos: [number, number, number] = [x, y, z];
        if (checkCollision(newPos, currentTool, bricks)) return;

        const layer = Math.floor(y) + 1;
        setBricks((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                position: newPos,
                dimensions: currentTool,
                color: currentColor,
                layer,
            },
        ]);
    }

    function handleLeave() {
        socket.emit("session:leave");
        sessionStorage.removeItem("activeSession");
        router.push("/student");
    }

    // Sync bricks with expert whenever they change
    useEffect(() => {
        socket.emit("board:update", { bricks });
    }, [bricks]);

    // Derive unique layer numbers from placed bricks
    const usedLayers = Array.from(new Set(bricks.map((b) => b.layer))).sort((a, z) => a - z);

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-gray-200">

            {/* top */}
            <div className="h-14 bg-white shadow flex items-center justify-between px-6">

                <Link
                    href="/student"
                    className="flex font-medium text-gray-700 hover:text-gray-900 transition w-100 items-center gap-2"
                >
                    Back to Dashboard
                </Link>

                {/* session name */}
                <div className="font-medium text-gray-600">
                    {sessionName}
                </div>

                {/* right buttons */}
                <div className="flex items-center gap-4">
                    <button className="px-3 py-1 border rounded hover:bg-gray-100 text-black">
                        Talk
                    </button>

                    <span className="text-green-600 text-sm font-semibold">
                        Phone Linked
                    </span>

                    <button
                        onClick={handleLeave}
                        className="rounded-lg flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition"
                    >
                        <img src="/assets/exit.svg" alt="Exit" className="w-4 h-4 flex-shrink-0" />
                        Leave session
                    </button>

                    {/* dropdown menu */}
                    <div className="relative">
                        <button onClick={() => setShowSettings(!showSettings)} className="text-lg hover:opacity-70 text-black" >
                            Menu
                        </button>

                        {showSettings && (
                            <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg border z-50 text-black">
                                <button
                                    onClick={() => {
                                        alert("Expert has been notified.");
                                        setShowSettings(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                                >
                                    Notify Expert
                                </button>

                                <button
                                    onClick={() => {
                                        alert("Opening contact channel...");
                                        setShowSettings(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                                >
                                    Contact Expert
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex flex-1 min-h-0 overflow-hidden">

                {/* sidebar */}
                <div className="w-64 p-4 bg-white border-r border-gray-200 flex flex-col overflow-hidden min-h-0">

                    <h3 className="text-sm font-semibold mb-4 text-neutral-900">ELEMENTS</h3>

                    {/* brickss grid */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                        {tools.map((tool, idx) => (
                            <div
                                key={idx}
                                onClick={() => setSelectedIndex(idx)}
                                className={`p-3 rounded-lg text-center cursor-pointer transition text-xs font-medium text-black flex items-center justify-center gap-2
                              ${selectedIndex === idx
                                        ? "bg-indigo-200 border border-primary-100"
                                        : "bg-gray-200 hover:bg-gray-300"
                                    }
                            `}
                            >
                                <div
                                    className="w-3 h-3 rounded-full border border-black/20"
                                    style={{ backgroundColor: tool.color }}
                                />
                                {tool.label}
                            </div>
                        ))}
                    </div>

                    <hr className="mb-4" />

                    <h3 className="text-sm font-semibold mb-2 text-neutral-900">LAYERS</h3>

                    {/* Dynamic layer panel — derived from placed bricks, scrollable */}
                    <div
                        className="flex-1 min-h-0 space-y-3 overflow-y-auto"
                        style={{ scrollbarWidth: "none" }}
                    >
                        {usedLayers.length === 0 && (
                            <p className="text-xs text-gray-400">No bricks placed yet.</p>
                        )}
                        {usedLayers.map((layerNum) => {
                            const layerBricks = bricks.filter((b) => b.layer === layerNum);
                            return (
                                <div key={layerNum}>
                                    <p className="text-xs font-semibold text-gray-500 mb-1">Layer {layerNum}</p>
                                    <div className="space-y-1">
                                        {layerBricks.map((brick) => (
                                            <div
                                                key={brick.id}
                                                className="flex items-center px-3 py-1.5 rounded text-xs bg-white text-black"
                                            >
                                                <span>{brick.dimensions[0]}×{brick.dimensions[2]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* cad canvas: right-drag orbits, scroll to zoom, long-press right shows context menu */}
                <div
                    className="flex-1 relative"
                    style={{ height: "calc(100vh - 56px)" }}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onContextMenu={(e) => e.preventDefault()}
                    onClick={closeCtxMenu}
                >
                    <Canvas
                        camera={{ position: [10, 10, 10], fov: 50 }}
                        shadows
                        style={{ width: "100%", height: "100%", background: "#F1F2F4" }}
                    >
                        <ambientLight intensity={0.9} />
                        <directionalLight position={[10, 20, 10]} intensity={0.5} castShadow />

                        <Baseplate
                            size={BASEPLATE_SIZE}
                            currentTool={currentTool}
                            onPlaceBrick={handlePlaceBrick}
                        />

                        <ObjectiveModel targetBricks={targetData as BrickData[]} />

                        {bricks.map((brick) => (
                            <Brick
                                key={brick.id}
                                position={brick.position}
                                dimensions={brick.dimensions}
                                color={brick.color}
                                currentTool={currentTool}
                                onPlaceBrick={handlePlaceBrick}
                                onDelete={() => deleteBrick(brick.id)}
                            />
                        ))}

                        <OrbitControls
                            makeDefault
                            mouseButtons={{
                                LEFT: undefined as unknown as THREE.MOUSE,
                                MIDDLE: THREE.MOUSE.DOLLY,
                                RIGHT: THREE.MOUSE.ROTATE,
                            }}
                        />
                        <CameraResetter onReady={handleCameraReady} />
                    </Canvas>


                    {/* Right-click context menu */}
                    {ctxMenu && (
                        <div
                            className="fixed z-50 bg-white border border-gray-200 rounded-md shadow-md py-1 min-w-[160px] text-sm text-black"
                            style={{ top: ctxMenu.y, left: ctxMenu.x }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={handleResetCamera}
                                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                            >
                                Reset camera
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function CadSession() {
    return (
        <Suspense>
            <CadSessionInner />
        </Suspense>
    );
}