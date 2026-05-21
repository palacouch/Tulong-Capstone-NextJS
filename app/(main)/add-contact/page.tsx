"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { useAuth } from "../../context/AuthContext";

// 1. Define the TypeScript interface for our multi-field error states
interface FormErrors {
  name?: string;
  phone?: string;
  relationship?: string;
  general?: string;
}

export default function AddContactScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const relationships = ["Mother", "Father", "Sibling", "Friend", "Partner"];

  const validateForm = (): boolean => {
    const tempErrors: FormErrors = {};
    
    // Numeric verification for phone string (allowing spaces, hyphens, and +)
    const phoneRegex = /^[+]?[0-9\s\-]{7,15}$/;

    if (!name.trim()) {
      tempErrors.name = "Full name is required.";
    } else if (name.trim().length < 2) {
      tempErrors.name = "Name must be at least 2 characters long.";
    }

    if (!phone.trim()) {
      tempErrors.phone = "Phone number is required.";
    } else if (!phoneRegex.test(phone.trim())) {
      tempErrors.phone = "Please enter a valid phone number (e.g., +1234567890).";
    }

    if (!relationship) {
      tempErrors.relationship = "Please select a relationship type.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSave = async () => {
    setErrors({});

    if (!validateForm()) return;

    setLoading(true);
    try {
      await addDoc(collection(db, "users", user!.uid, "contacts"), {
        name: name.trim(),
        phone: phone.trim(),
        relationship,
        createdAt: serverTimestamp(),
      });
      router.back();
    } catch (e) {
      console.error(e);
      setErrors({ general: "Failed to save contact due to a network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans animate-pulse">
      
      <div className="absolute top-4 right-4 z-50">
        <span className="text-xs text-red-500 underline cursor-pointer">
          Delete all contacts
        </span>
      </div>

      <div className="flex items-center justify-between px-6 pt-10 pb-6">
        <button onClick={() => router.back()} className="flex items-center text-black w-20">
          <span className="text-2xl mr-1">‹</span>
          <span className="text-base font-semibold">Back</span>
        </button>
        <h1 className="text-lg font-bold text-black">Add Contact</h1>
        <div className="w-20"></div> 
      </div>

      <div className="px-6 flex flex-col flex-grow">
        
        <button 
          className="w-full bg-blue-500 text-white font-bold py-3 rounded-xl mb-6 shadow-sm hover:bg-blue-600 transition"
          onClick={() => {}}
        >
          Import from Google Contacts
        </button>

        {/* Global Firestore/Network Error Message Banner */}
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-6 text-sm flex items-start gap-2">
            <span className="shrink-0">⚠️</span>
            <span>{errors.general}</span>
          </div>
        )}

        {/* Full Name Input Box Container */}
        <div className="flex flex-col mb-6">
        <span className={`text-[11px] font-bold tracking-widest mb-2 uppercase ${errors.name ? "text-red-500" : "text-gray-400"}`}>
          Full Name
        </span>
        <div className={`flex items-center h-14 rounded-xl border px-4 transition-colors duration-200 ${
            errors.name ? "border-red-500 bg-red-50/20" : "border-gray-200 bg-gray-50 focus-within:border-black"
          }`}>
          <input
            className="flex-1 bg-transparent text-black text-lg font-medium outline-none placeholder-gray-400"
            placeholder="e.g. John Doe"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined })); // Real-time erasure
              }}
              aria-invalid={!!errors.name}
          />
        </div>
        {errors.name && (
            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
              <span>🛑</span> {errors.name}
            </p>
          )}
        </div>

        {/* Phone Number Input Box Container */}
        <div className="flex flex-col mb-6"></div>
        <span className="flex flex-col mb-6">
          Phone Number
        </span>
        <div className={`flex items-center h-14 rounded-xl border px-4 transition-colors duration-200 ${
            errors.phone ? "border-red-500 bg-red-50/20" : "border-gray-200 bg-gray-50 focus-within:border-black"
          }`}>
          <input
            className="flex-1 bg-transparent text-black text-lg font-medium outline-none placeholder-gray-400"
            placeholder="e.g. +1234567890"
            type="tel"
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value);
              if (errors.phone) setErrors((prev) => ({ ...prev, phone: undefined }));
            }}
            aria-invalid={!!errors.phone}
          />
        </div>
        {errors.phone && (
            <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">
              <span>🛑</span> {errors.phone}
            </p>
          )}
        </div>

        {/* Relationship Selector Container */}
        <div className="flex flex-col mb-10">
        <span className={`text-[11px] font-bold tracking-widest mb-2 uppercase ${errors.relationship ? "text-red-500" : "text-gray-400"}`}>
          Relationship
        </span>
        <div className="flex flex-wrap gap-2">
          {relationships.map((item) => {
            const isSelected = relationship === item;
            return (
              <button
                key={item}
                onClick={() => {
                  setRelationship(item);
                  if (errors.relationship) setErrors((prev) => ({ ...prev, relationship: undefined })); // Real-time erasure
                  }}
                className={`py-3 px-4 rounded-xl border text-sm font-semibold transition-colors flex-grow ${
                  isSelected 
                    ? "bg-black text-white border-black" 
                    : "bg-gray-50 text-gray-500 border-gray-200"
                }`}
              >
                {item}
              </button>
            );
          })}
        </div>
        {errors.relationship && (
            <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
              <span>🛑</span> {errors.relationship}
            </p>
          )}
        </div>

        <button
          className={`h-14 rounded-xl flex items-center justify-center mt-auto mb-10 transition-opacity ${
            loading ? "opacity-70 bg-gray-800" : "bg-black hover:bg-gray-900"
          }`}
          onClick={handleSave}
          disabled={loading}
        >
          <span className="text-white text-base font-bold">
            {loading ? "Saving..." : "Save Contact"}
          </span>
        </button>
      </div>
  );
}