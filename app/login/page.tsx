"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const tempErrors: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      tempErrors.email = "Email address is required.";
    } else if (!emailRegex.test(email)) {
      tempErrors.email = "Please enter a valid email address (e.g., name@example.com).";
    }

    if (!password) {
      tempErrors.password = "Password is required.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleLogin = async () => {
    setErrors({});

    // 1. Client-side validation run before hitting the API/Firebase
    if (!validateForm()) return;

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

        setTimeout(() => {
          if (userRole === "admin") {
            router.push("/admin");
          } else if (userRole === "user") {
            router.push("/dashboard");
          } 
        }, 300);

      } else {
        setErrors({ general: "Account authenticated, but user profile was not found in the database." });
        await auth.signOut(); 
      }

    } catch (err: any) {
      setErrors({ general: "Incorrect email or password. Please check your credentials and try again." });
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
        {errors.general && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded mb-6 text-sm flex items-start gap-2 animate-fadeIn">
            <span className="shrink-0">⚠️</span>
            <span>{errors.general}</span>
          </div>
        )}

        {/* Email */}
        <div className="mb-5">
        <label className={`text-xs font-semibold ${errors.email ? "text-red-400" : "text-gray-300"}`}>
          Email
        </label>
        <input
          className={`w-full bg-transparent border-b py-2 outline-none transition-colors duration-200 ${
          errors.email ? "border-red-500 focus:border-red-400" : "border-gray-600 focus:border-white"
          }`}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((prev) => ({ ...prev, email: "" })); // Clear error as they fix it
            }}
            aria-invalid={!!errors.email}
        />
        {errors.email && (
            <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1 animate-fadeIn">
              <span>🛑</span> {errors.email}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="mb-8 flex flex-col">
        <label className={`text-xs font-semibold mb-1 ${errors.password ? "text-red-400" : "text-gray-300"}`}>
          Password
        </label>
        <input
          type="password"
          className={`w-full bg-transparent border-b py-2 outline-none transition-colors duration-200 ${
              errors.password ? "border-red-500 focus:border-red-400" : "border-gray-600 focus:border-white"
            }`}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((prev) => ({ ...prev, password: undefined })); // Real-time clearing
            }}
            aria-invalid={!!errors.password}
        />
        {errors.password && (
            <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
              <span>🛑</span> {errors.password}
            </p>
          )}
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          className="w-full bg-white text-black py-3 rounded font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Logging in..." : "Log In"}
        </button>

        {/* Divider */}
        <div className="text-center text-xs text-gray-500 my-6">
          Or continue with
        </div>

        {/* Google Button */}
        <button className="w-full border border-gray-700 py-3 rounded flex items-center justify-center gap-2 hover:bg-zinc-900 transition-colors">
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
            className="text-white font-semibold cursor-pointer hover:underline"
            onClick={() => router.push("/register")}
          >
            Create now
          </span>
        </p>
      </motion.div>
    </div>
  );
}