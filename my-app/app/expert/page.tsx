"use client";

import { useRouter } from "next/navigation";

export default function ExpertHome() {
  const router = useRouter();

  const students = [
    { id: "1", name: "JJ", progress: 64 },
    { id: "2", name: "Chris", progress: 16 },
    { id: "3", name: "Caleb", progress: 85 },
     { id: "4", name: "Grace", progress: 72 },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">

      {/* top Bar */}
      <div className="flex justify-between items-center px-8 py-4 bg-white shadow">
        <h1 className="text-xl font-semibold text-black">Expert Portal</h1>
        <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition text-black">
          Menu
        </button>
      </div>

      {/* main text */}
      <div className="flex justify-center mt-10">
        <h2 className="text-3xl font-bold text-black">
          Welcome, Expert_Name
        </h2>
      </div>

      {/* modules */}
      <div className="px-10 mt-10">
        <div className="bg-white rounded-xl shadow p-8 w-full">
          <h3 className="text-xl font-semibold mb-6 text-black">Modules</h3>

          <div className="grid grid-cols-3 gap-8">

            {/* module 1 */}
            <div
              onClick={() => router.push("/expert/module-library")}
              className="relative h-64 rounded-xl overflow-hidden cursor-pointer group"
              style={{
                backgroundImage: "url('/intro.jpeg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition" />

              {/* module text */}
              <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                <h4 className="text-white text-2xl font-bold z-10">
                  Module 1: Introduction to CAD
                </h4>
              </div>

              {/* hover  */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <p className="text-white text-lg font-semibold z-10">
                  Access Module Content
                </p>
              </div>
            </div>

            {/* module 2 */}
            <div
              onClick={() => router.push("/expert/module/2")}
              className="relative h-64 rounded-xl overflow-hidden cursor-pointer group"
              style={{
                backgroundImage: "url('/3d_model.jpg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition" />

              <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                <h4 className="text-white text-2xl font-bold z-10">
                  Module 2: 3D Modeling Basics
                </h4>
              </div>

              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <p className="text-white text-lg font-semibold z-10">
                  Access Module Content
                </p>
              </div>
            </div>

            {/* create new module button*/}
            <div
              className="relative h-64 rounded-xl overflow-hidden cursor-pointer group border-2 border-dashed border-gray-400 bg-gray-200 flex items-center justify-center"
            >
              <div className="flex flex-col items-center">
                <span className="text-5xl font-bold text-black">+</span>
                <p className="mt-4 text-lg font-semibold text-black">
                  Create New Module
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* classroom section */}
      <div className="px-10 mt-10">
        <div className="bg-white rounded-xl shadow p-8 w-full">
          <h3 className="text-xl font-semibold mb-6 text-black">Classroom</h3>

          <div className="grid grid-cols-3 gap-6">
            {students.map((student) => (
              <div
                key={student.id}
                onClick={() => router.push(`/expert/student/${student.id}`)}
                className="p-6 bg-gray-100 rounded-lg hover:bg-gray-200 cursor-pointer transition text-black"
              >
                <h4 className="font-bold text-lg">{student.name}</h4>
                <p className="mt-2 text-sm text-black">
                  Progress: {student.progress}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* alerts */}
      <div className="px-10 mt-10 mb-16">
        <div className="bg-white rounded-xl shadow p-8 w-full">
          <h3 className="text-xl font-semibold mb-6 text-black">
            Alerts & Notifications
          </h3>

          <ul className="space-y-4">
            <li className="p-4 bg-red-300 rounded text-black">
              Chris requested help in Module 1
            </li>
            <li className="p-4 bg-blue-300 rounded text-black">
              Grace completed activity "Sketching Basics"
            </li>
            <li className="p-4 bg-blue-300 rounded text-black">
              JJ completed activity "Constraints & Dimensions"
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
}