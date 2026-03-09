"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { socket } from "@/lib/socket";

interface ActiveSession {
  code: string;
  className: string;
  module: string;
  expertSocketId?: string;
}

function StudentDashboardInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") ?? "classroom");

  const [showModal, setShowModal] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [studentName, setStudentName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState("");
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const saved = sessionStorage.getItem("activeSession");
    if (saved) {
      try {
        setActiveSession(JSON.parse(saved));
      } catch (e) {
        // ignore
      }
    } else {
      setActiveSession(null);
    }
  }, [pathname]);

  useEffect(() => {
    if (activeSession) {
      sessionStorage.setItem("activeSession", JSON.stringify(activeSession));
    } else {
      sessionStorage.removeItem("activeSession");
    }
  }, [activeSession]);

  const activities = [
    { name: "The Pyramid", status: "completed" },
    { name: "Learn Your Tools", status: "in-progress" },
    { name: "Sketching Basics", status: "locked" },
    { name: "3D Modeling Intro", status: "locked" },
    { name: "Mini-Project", status: "locked" },
    { name: "Assemblies", status: "locked" },
    { name: "Rendering Basics", status: "locked" },
    { name: "3D Modeling continued", status: "locked" },
    { name: "Module 1 Project", status: "locked" },
  ];

  const handleSessionEnded = useCallback(() => {
    setActiveSession(null);
    alert("The expert ended the session.");
  }, []);

  useEffect(() => {
    socket.on("session:ended", handleSessionEnded);
    return () => { socket.off("session:ended", handleSessionEnded); };
  }, [handleSessionEnded]);

  function handleJoin() {
    if (!joinCode.trim() || !studentName.trim()) return;
    setIsJoining(true);
    setJoinError("");

    if (!socket.connected) socket.connect();

    socket.emit(
      "session:join",
      { code: joinCode.trim(), studentName: studentName.trim() },
      (res: { success?: boolean; className?: string; module?: string; error?: string }) => {
        setIsJoining(false);
        if (res.error) {
          setJoinError(res.error);
          return;
        }
        setActiveSession({
          code: joinCode.trim(),
          className: res.className ?? "",
          module: res.module ?? "The Wall",
          expertSocketId: (res as any).expertSocketId,
        });
        setShowModal(false);
        setJoinCode("");
      }
    );
  }

  function handleLeave() {
    socket.emit("session:leave");
    setActiveSession(null);
  }

  function handleCancel() {
    setShowModal(false);
    setJoinCode("");
    setJoinError("");
    
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

          {/* Classroom */}
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

          {/* Module Library */}
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

          {/* Your Progress */}
          <button
            onClick={() => setActiveTab("progress")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-md font-medium transition cursor-pointer
              ${activeTab === "progress" ? "bg-primary-100/10 text-primary-100" : "text-gray-700"}`}
          >
            <img
              src={activeTab === "progress" ? "/assets/activity-blue.svg" : "/assets/activity.svg"}
              alt="Your Progress"
              className="w-6 h-6 flex-shrink-0"
            />
            Your Progress
          </button>
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0">

        <header className="h-14 flex-shrink-0 bg-white border-b border-gray-200 flex items-center justify-center px-6">
        </header>

        <main className="flex flex-col flex-1 overflow-y-auto bg-gray-50 px-10 py-8">
          {!mounted ? null : (
            <>
              {/* Classroom tab (no session) */}
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
                    <span className="text-white text-md font-medium leading-6">Join Session</span>
                  </button>
                </div>
              )}

              {/* Classroom tab (in session) */}
              {activeTab === "classroom" && activeSession && (
                <div className="flex flex-col gap-6">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Active Class</h1>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <div className="bg-white rounded-xl overflow-hidden border border-gray-200 transition">
                      {/* Card header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-2.5">
                          <span className="font-semibold text-sm text-gray-900 truncate">
                            {activeSession.className}
                          </span>
                        </div>
                        {/* Pulsing live indicator */}
                        <span className="flex w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" title="Live Session"></span>
                      </div>

                      {/* Card body */}
                      <div className="p-4 flex flex-col gap-5">
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-2.5 border border-gray-100">
                          <span className="text-xs font-medium text-gray-500">Session Code</span>
                          <span className="text-sm font-bold tracking-[0.2em] text-primary-100">
                            {activeSession.code}
                          </span>
                        </div>

                        <div className="flex gap-2.5">
                          <button
                            onClick={() => router.push(`/student/classroom?sessionName=${encodeURIComponent(activeSession.className)}`)}
                            className="flex-1 py-2 bg-primary-100 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition"
                          >
                            Open Workspace
                          </button>
                          <button
                            onClick={handleLeave}
                            className="p-2 border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition flex items-center justify-center shrink-0 group"
                            title="Leave Class"
                          >
                            <img src="/assets/exit-red.svg" alt="Exit" className="w-5 h-5 flex-shrink-0" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Module Library tab */}
              {activeTab === "modules" && (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 mb-6">Module Library</h1>
                  <div className="grid grid-cols-3 gap-6">
                    {activities.map((activity, index) => {
                      const isLocked = activity.status === "locked";
                      const isCompleted = activity.status === "completed";
                      const isInProgress = activity.status === "in-progress";
                      return (
                        <div
                          key={index}
                          onClick={() => { if (!isLocked) router.push(`/student/work-area/${index}`); }}
                          className={`bg-white rounded-xl overflow-hidden border border-gray-200 cursor-pointer group transition
                        ${isLocked ? "opacity-50 cursor-not-allowed" : "hover:shadow-md hover:border-indigo-200"}`}
                        >
                          <div className="h-32 bg-[#dce8f5] flex items-center justify-center">
                            {isCompleted && (
                              <span className="text-3xl">✓</span>
                            )}
                            {isLocked && (
                              <span className="text-3xl">🔒</span>
                            )}
                          </div>
                          <div className="px-4 py-3 border-t border-gray-100">
                            <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-700 transition-colors">
                              {activity.name}
                            </span>
                            <div className="mt-1">
                              {isCompleted && <span className="text-xs text-green-600 font-semibold">Completed</span>}
                              {isInProgress && <span className="text-xs text-amber-500 font-semibold">In Progress</span>}
                              {isLocked && <span className="text-xs text-gray-400">Locked</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Your Progress tab */}
              {activeTab === "progress" && (
                <>
                  <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Progress</h1>
                  <div className="space-y-3">
                    <div className="bg-red-50 border border-red-200 px-4 py-3 rounded-lg text-sm text-red-700">
                      You requested help
                    </div>
                    <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg text-sm text-blue-700">
                      You started activity "Learn Your Tools"
                    </div>
                    <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg text-sm text-blue-700">
                      You completed activity "Getting Acquainted with CAD"
                    </div>
                    <div className="bg-blue-50 border border-blue-200 px-4 py-3 rounded-lg text-sm text-blue-700">
                      You started activity "Getting Acquainted with CAD"
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </main>
      </div>

      {/* Join Session Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        >
          <div
            className="bg-white rounded-lg shadow-2xl w-full px-6 py-4"
            style={{ maxWidth: 480 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3">
              <h2 className="text-lg font-bold text-neutral-900">Join Session</h2>
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

            <div className="py-4 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label>
                <input
                  type="text"
                  placeholder="e.g. Alex"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-100/40 focus:border-primary-100 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Session Code</label>
                <input
                  type="text"
                  placeholder="4-digit code"
                  maxLength={4}
                  value={joinCode}
                  onChange={(e) => { setJoinCode(e.target.value.replace(/\D/g, "")); setJoinError(""); }}
                  className={`w-full px-3 py-2.5 rounded-lg border bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition
                    ${joinError ? "border-red-400 focus:ring-red-200" : "border-gray-200 focus:ring-primary-100/40 focus:border-primary-100"}`}
                />
                {joinError && <p className="mt-1 text-xs text-red-500">{joinError}</p>}
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
                onClick={handleJoin}
                disabled={!joinCode.trim() || !studentName.trim() || isJoining}
                className="px-5 py-2 rounded-lg bg-primary-100 text-white text-sm font-medium hover:bg-primary-100/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? "Joining…" : "Join"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentDashboard() {
  return (
    <Suspense>
      <StudentDashboardInner />
    </Suspense>
  );
}