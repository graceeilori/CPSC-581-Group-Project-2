"use client";

import Link from "next/link";

export default function BridgeComingSoon() {
    return (
        <div className="flex flex-col bg-canvas items-center justify-center gap-4" style={{ height: "100vh" }}>
            <p className="text-neutral-900 text-lg"> Module details coming soon </p>
            <Link
                href="/expert/module-library"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-100 hover:bg-primary-100/90 text-white font-medium rounded-xl transition-colors w-40"
            >
                Back to Library
            </Link>
            
        </div>

    );
}
