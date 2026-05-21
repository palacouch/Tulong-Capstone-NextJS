"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validateForm = (): boolean => {
    const tempErrors: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) {
      tempErrors.name = "Full name is required to set up your profile.";
    }

    if (!email.trim()) {
      tempErrors.email = "Email address is required.";
    } else if (!emailRegex.test(email)) {
      tempErrors.email = "Please enter a valid email address (e.g., name@example.com).";
    }

    if (!password) {
      tempErrors.password = "Password is required.";
    } else if (password.length < 6) {
      tempErrors.password = "Password must be at least 6 characters long.";
    }

    if (!confirmPassword) {
      tempErrors.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      tempErrors.confirmPassword = "Passwords do not match. Please check and re-type.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleRegister = async () => {
    setErrors({});

    // 1. Client-side validation check
    if (!validateForm()) return;
  
    setLoading(true);

    try {
      // 2. Create Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const user = userCredential.user;

      // 3. Save user to Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name,
        email,
        role: "user",
        createdAt: serverTimestamp(),
      });

      // 4. Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      const tempErrors: FormErrors = {};

      if (err.code === "auth/email-already-in-use") {
        tempErrors.email = "This email is already registered. Try signing in instead.";
      } else if (err.code === "auth/invalid-email") {
        tempErrors.email = "The email address layout appears invalid.";
      } else if (err.code === "auth/weak-password") {
        tempErrors.password = "Password is too weak. Please choose a stronger password.";
      } else {
        tempErrors.general = err.message || "An unexpected registration error occurred. Please try again.";
      }

      setErrors(tempErrors);
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md flex flex-col space-y-6">

        <h1 className="text-3xl font-bold text-center">
          Create Account
        </h1>

        {errors.general && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-sm flex items-start gap-2">
            <span className="shrink-0">⚠️</span>
            <span>{errors.general}</span>
          </div>
        )}

        <div className="flex flex-col space-y-4">

        <div className="flex flex-col">
          {/* Full Name Input */}
          <label className={`text-xs font-semibold block mb-1 ${errors.name ? "text-red-400" : "text-gray-400"}`}>
            Full Name
          </label>
        <input
          className={`w-full p-3 bg-zinc-900 rounded border outline-none transition colors ${
            errors.name ? "border-red-500 focus:border-red-400" :"border-zinc-800 focus:border-zinc-600"
          }`}
          placeholder="e.g. John Doe"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearError("name");
          }}
          aria-invalid={!!errors.name}
        />
        {errors.name && (
          <p className="text-red-400 text-sm mt-1.5 flex items-center gap-1">
            <span>🛑</span> {errors.name}
          </p>
        )}
        </div>

        {/* Email Input */}
        <div className="flex flex-col">
          <label className={`text-xs font-semibold block mb-1 ${errors.email ? "text-red-400" : "text-gray-400"}`}>
              Email Address
          </label>
        <input
          className={`w-full p-3 bg-zinc-900 rounded border outline-none transition-colors ${
            errors.email ? "border-red-500 focus:border-red-400" : "border-zinc-800 focus:border-zinc-600"
              }`}
          placeholder="name@example.com"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError("email");
          }}
          aria-invalid={!!errors.email}
        />
        {errors.email && (
            <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                <span>🛑</span> {errors.email}
              </p>
            )}
          </div>

        {/* Password Input */}
          <div className="flex flex-col">
            <label className={`text-xs font-semibold block mb-1 ${errors.password ? "text-red-400" : "text-gray-400"}`}>
              Password
            </label>
        <input
          className={`w-full p-3 bg-zinc-900 rounded border outline-none transition-colors ${
                errors.password ? "border-red-500 focus:border-red-400" : "border-zinc-800 focus:border-zinc-600"
              }`}
              placeholder="Minimum 6 characters"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                clearError("password");
              }}
              aria-invalid={!!errors.password}
        />
        {errors.password && (
              <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                <span>🛑</span> {errors.password}
              </p>
            )}
          </div>

        {/* Confirm Password Input */}
          <div className="flex flex-col">
            <label className={`text-xs font-semibold block mb-1 ${errors.confirmPassword ? "text-red-400" : "text-gray-400"}`}>
              Confirm Password
            </label>
          <input
          className={`w-full p-3 bg-zinc-900 rounded border outline-none transition-colors ${
            errors.confirmPassword ? "border-red-500 focus:border-red-400" : "border-zinc-800 focus:border-zinc-600"
          }`}
          placeholder="Re-type your password"
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            clearError("confirmPassword");
          }}
          aria-invalid={!!errors.confirmPassword}
        />
        {errors.confirmPassword && (
              <p className="text-red-400 text-xs mt-1.5 flex items-center gap-1">
                <span>🛑</span> {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleRegister}
          disabled={loading}
          className="w-full bg-white text-black p-3 rounded font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 mt-2"
        >
          {loading ? "Creating account..." : "Create Account"}
        </button>

        <p className="text-center text-sm text-gray-400">
          Already have an account?{" "}
          <a href="/login" className="text-white font-semibold hover:underline">
            Sign in
          </a>
        </p>

      </div>
      </div>
  );
}