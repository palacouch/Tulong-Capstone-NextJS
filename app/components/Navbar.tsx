"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { auth } from "../lib/firebase"; // Based on your file structure

export default function Navbar() {
  const router = useRouter();

  const handleLogout = async () => {
    await auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="w-full bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between z-50">
      <div className="flex items-center gap-2">
        <span className="text-yellow-500 text-xl">🚨</span>
        <span className="font-bold text-white tracking-tight">Tulong</span>
      </div>

      <div className="flex items-center gap-8 text-sm font-medium text-gray-400">
        <Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
        <Link href="/group" className="hover:text-white transition-colors">Group</Link>
        <Link href="/tracker" className="hover:text-white transition-colors">Tracker</Link>
      </div>

      <button 
        onClick={handleLogout}
        className="text-xs bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded transition-colors"
      >
        Log Out
      </button>
    </nav>
  );
}