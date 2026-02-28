"use client";

import { useRouter } from "next/navigation";

export default function StudentHome() {
  const router = useRouter();

  return (
    
    <div className="min-h-screen flex flex-col bg-gray-100">

      {/* top bar */}
      <div className="flex justify-between items-center px-8 py-4 bg-white shadow text-black">
        <h1 className="text-xl font-semibold text-black">Student Portal</h1>

        {/* menu button*/}
        <div className="relative">
          <button  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition text-black"  >
            Menu
          </button>
        </div>
      </div>

      {/* top text */}
      <div className="flex justify-center mt-10">
        <h2 className="text-3xl font-bold text-black">
          Welcome Back, Student_Name
        </h2>
      </div>

      {/* modules */}
      <div className="flex-1 px-10 mt-10">
        <div className="bg-white rounded-xl shadow p-8 w-full">

          <h3 className="text-xl font-semibold mb-6 text-black">
            Your Modules
          </h3>

          <div className="grid grid-cols-2 gap-8">

            {/* module 1*/}
            <div
              onClick={() => router.push("/student/module-library")}
              className="relative h-64 rounded-xl overflow-hidden cursor-pointer group"
              style={{
                backgroundImage: "url('/intro.jpeg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
             
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/60 transition" />

              {/* module 1 text */}
              <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                <h4 className="text-white text-2xl font-bold z-10">
                  Module 1: Introduction to CAD
                </h4>
              </div>

              {/* hover stuff */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <p className="text-white text-2xl font-bold z-10">
                  16% Complete
                </p>
              </div>
            </div>

            {/* module 2, blocked off */}
            <div
              className="relative h-64 rounded-xl overflow-hidden cursor-not-allowed group opacity-80"
              style={{
                backgroundImage: "url('/lock.jpeg')",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="absolute inset-0 bg-black/50 group-hover:bg-black/70 transition" />


              {/* module 2 text */}
              <div className="absolute inset-0 flex items-center justify-center transition-opacity duration-300 group-hover:opacity-0">
                <h4 className="text-white text-2xl font-bold z-10">
                  Module 2: 3D Modeling Basics
                </h4>
              </div>

              {/* hover stuff */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                <p className="text-white text-2xl font-bold z-10">
                  Complete previous module to access
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}