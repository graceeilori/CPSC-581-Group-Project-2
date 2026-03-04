"use client";

import { useState } from "react";
import Link from "next/link";

export default function ExpertDashboard() {
  const [activeTab, setActiveTab] = useState("modules");

  const activities = [
    { name: "The Wall" },
    { name: "The Pyramid" },
    { name: "The Bridge" },
  ];

  const students = [
    { name: "JJ.", needsHelp: false },
    { name: "Chris.", needsHelp: true },
    { name: "Caleb.", needsHelp: false },
    { name: "Grace.", needsHelp: false },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">

        <div className="flex items-center gap-3 px-5 py-4">
          <div className="w-8 h-8 rounded bg-indigo-600 flex-shrink-0" />
          <span className="font-semibold text-gray-900 text-md">App Name</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-4">

          {/* Classroom */}
          <button
            onClick={() => setActiveTab("classroom")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-md font-medium transition cursor-pointer
              ${activeTab === "classroom"
                ? "bg-primary-100/10 text-primary-100"
                : "text-gray-700"
              }`}
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
              ${activeTab === "modules"
                ? "bg-primary-100/10 text-primary-100"
                : "text-gray-700"
              }`}
          >
            <img
              src={activeTab === "modules" ? "/assets/box-blue.svg" : "/assets/box.svg"}
              alt="Module Library"
              className="w-6 h-6 flex-shrink-0"
            />
            Module Library
          </button>

          {/* Activity & Alerts */}
          <button
            onClick={() => setActiveTab("alerts")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-md font-medium transition cursor-pointer
              ${activeTab === "alerts"
                ? "bg-primary-100/10 text-primary-100"
                : "text-gray-700"
              }`}
          >
            <img
              src={activeTab === "alerts" ? "/assets/activity-blue.svg" : "/assets/activity.svg"}
              alt="Activity & Alerts"
              className="w-6 h-6 flex-shrink-0"
            />
            Activity &amp; Alerts
            {/* chevron */}
            <svg className="w-3 h-3 ml-auto text-gray-400" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M2 4l4 4 4-4" />
            </svg>
          </button>
        </nav>
      </aside>

      <div className="flex flex-col flex-1 min-w-0">
        <header className="h-14 flex-shrink-0 bg-white border-b border-gray-200" />

        <main className="flex-1 overflow-y-auto bg-gray-50 px-10 py-8">

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
                    {/* Image placeholder */}
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

          {/* Classroom */}
          {activeTab === "classroom" && (
            <>
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Classroom</h1>
                <button className="px-5 py-2 bg-primary-100 text-white text-sm font-medium rounded-lg hover:bg-primary-100/90 transition">
                  Start New Session
                </button>
              </div>

              <div className="grid grid-cols-3 gap-6">
                {students.map((student, i) => (
                  <div
                    key={i}
                    className={`bg-white rounded-md overflow-hidden border ${student.needsHelp ? "border-red-400" : "border-gray-200"}`}
                  >
                    <div className="flex justify-between items-center px-4 py-2 bg-gray-50 border-b border-gray-100">
                      <span className="font-medium text-sm text-gray-900">{student.name}</span>
                      {student.needsHelp && (
                        <span className="text-xs font-semibold text-red-500">Needs Help</span>
                      )}
                    </div>
                    <div className="h-36 flex items-center justify-center bg-gray-100">
                      <img src="/cad.jpeg" alt="preview" className="w-20 opacity-60" />
                    </div>
                  </div>
                ))}
              </div>
            </>
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
    </div>
  );
}