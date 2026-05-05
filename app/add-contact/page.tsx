"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDoc, collection, serverTimestamp, getDocs, query, where } from "firebase/firestore";
import { db } from "../../config/firebase";
import { useAuth } from "../context/AuthContext";

export default function AddContactScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [relationship, setRelationship] = useState("");
  const [loading, setLoading] = useState(false);

  const relationships = ["Mother", "Father", "Sibling", "Friend", "Partner"];

  const handleSave = async () => {
    if (!name || !phone || !relationship) {
      return;
    }
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
      alert('Failed to save contact. Please try again.');
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

        <span className="text-[11px] font-bold text-gray-300 tracking-widest mb-2 uppercase">Full Name</span>
        <div className="flex items-center h-14 rounded-xl border border-gray-200 bg-gray-50 px-4 mb-6">
          <input
            className="flex-1 bg-transparent text-black text-lg font-medium outline-none placeholder-gray-400"
            placeholder=""
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <span className="text-[11px] font-bold text-gray-300 tracking-widest mb-2 uppercase">Phone Number</span>
        <div className="flex items-center h-14 rounded-xl border border-gray-200 bg-gray-50 px-4 mb-6">
          <input
            className="flex-1 bg-transparent text-black text-lg font-medium outline-none placeholder-gray-400"
            placeholder=""
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <span className="text-[11px] font-bold text-gray-300 tracking-widest mb-2 uppercase">Relationship</span>
        <div className="flex flex-wrap gap-2 mb-10">
          {relationships.map((item) => {
            const isSelected = relationship === item;
            return (
              <button
                key={item}
                onClick={() => setRelationship(item)}
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
    </div>
  );
}