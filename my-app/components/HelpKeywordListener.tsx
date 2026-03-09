"use client";

import { useEffect, useRef, useState } from "react";
import { socket } from "@/lib/socket";

declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export default function HelpKeywordListener({ disabled = false }: { disabled?: boolean }) {
  const [liveTranscript, setLiveTranscript] = useState("");
  const [status, setStatus] = useState("Starting...");
  const recognitionRef = useRef<any>(null);
  const shouldKeepListeningRef = useRef(true);
  const lastSentRef = useRef<number | null>(null);

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
        const now = Date.now();
        const cooldown = 30_000; // 30 second delay before next help notification can be sent

        // Only send notification at most once per cooldown. Show popup only when a send occurs.
        if (!lastSentRef.current || now - lastSentRef.current >= cooldown) {
          lastSentRef.current = now;

          (async () => {
            try {
              const res = await fetch('/api/send-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Student has asked for help' }),
              });

              if (res.ok) {
                // notify experts via socket as well
                try {
                  if (!socket.connected) socket.connect();
                  socket.emit("student:help");
                } catch (err) {
                  console.error("Failed to emit help socket event:", err);
                }

                alert('Notification\n\nYou have requested help. Your professor has been notified.');
              } else {
                console.error('Notification endpoint returned error:', res.statusText || res.status);
              }
            } catch (error) {
              console.error('Failed to send notification:', error);
            }
          })();
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setStatus(`Error: ${event.error}`);
    };

    recognition.onend = () => {
      if (!shouldKeepListeningRef.current) {
        setStatus("Stopped.");
        return;
      }
      if (disabled) {
        setStatus("Paused.");
        return;
      }
      try {
        recognition.start();
      } catch (error) {
        console.error("Recognition restart failed:", error);
      }
    };

    try {
      if (!disabled) recognition.start();
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
  }, [disabled]);

  return (
    <div className="mt-6 w-full max-w-2xl rounded-lg bg-white/10 p-4 text-white">
      <div className="min-h-[80px] rounded bg-black/30 p-3 text-left">
        {liveTranscript || "Waiting for speech..."}
      </div>
    </div>
  );
}