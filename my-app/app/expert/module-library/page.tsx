"use client";

import { useState } from "react";

export default function ExpertDashboard() {
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

  const students = [
    { name: "JJ.", needsHelp: false },
    { name: "Chris.", needsHelp: true },
    { name: "Caleb.", needsHelp: false },
    { name: "Grace.", needsHelp: false },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* sidebar*/}
      <div className="w-64 bg-gray-100 p-6 border-r text-black">
        <div className="mb-8 text-lg font-bold text-black">Expert_name</div>

        <nav className="space-y-2">
          <div
            onClick={() => setActiveTab("classroom")}
            className={`px-4 py-2 rounded-lg cursor-pointer ${
              activeTab === "classroom"
                ? "bg-indigo-200 text-indigo-700"
                : "hover:bg-gray-200" }`}>
            Classroom
          </div>

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
            Activity & Alerts
          </div>
        </nav>
      </div>

      {/* content area */}
      <div className="flex-1 p-10">

        {/* module library area, no need for status on expertview */}
        {activeTab === "modules" && (
          <>
            <h2 className="text-2xl font-bold mb-8 text-black">Module Library</h2>

            <div className="grid grid-cols-3 gap-6">
              {activities.map((activity, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow p-8 flex items-center justify-center text-center hover:shadow-lg transition cursor-pointer"
                >
                  <span className="font-semibold text-black">
                    {activity.name}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* classroom section */}
        {activeTab === "classroom" && (
          <>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold mb-8 text-black">Classroom</h2>

           <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition" >
            Start New Session
            </button>
        </div>
          <div className="grid grid-cols-3 gap-6">
              {students.map((student, index) => (
                <div
                  key={index}
                  className={`bg-white rounded-xl shadow overflow-hidden ${
                    student.needsHelp ? "border-2 border-red-500" : ""
                  }`}
                >
                  {/* student name and need help */}
                  <div className="flex justify-between items-center px-4 py-2 bg-gray-50">
                    <span className="font-semibold text-sm text-black">
                      {student.name}
                    </span>

                    {student.needsHelp && (
                      <span className="text-xs text-red-500 font-semibold">
                        Needs Help
                      </span>
                    )}
                  </div>

                  {/* user photo (need to modify)*/}
                  <div className="h-40 flex items-center justify-center bg-gray-200">
                    <img
                      src="/cad.jpeg"
                      alt="preview"
                      className="w-20 opacity-70"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* alerts section */}
        {activeTab === "alerts" && (
          <>
            <h2 className="text-2xl font-bold mb-8 text-black">
              Activity & Alerts
            </h2>

            <div className="space-y-4">
              <div className="bg-red-300 p-4 rounded text-black">
                Chris requested help in Module 1
              </div>
              <div className="bg-blue-300 p-4 rounded text-black">
                Grace completed activity "Sketching Basics"
              </div>
              <div className="bg-blue-300 p-4 rounded text-black">
                JJ completed activity "Constraints & Dimensions"
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
}