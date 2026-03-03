"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Baseplate } from "@/components/Baseplate";

function CameraResetter({ onReady }: { onReady: (reset: () => void) => void }) {
  const { controls } = useThree();
  useEffect(() => {
    if (controls && typeof (controls as OrbitControlsImpl).reset === "function") {
      onReady(() => (controls as OrbitControlsImpl).reset());
    }
  }, [controls]);
  return null;
}

export default function CadSession() {
  const [selectedTool, setSelectedTool] = useState("Brick 2x4");
  const [showSettings, setShowSettings] = useState(false);
  const [baseplateSize, setBaseplateSize] = useState(12);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const resetCameraRef = useRef<(() => void) | null>(null);

  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pressOrigin = useRef<{ x: number; y: number } | null>(null);
  const LONG_PRESS_MS = 500;
  const DRAG_THRESHOLD_PX = 8;

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

  function expandIfNearEdge(gridX: number, gridZ: number) {
    const half = baseplateSize / 2;
    if (Math.abs(gridX) >= half - 2 || Math.abs(gridZ) >= half - 2) {
      setBaseplateSize((prev) => prev + 6);
    }
  }

  const tools = [
    "Brick 2x4",
    "Brick 2x2",
    "Plate 1x2",
    "Brick 1x4",
    "Plate 2x2",
    "Brick 1x1",
  ];

  const layers = [
    { name: "Layer 1", status: "complete" },
    { name: "Layer 2", status: "in-progress" },
    { name: "Layer 3", status: "locked" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-200">

      {/* top */}
      <div className="h-14 bg-white shadow flex items-center justify-between px-6">

        {/* student name*/}
        <div className="font-semibold text-black">Student Name</div>

        {/* module name */}
        <div className="font-medium text-gray-600">
          Introduction to CAD
        </div>

        {/* right buttons */}
        <div className="flex items-center gap-4">
          <button className="px-3 py-1 border rounded hover:bg-gray-100 text-black">
            Talk
          </button>

          <span className="text-green-600 text-sm font-semibold">
            Phone Linked
          </span>

          <button className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600">
            Leave Class
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

      {/* bottom section */}
      <div className="flex flex-1">

        {/* sidebar */}
        <div className="w-64 bg-gray-100 p-4 border-r flex flex-col">

          <h3 className="text-sm font-semibold mb-2 text-black">ELEMENTS</h3>

          <input
            type="text"
            placeholder="Search shapes..."
            className="mb-4 p-2 rounded border text-sm text-black"
          />

          {/* brickss grid */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {tools.map((tool) => (
              <div
                key={tool}
                onClick={() => setSelectedTool(tool)}
                className={`p-4 rounded-lg text-center cursor-pointer transition text-sm text-black
                  ${selectedTool === tool
                    ? "bg-indigo-200 border border-indigo-500"
                    : "bg-gray-200 hover:bg-gray-300"
                  }
                `}
              >
                {tool}
              </div>
            ))}
          </div>

          <hr className="mb-4" />

          <h3 className="text-sm font-semibold mb-2 text-black">SELECT LAYERS</h3>

          <div className="space-y-2">
            {layers.map((layer) => {
              const isComplete = layer.status === "complete";
              const isInProgress = layer.status === "in-progress";
              const isLocked = layer.status === "locked";

              return (
                <div
                  key={layer.name}
                  className={`flex justify-between items-center px-3 py-2 rounded text-sm text-black
                    ${isLocked
                      ? "bg-gray-200 text-gray-600"
                      : "bg-white"
                    }
                  `}
                >
                  <span>{layer.name}</span>

                  {isComplete && (
                    <span className="text-green-600">
                      Complete
                    </span>
                  )}

                  {isInProgress && (
                    <span className="text-indigo-600">
                      In Progress
                    </span>
                  )}

                  {isLocked && (
                    <span>Locked</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* cad canvas — right-drag orbits, scroll to zoom, long-press right shows context menu */}
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
            camera={{ position: [8, 8, 8], fov: 50 }}
            style={{ backgroundColor: "var(--color-canvas)" }}
            shadows
          >
            <ambientLight intensity={0.7} />
            <directionalLight position={[10, 20, 10]} intensity={1.2} />
            <Baseplate size={baseplateSize} />
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