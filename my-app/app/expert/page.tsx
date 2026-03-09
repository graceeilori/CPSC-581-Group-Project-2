"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { socket } from "@/lib/socket";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Baseplate } from "@/components/Baseplate";
import { Brick } from "@/components/Brick";
import { ObjectiveModel } from "@/components/ObjectiveModel";
import wallData from "@/modules/wall.json";
import pyramidData from "@/modules/pyramid.json";
import { type BrickData } from "@/components/Workspace";

interface StudentEntry {
  socketId: string;
  name: string;
  needsHelp: boolean;
  bricks: unknown[];
}

interface ActiveSession {
  code: string;
  sessionName: string;
  module: string;
  students: StudentEntry[];
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
    .slice(0, 2);
}

function StudentPreviewCanvas({ student, module, isThumbnail = true }: { student: StudentEntry, module: string, isThumbnail?: boolean }) {
  const isPyramid = module === "The Pyramid";
  const targetData = isPyramid ? pyramidData.targetData : wallData.targetData;
  const currentTool: [number, number, number] = [2, 1, 4]; // Dummy tool for rendering since we disable interactions

  return (
    <div className={`w-full h-full ${isThumbnail ? "pointer-events-none" : ""}`}>
      <Canvas
        camera={{ position: [10, 8, 10], fov: 50 }}
        style={{ background: "#F1F2F4" }}
      >
        <ambientLight intensity={0.9} />
        <directionalLight position={[10, 20, 10]} intensity={0.5} />

        <Baseplate size={10} currentTool={currentTool} />
        <ObjectiveModel targetBricks={targetData as BrickData[]} />

        {(student.bricks as BrickData[]).map((brick) => (
          <Brick
            key={brick.id}
            position={brick.position}
            dimensions={brick.dimensions}
            color={brick.color}
            currentTool={currentTool}
          />
        ))}

        <OrbitControls
          autoRotate={isThumbnail}
          autoRotateSpeed={2}
          enablePan={!isThumbnail}
          enableZoom={!isThumbnail}
          minDistance={5}
          maxDistance={30}
        />
      </Canvas>
    </div>
  );
}

