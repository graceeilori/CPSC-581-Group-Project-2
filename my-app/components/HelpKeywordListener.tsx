"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export default function HelpKeywordListener() {
  const [liveTranscript, setLiveTranscript] = useState("");
  const [status, setStatus] = useState("Starting...");
  const recognitionRef = useRef<any>(null);
  const shouldKeepListeningRef = useRef(true);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("Speech recognition is not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setStatus("Listening...");
    };

    recognition.onresult = (event: any) => {
      let transcript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript + " ";
      }

      const cleanedTranscript = transcript.trim();
      setLiveTranscript(cleanedTranscript);

      if (/\bhelp\b/i.test(cleanedTranscript)) {
        alert("Help keyword detected.");
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setStatus(`Error: ${event.error}`);
    };

    recognition.onend = () => {
      if (shouldKeepListeningRef.current) {
        try {
          recognition.start();
        } catch (error) {
          console.error("Recognition restart failed:", error);
        }
      } else {
        setStatus("Stopped.");
      }
    };

    try {
      recognition.start();
    } catch (error) {
      console.error("Recognition start failed:", error);
      setStatus("Could not start speech recognition.");
    }

    return () => {
      shouldKeepListeningRef.current = false;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error("Recognition stop failed:", error);
        }
      }
    };
  }, []);

  return (
    <div className="mt-6 w-full max-w-2xl rounded-lg bg-white/10 p-4 text-white">
      <h2 className="text-xl font-semibold mb-2">Speech Test</h2>
      <p className="mb-2">Status: {status}</p>
      <p className="mb-2 font-medium">Live Transcript:</p>
      <div className="min-h-[80px] rounded bg-black/30 p-3 text-left">
        {liveTranscript || "Waiting for speech..."}
      </div>
    </div>
  );
}