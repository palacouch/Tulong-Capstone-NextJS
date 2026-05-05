"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);

    try {
      // 🔐 Firebase login
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const userRole = userData.role;
        

      // ✅ IMPORTANT: wait a tick so auth state updates
      setTimeout(() => {
        if (userRole == "admin") {
          router.push("/admin");
        } else if (userRole == "user") {
          router.push("/dashboard");
        } 
      }, 300);

    } else {
      setError("User profile not found in database.");
      // Sign them back out if they have an account but no database entry
      await auth.signOut(); 
    }

    } catch (err: any) {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white relative overflow-hidden">

      {/* background accent */}
      <div className="absolute top-0 w-full h-72 bg-zinc-900" />
      <div className="absolute top-64 w-0 h-0 border-l-[50vw] border-r-[50vw] border-b-[60px] border-l-transparent border-r-transparent border-b-zinc-900 rotate-180" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-sm z-10 px-6"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-11 h-11 border-2 border-yellow-500 rounded-lg flex items-center justify-center">
            🚨
          </div>
          <div>
            <h1 className="text-xl font-bold">Tulong</h1>
            <p className="text-xs text-gray-400">Community Safety</p>
          </div>
        </div>

        {/* Title */}
        <h2 className="text-3xl font-bold text-center mb-10">Login</h2>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 text-red-400 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        {/* Email */}
        <label className="text-xs font-semibold">Email</label>
        <input
          className="w-full bg-transparent border-b border-gray-600 py-2 mb-6 outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* Password */}
        <label className="text-xs font-semibold">Password</label>
        <input
          type="password"
          className="w-full bg-transparent border-b border-gray-600 py-2 mb-8 outline-none"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full bg-white text-black py-3 rounded font-semibold"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        {/* Divider */}
        <div className="text-center text-xs text-gray-500 my-6">
          Or continue with
        </div>

        {/* Google Button */}
        <button className="w-full border border-gray-700 py-3 rounded flex items-center justify-center gap-2">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/1200px-Google_%22G%22_logo.svg.png"
            className="w-5 h-5"
          />
          Google
        </button>

        {/* Footer */}
        <p className="text-center text-sm text-gray-400 mt-6">
          Don’t have an account?{" "}
          <span
            className="text-white font-semibold cursor-pointer"
            onClick={() => router.push("/register")}
          >
            Create now
          </span>
        </p>
      </motion.div>
    </div>
  );
}