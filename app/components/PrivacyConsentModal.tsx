"use client";

import React, { useState, useEffect } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../context/AuthContext";

export default function PrivacyConsentModal() {
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const checkConsent = () => {
      const localConsent = localStorage.getItem("tulong_privacy_consent");
      if (!localConsent) {
        setVisible(true);
      }
    };
    checkConsent();
  }, []);

  const handleScroll = (e: any) => {
    const isAtBottom = e.target.scrollHeight - e.target.scrollTop <= e.target.clientHeight + 20;
    if (isAtBottom) {
      setScrolled(true);
    }
  };

  const handleConsent = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await setDoc(doc(db, "users", user.id, "consent", "privacy"), {
        consentGiven: true,
        consentDate: serverTimestamp(),
        userId: user.id,
        version: "1.0",
        platform: "web",
      });
      localStorage.setItem("tulong_privacy_consent", "true");
      setVisible(false);
    } catch (e) {
      console.error("Error saving consent:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-[#13131f] border border-indigo-500/30 rounded-[24px] w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex flex-col items-center p-6 pb-4 border-b border-white/5">
          <div className="w-16 h-16 rounded-full bg-indigo-500/15 flex items-center justify-center mb-3">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-white text-xl font-bold tracking-wide mb-1">Data Privacy Notice</h2>
          <p className="text-white/40 text-[13px]">Please read before using Tulong</p>
        </div>

        {/* Scrollable Content */}
        <div 
          className="p-5 overflow-y-auto flex-1 flex flex-col gap-3 custom-scrollbar"
          onScroll={handleScroll}
        >
          <h3 className="text-indigo-400 text-[13px] font-bold tracking-wide uppercase mt-2 mb-1">
            Republic Act No. 10173
          </h3>
          
          <p className="text-gray-300 text-[13px] leading-relaxed">
            In compliance with the Data Privacy Act of 2012 (RA 10173) of the Philippines,
            Tulong is committed to protecting and respecting your personal information.
            This notice explains how we collect, use, and store your data.
          </p>

          <h3 className="text-indigo-400 text-[13px] font-bold tracking-wide uppercase mt-2 mb-1">
            What data we collect
          </h3>
          <ul className="text-gray-300 text-[13px] leading-relaxed space-y-1 list-disc pl-5">
            <li>Full name and email address provided during registration</li>
            <li>Real-time GPS location of the app user and IoT wearable device</li>
            <li>Emergency contact information (name, phone number, relationship)</li>
            <li>SOS alert history including timestamps and location coordinates</li>
            <li>Device connection status and usage logs</li>
          </ul>

          <h3 className="text-indigo-400 text-[13px] font-bold tracking-wide uppercase mt-2 mb-1">
            How we store your data
          </h3>
          <p className="text-gray-300 text-[13px] leading-relaxed">
            Your data is stored securely using Google Firebase Firestore, a cloud-based
            database with industry-standard encryption. We do not sell, share, or
            disclose your personal information to third parties outside of the
            emergency contacts you designate.
          </p>

          <div className="mt-4 p-4 bg-white/5 rounded-lg flex flex-col gap-3">
            <button type="button" onClick={() => {}} className="text-[12px] text-blue-400 underline text-left hover:text-blue-300 transition-colors">
              Download Full Legal Document (PDF)
            </button>
            <button type="button" onClick={() => {}} className="text-[12px] text-red-400 underline text-left hover:text-red-300 transition-colors">
              Request Permanent Data Deletion
            </button>
          </div>

          <div className="mt-4 p-3 bg-indigo-500/10 rounded-lg text-center">
            <p className="text-white/35 text-[12px]">
              {scrolled ? "✓ You have read the full notice" : "Scroll down to read the full notice"}
            </p>
          </div>
        </div>

        {/* Footer & Consent Button */}
        <div className="p-5 border-t border-white/5 flex flex-col gap-3 bg-[#13131f]">
          <p className="text-white/35 text-[11px] text-center leading-relaxed">
            By clicking "I Agree & Give Consent" you acknowledge that you have read,
            understood, and agreed to the collection and use of your data as described above.
          </p>

          <button
            className={`py-4 rounded-xl font-bold text-[15px] transition-all duration-300 ${
              !scrolled || loading 
                ? "bg-indigo-500/20 text-white/30 cursor-not-allowed" 
                : "bg-indigo-600 text-white shadow-[0_6px_12px_rgba(79,70,229,0.4)] hover:bg-indigo-500 active:scale-[0.98]"
            }`}
            onClick={handleConsent}
            disabled={!scrolled || loading}
          >
            {loading ? "Saving..." : scrolled ? "I Agree & Give Consent" : "Scroll to read first"}
          </button>
        </div>
      </div>
    </div>
  );
}