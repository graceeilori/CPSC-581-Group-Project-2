"use client";

/**
 * //This handler needs to go in the same file that has the panic button
 * 
 * 
 async function handleNotificationClick() {
  try {
    const response = await fetch("/api/send-notification", {
      method: "POST",
    });

    const data = await response.json();

    if (!data.success) {
      console.error(data.error || "Failed to send notification email.");
    }
  } catch (error) {
    console.error("Request failed:", error);
  }
}

 * //Here is what would be attached to the button
<button onClick={handleNotificationClick}>
  Send Notification
</button>
 */


import { useState } from "react";

export default function TestEmailPage() {
  const [status, setStatus] = useState("");

  async function handleSendEmail() {
    try {
      setStatus("Sending...");

      const response = await fetch("/api/send-notification", {
        method: "POST",
      });

      const data = await response.json();

      if (data.success) {
        setStatus("Email sent successfully.");
      } else {
        setStatus(data.error || "Failed to send email.");
      }
    } catch (error) {
      console.error(error);
      setStatus("Something went wrong.");
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-3xl font-bold">Email Test Page</h1>

        <button
          onClick={handleSendEmail}
          className="px-6 py-3 border border-white rounded hover:bg-white hover:text-black transition"
        >
          Send Notification Email
        </button>

        <p>{status}</p>
      </div>
    </main>
  );
}