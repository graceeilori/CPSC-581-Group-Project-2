"use client";

import { useState } from "react";

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("modules");

  const activities = [
  { name: "Getting Acquainted with CAD", status: "completed" },
  { name: "Learn Your Tools", status: "in-progress" },
  { name: "Sketching Basics", status: "locked" },
  { name: "3D Modeling Intro", status: "locked" },
  { name: "Mini-Project", status: "locked" },
  { name: "Assemblies", status: "locked" },
  { name: "Rendering Basics", status: "locked" },
  { name: "3D Modeling continued", status: "locked" },
  { name: "Module 1 Project", status: "locked" },
];

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* sidebar, navigate between tabs*/}
      <div className="w-64 bg-gray-100 p-6 border-r text-black">
        <div className="mb-8 text-lg font-bold text-black">Student_name</div>

        <nav className="space-y-2">
          <div
            onClick={() => setActiveTab("modules")}
            className={`px-4 py-2 rounded-lg cursor-pointer ${
              activeTab === "modules"
                ? "bg-indigo-200 text-indigo-700"
                : "hover:bg-gray-200"  }`}>
            Module Library
          </div>

          <div
            onClick={() => setActiveTab("alerts")}
            className={`px-4 py-2 rounded-lg cursor-pointer ${
              activeTab === "alerts"
                ? "bg-indigo-200 text-indigo-700"
                : "hover:bg-gray-200"  }`} >
            Your Progress
          </div>
        </nav>
      </div>

      {/* content area */}
      <div className="flex-1 p-10">

        {/* modules, can have status set up above */}
        {activeTab === "modules" && (
        <>
            <h2 className="text-2xl font-bold mb-8 text-black">Module Library</h2>

            <div className="grid grid-cols-3 gap-6">
            {activities.map((activity, index) => {
                const isLocked = activity.status === "locked";
                const isCompleted = activity.status === "completed";
                const isInProgress = activity.status === "in-progress";

                return (
                <div
                    key={index}
                    className={`rounded-xl shadow p-8 flex flex-col items-center justify-center text-center transition cursor-pointer text-black
                    ${
                        isLocked
                        ? "bg-gray-200 text-gray-600 cursor-not-allowed"
                        : "bg-white hover:shadow-lg"
                    }
                    `}
                >
                    <span className="font-semibold mb-4">
                    {activity.name}
                    </span>

                    {isCompleted && (
                    <span className="text-green-600 text-sm font-semibold">
                        ✓ Completed
                    </span>
                    )}

                    {isInProgress && (
                    <span className="text-yellow-600 text-sm font-semibold">
                        In Progress
                    </span>
                    )}

                    {isLocked && (
                    <span className="text-gray-500 text-sm">
                        🔒 Locked
                    </span>
                    )}
                </div>
                );
            })}
            </div>
        </>
        )}

        {/* alert section */}
        {activeTab === "alerts" && (
          <>
            <h2 className="text-2xl font-bold mb-8 text-black">
              Your Progress
            </h2>

            <div className="space-y-4">
              <div className="bg-red-300 p-4 rounded text-black">
                You requested help
              </div>
              <div className="bg-blue-300 p-4 rounded text-black">
                You started activity "Learn Your Tools"
              </div>
              <div className="bg-blue-300 p-4 rounded text-black">
                You completed activity "Getting Acquainted with CAD"
              </div>
              <div className="bg-blue-300 p-4 rounded text-black">
                You started activity "Getting Acquainted with CAD"
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}