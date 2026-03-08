"use client";

import HelpKeywordListener from "../../components/HelpKeywordListener";

export default function VoiceTestPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">Voice Test Page</h1>
      <HelpKeywordListener />
    </main>
  );
}