function ExpertDashboardInner() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") ?? "classroom");

  const [showModal, setShowModal] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [selectedModule, setSelectedModule] = useState("The Wall");
  const [isCreating, setIsCreating] = useState(false);
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [selectedStudentSocketId, setSelectedStudentSocketId] = useState<string | null>(null);
  // WebRTC voice chat state for expert
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const [isTalking, setIsTalking] = useState(false);
  const [helpAlert, setHelpAlert] = useState<{ socketId: string; name: string } | null>(null);

  const activities = [
    { name: "The Wall" },
    { name: "The Pyramid" },
    { name: "The Bridge" },
    { name: "Create New Module" },
  ];

  // Socket event listeners
  const handleStudentJoined = useCallback(
    ({ socketId, name }: { socketId: string; name: string }) => {
      setActiveSession((prev) => {
        if (!prev) return prev;
        // If same socket rejoins (e.g. page back + rejoin), update their name
        if (prev.students.some((s) => s.socketId === socketId)) {
          return {
            ...prev,
            students: prev.students.map((s) =>
              s.socketId === socketId ? { ...s, name } : s
            ),
          };
        }
        return {
          ...prev,
          students: [...prev.students, { socketId, name, needsHelp: false, bricks: [] }],
        };
      });
    },
    []
  );

  const handleStudentLeft = useCallback(({ socketId }: { socketId: string }) => {
    setActiveSession((prev) => {
      if (!prev) return prev;
      return { ...prev, students: prev.students.filter((s) => s.socketId !== socketId) };
    });
  }, []);

  const handleBoardUpdate = useCallback(
    ({ socketId, bricks }: { socketId: string; bricks: unknown[] }) => {
      setActiveSession((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          students: prev.students.map((s) =>
            s.socketId === socketId ? { ...s, bricks } : s
          ),
        };
      });
    },
    []
  );

  const handleStudentHelp = useCallback(({ socketId, name }: { socketId: string; name: string }) => {
    setActiveSession((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        students: prev.students.map((s) => s.socketId === socketId ? { ...s, needsHelp: true } : s),
      };
    });
    setHelpAlert({ socketId, name });
  }, []);

  useEffect(() => {
    socket.on("student:joined", handleStudentJoined);
    socket.on("student:left", handleStudentLeft);
    socket.on("board:update", handleBoardUpdate);
    socket.on("student:help", handleStudentHelp);
    // WebRTC signaling handlers
    const onOffer = async ({ from, sdp }: any) => {
      try {
        if (!localStreamRef.current) {
          localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
        }
        const pc = new RTCPeerConnection();
        pcRef.current = pc;

        pc.onicecandidate = (e) => {
          if (e.candidate) socket.emit('webrtc:ice-candidate', { to: from, candidate: e.candidate });
        };

        pc.ontrack = (ev) => {
          if (!remoteAudioRef.current) {
            const a = document.createElement('audio');
            a.autoplay = true;
            remoteAudioRef.current = a;
            document.body.appendChild(a);
          }
          remoteAudioRef.current.srcObject = ev.streams[0];
        };

        localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('webrtc:answer', { to: from, sdp: pc.localDescription });
        setIsTalking(true);
      } catch (err) {
        console.error('Expert failed to handle offer', err);
      }
    };

    const onAnswer = async ({ from, sdp }: any) => {
      try {
        if (!pcRef.current) return;
        const pc = pcRef.current;
        // Normalize signalingState to remove stray CR characters and compare reliably
        const state = String(pc.signalingState).replace(/\r/g, '');
        if (sdp && sdp.type === 'answer') {
          if (state === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          } else {
            console.warn('Ignoring answer — RTCPeerConnection in unexpected state:', state);
          }
        } else {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
          } catch (err) {
            console.error('Expert failed to handle answer', err);
          }
        }
      } catch (err) {
        console.error('Expert failed to handle answer', err);
      }
    };

    const onIce = ({ from, candidate }: any) => {
      try {
        if (pcRef.current && candidate) pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error('Expert failed to add ICE', err);
      }
    };

    socket.on('webrtc:offer', onOffer);
    socket.on('webrtc:answer', onAnswer);
    socket.on('webrtc:ice-candidate', onIce);
    return () => {
      socket.off("student:joined", handleStudentJoined);
      socket.off("student:left", handleStudentLeft);
      socket.off("board:update", handleBoardUpdate);
      socket.off("student:help", handleStudentHelp);
      socket.off('webrtc:offer', onOffer);
      socket.off('webrtc:answer', onAnswer);
      socket.off('webrtc:ice-candidate', onIce);
    };
  }, [handleStudentJoined, handleStudentLeft, handleBoardUpdate, handleStudentHelp]);

  async function startVoice() {
    if (!selectedStudentSocketId) {
      alert('Select a student to talk to first.');
      return;
    }
    const target = selectedStudentSocketId;
    try {
      localStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const pc = new RTCPeerConnection();
      pcRef.current = pc;

      pc.onicecandidate = (e) => {
        if (e.candidate) socket.emit('webrtc:ice-candidate', { to: target, candidate: e.candidate });
      };

      pc.ontrack = (ev) => {
        if (!remoteAudioRef.current) {
          const a = document.createElement('audio');
          a.autoplay = true;
          remoteAudioRef.current = a;
          document.body.appendChild(a);
        }
        remoteAudioRef.current.srcObject = ev.streams[0];
      };

      localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current!));
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc:offer', { to: target, sdp: pc.localDescription });
      setIsTalking(true);
    } catch (err) {
      console.error('Expert failed to start voice', err);
      stopVoice();
    }
  }

  function stopVoice() {
    setIsTalking(false);
    try {
      if (pcRef.current) {
        pcRef.current.getSenders().forEach((s) => { try { s.track?.stop(); } catch {} });
        pcRef.current.close();
        pcRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
      }
      if (remoteAudioRef.current) {
        try { remoteAudioRef.current.remove(); } catch {};
        remoteAudioRef.current = null;
      }
    } catch (err) {
      console.error('Expert failed to stop voice', err);
    }
  }

  // Handlers
  function handleOpenClassroom() {
    if (!sessionName.trim()) return;
    setIsCreating(true);

    if (!socket.connected) socket.connect();

    socket.emit(
      "session:create",
      { className: sessionName.trim(), module: selectedModule },
      (res: { code?: string; error?: string }) => {
        setIsCreating(false);
        if (res.error) {
          alert(res.error);
          return;
        }
        setShowModal(false);
        setActiveSession({ code: res.code!, sessionName: sessionName.trim(), module: selectedModule, students: [] });
        setSessionName("");
        setSelectedModule("The Wall");
      }
    );
  }

  function handleEndSession() {
    socket.emit("session:end");
    setActiveSession(null);
  }

  function handleCancel() {
    setShowModal(false);
    setSessionName("");
    setSelectedModule("The Wall");
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">

        <Link href="/" className="flex items-center gap-3 px-5 py-4 hover:opacity-80 transition">
          <div className="w-8 h-8 rounded bg-primary-100 flex-shrink-0" />
          <span className="font-semibold text-gray-900 text-md">App Name</span>
        </Link>

        <nav className="flex-1 px-3 py-4 space-y-4">

          <button
            onClick={() => setActiveTab("classroom")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-md font-medium transition cursor-pointer
              ${activeTab === "classroom" ? "bg-primary-100/10 text-primary-100" : "text-gray-700"}`}
          >
            <img
              src={activeTab === "classroom" ? "/assets/teaching-blue.svg" : "/assets/teaching.svg"}
              alt="Classroom"
              className="w-6 h-6 flex-shrink-0"
            />
            Classroom
          </button>

          <button
            onClick={() => setActiveTab("modules")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-md font-medium transition cursor-pointer
              ${activeTab === "modules" ? "bg-primary-100/10 text-primary-100" : "text-gray-700"}`}
          >
            <img
              src={activeTab === "modules" ? "/assets/box-blue.svg" : "/assets/box.svg"}
              alt="Module Library"
              className="w-6 h-6 flex-shrink-0"
            />
            Module Library
          </button>

          <button
            onClick={() => setActiveTab("alerts")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-md font-medium transition cursor-pointer
              ${activeTab === "alerts" ? "bg-primary-100/10 text-primary-100" : "text-gray-700"}`}
          >
            <img
              src={activeTab === "alerts" ? "/assets/activity-blue.svg" : "/assets/activity.svg"}
              alt="Activity & Alerts"
              className="w-6 h-6 flex-shrink-0"
            />
            Activity &amp; Alerts
            <svg className="w-3 h-3 ml-auto text-gray-400" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 4l4 4 4-4" />
            </svg>
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">

        <header className="h-14 flex-shrink-0 bg-white border-b border-gray-200 flex items-center justify-center px-6">
          {activeSession && (
            <span className="text-sm text-gray-400">{activeSession.sessionName}</span>
          )}
        </header>

        <main className="flex flex-col flex-1 overflow-y-auto bg-gray-50 px-10 py-8">

          {/* Module Library */}
          {activeTab === "modules" && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Module Library</h1>
              <div className="grid grid-cols-3 gap-6">
                {activities.map((activity, i) => (
                  <Link
                    key={i}
                    href={`/expert/module-library/${i}`}
                    className="group bg-white rounded-md overflow-hidden border border-gray-200 cursor-pointer"
                  >
                    <div className="h-48 bg-[#dce8f5]" />
                    <div className="px-4 py-3 border-t border-gray-100">
                      <span className="text-md font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">
                        {activity.name}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {/* Classroom — empty state */}
          {activeTab === "classroom" && !activeSession && (
            <div className="flex flex-col items-center justify-center h-full gap-4">
              <img
                src="/assets/blocks-illustration.svg"
                alt="No active session"
                className="w-80 select-none"
              />
              <button
                onClick={() => setShowModal(true)}
                className="px-6 py-3 bg-primary-100 rounded-2xl inline-flex justify-center items-center gap-2 hover:bg-indigo-700 transition"
              >
                <span className="text-white text-md font-medium leading-6">Start New Session</span>
              </button>
            </div>
          )}

          {/* Classroom — active session */}
          {activeTab === "classroom" && activeSession && (
            <div className="flex flex-col gap-6">

              {/* Join code banner */}
              <div className="flex items-center justify-between bg-white border border-indigo-100 rounded-2xl px-6 py-4">
                <div className="flex items-center gap-4">
                  <span className="text-md font-semibold text-neutral-900">Join Code:</span>
                  <span className="text-4xl font-bold tracking-[0.25em] text-primary-100">
                    {activeSession.code}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleEndSession}
                    className="rounded-lg flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition"
                  >
                    <img
                      src="/assets/exit.svg"
                      alt="Exit"
                      className="w-4 h-4 flex-shrink-0"
                    />
                    End session
                  </button>
                </div>
              </div>

              {/* Student grid — empty waiting state */}
              {activeSession.students.length === 0 && (
                <div className="flex flex-col items-center justify-center flex-1 gap-3 py-16 text-gray-400">
                  <img
                    src="/assets/user-multiple.svg"
                    className="w-32 select-none"
                  />
                  <p className="text-sm">Waiting for students to join…</p>
                </div>
              )}

              {/* Student grid — populated */}
              {activeSession.students.length > 0 && (
                <div className="grid grid-cols-3 gap-5">
                  {activeSession.students.map((student) => (
                    <div
                      key={student.socketId}
                      onClick={() => setSelectedStudentSocketId(student.socketId)}
                      className={`bg-white rounded-xl overflow-hidden border cursor-pointer hover:shadow-md transition
                        ${student.needsHelp ? "border-red-400 shadow-red-100" : "border-gray-200"}`}
                    >
                      {/* Card header */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                          {/* Avatar */}
                          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-semibold text-indigo-600">{initials(student.name)}</span>
                          </div>
                          <span className="font-medium text-sm text-gray-900">{student.name}</span>
                        </div>
                        {student.needsHelp && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-50 text-red-600 text-xs font-semibold">
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                              <path d="M5 1a4 4 0 1 0 0 8A4 4 0 0 0 5 1zm0 6a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm.4-2.1-.1.6H4.7l-.1-.6V3.5h.8v1.4z" />
                            </svg>
                            Needs help
                          </span>
                        )}
                      </div>

                      {/* Board preview */}
                      <div className="h-36 flex items-center justify-center bg-[#E8EDF5] relative overflow-hidden">
                        <StudentPreviewCanvas student={student} module={activeSession.module} />
                        <div className="absolute bottom-2 right-2 bg-white/80 px-2 py-0.5 rounded text-[10px] font-semibold text-gray-500 backdrop-blur-sm shadow-sm pointer-events-none">
                          {student.bricks.length} {student.bricks.length === 1 ? "brick" : "bricks"}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Activity & Alerts */}
          {activeTab === "alerts" && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Activity &amp; Alerts</h1>
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg text-sm text-red-700">
                  Chris requested help in Module 1
                </div>
                <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg text-sm text-blue-700">
                  Grace completed activity "Sketching Basics"
                </div>
                <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg text-sm text-blue-700">
                  JJ completed activity "Constraints &amp; Dimensions"
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {/* New Session Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full px-6 py-4"
            style={{ maxWidth: 560 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3">
              <h2 className="text-lg font-bold text-neutral-900">New Session</h2>
              <button
                onClick={handleCancel}
                className="w-8 h-8 flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 transition text-gray-500"
                aria-label="Close"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M1 1l12 12M13 1L1 13" />
                </svg>
              </button>
            </div>
            <div className="border-t border-gray-100" />
            <div className="py-4 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Session Name</label>
                <input
                  type="text"
                  placeholder="e.g. Intro to Model Design"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-100/40 focus:border-primary-100 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Build Module</label>
                <div className="relative">
                  <select
                    value={selectedModule}
                    onChange={(e) => setSelectedModule(e.target.value)}
                    className="w-full appearance-none px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-100/40 focus:border-primary-100 transition cursor-pointer pr-10"
                  >
                    {activities
                      .filter((a) => a.name !== "Create New Module")
                      .map((a) => (
                        <option key={a.name} value={a.name}>{a.name}</option>
                      ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#1F1F1F" strokeWidth="1.8" strokeLinecap="round">
                      <path d="M3 5l4 4 4-4" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 py-3">
              <button
                onClick={handleCancel}
                className="px-5 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleOpenClassroom}
                disabled={!sessionName.trim() || isCreating}
                className="px-5 py-2 rounded-lg bg-primary-100 text-white text-sm font-medium hover:bg-primary-100/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? "Creating…" : "Open Classroom"}
              </button>
            </div>
          </div>
        </div>
      )}

      {helpAlert && (
        <div className="fixed top-6 right-6 z-60">
          <div className="bg-white border border-gray-200 shadow-lg rounded-lg p-4 w-80">
            <div className="font-semibold text-gray-900">Student {helpAlert.name} needs Help</div>
            <div className="mt-3 flex justify-end gap-2">
              <button
                onClick={() => setHelpAlert(null)}
                className="px-3 py-1 text-sm text-gray-700 rounded hover:bg-gray-100"
              >
                Dismiss
              </button>
              <button
                onClick={() => {
                  // navigate to classroom and open selected student's full view
                  setActiveTab("classroom");
                  setSelectedStudentSocketId(helpAlert.socketId);
                  // clear the alert
                  setHelpAlert(null);
                  // clear the needsHelp flag on the student in activeSession
                  setActiveSession((prev) => {
                    if (!prev) return prev;
                    return {
                      ...prev,
                      students: prev.students.map((s) => s.socketId === helpAlert.socketId ? { ...s, needsHelp: false } : s),
                    };
                  });
                }}
                className="px-3 py-1 bg-primary-100 text-white rounded text-sm"
              >
                Go Help
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Student View (Mimicking a new page) */}
      {selectedStudentSocketId && activeSession && (() => {
        const selectedStudent = activeSession.students.find(s => s.socketId === selectedStudentSocketId);
        if (!selectedStudent) return null;

        const isPyramid = activeSession.module === "The Pyramid";
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

        const studentBricks = selectedStudent.bricks as BrickData[];
        const usedLayers = Array.from(new Set(studentBricks.map((b) => b.layer))).sort((a, z) => a - z);

        return (
          <div className="fixed inset-0 z-50 flex flex-col h-screen overflow-hidden bg-gray-200">
            {/* Top Bar */}
            <div className="h-14 bg-white shadow flex items-center justify-between px-6 z-10">
              <button
                onClick={() => setSelectedStudentSocketId(null)}
                className="flex font-medium text-gray-700 hover:text-gray-900 transition items-center gap-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Back to Dashboard
              </button>

              <div className="font-medium text-gray-600">
                {selectedStudent.name}'s Workspace ({activeSession.module})
              </div>

              <div className="flex items-center gap-4 text-sm font-semibold text-gray-500">
                <div className="flex items-center gap-4">
                  <div>{studentBricks.length} {studentBricks.length === 1 ? 'brick' : 'bricks'} placed</div>
                  <button
                    onClick={() => { isTalking ? stopVoice() : startVoice(); }}
                    className={`px-3 py-1 rounded ${isTalking ? 'bg-green-600 text-white' : 'border hover:bg-gray-100 text-black'}`}
                  >
                    {isTalking ? 'Talking…' : 'Talk'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-1 min-h-0 overflow-hidden">
              {/* sidebar */}
              <div className="w-64 p-4 bg-white border-r border-gray-200 flex flex-col overflow-hidden min-h-0">
                <h3 className="text-sm font-semibold mb-4 text-neutral-900">AVAILABLE ELEMENTS</h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {tools.map((tool, idx) => (
                    <div key={idx} className="p-3 rounded-lg text-center text-xs font-medium text-gray-500 bg-gray-100 flex items-center justify-center gap-2 border border-gray-200 cursor-default opacity-80">
                      <div className="w-3 h-3 rounded-full border border-black/20" style={{ backgroundColor: tool.color }} />
                      {tool.label}
                    </div>
                  ))}
                </div>

                <hr className="mb-4" />

                <h3 className="text-sm font-semibold mb-2 text-neutral-900">STUDENT'S LAYERS</h3>
                <div className="flex-1 min-h-0 space-y-3 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
                  {usedLayers.length === 0 && (
                    <p className="text-xs text-gray-400">No bricks placed yet.</p>
                  )}
                  {usedLayers.map((layerNum) => {
                    const layerBricks = studentBricks.filter((b) => b.layer === layerNum);
                    return (
                      <div key={layerNum}>
                        <p className="text-xs font-semibold text-gray-500 mb-1">Layer {layerNum}</p>
                        <div className="space-y-1">
                          {layerBricks.map((brick) => (
                            <div key={brick.id} className="flex items-center px-3 py-1.5 rounded text-xs bg-gray-50 text-gray-700 border border-gray-100">
                              <span>{brick.dimensions[0]}×{brick.dimensions[2]} brick</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* cad canvas */}
              <div className="flex-1 relative bg-[#F1F2F4]">
                <StudentPreviewCanvas student={selectedStudent} module={activeSession.module} isThumbnail={false} />
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default function ExpertDashboard() {
  return (
    <Suspense>
      <ExpertDashboardInner />
    </Suspense>
  );
}