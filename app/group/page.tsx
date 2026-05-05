"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { db } from "../../config/firebase";
import { useAuth } from "../../context/authContext";
import {
  addDoc, collection, doc, getDoc, getDocs, limit, onSnapshot,
  orderBy, query, serverTimestamp, setDoc, updateDoc, where
} from "firebase/firestore";

const QUICK_STATUSES = [
  { key: "responded", icon: "👋", label: "Responded", text: "I have responded to the alert.", color: "#6366f1" },
  { key: "on_the_way", icon: "🚗", label: "On the way", text: "I am on the way to the wearer.", color: "#fb923c" },
  { key: "arrived", icon: "📍", label: "Arrived", text: "I have arrived at the wearer's location.", color: "#378ADD" },
  { key: "aided", icon: "✅", label: "Wearer aided", text: "I have aided the wearer. All clear.", color: "#4ade80" },
];

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return km < 1 ? Math.round(km * 1000) + "m" : km.toFixed(1) + "km";
}

function generateCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function formatTime(ts) {
  if (!ts) return "";
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export default function GroupScreen() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [myStatus, setMyStatus] = useState("Available");
  const [inputText, setInputText] = useState("");
  const [showQuickStatus, setShowQuickStatus] = useState(false);

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [wearerName, setWearerName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const messagesEndRef = useRef(null);
  const myName = user?.email?.split("@")[0] ?? "Guardian";

  useEffect(() => {
    if (!user) return;
    checkExistingGroup();
  }, [user]);

  const checkExistingGroup = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "users", user.id));
      if (userDoc.exists() && userDoc.data().groupId) {
        loadGroup(userDoc.data().groupId);
      } else {
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
    }
  };

  const loadGroup = (groupId) => {
    onSnapshot(doc(db, "groups", groupId), (snap) => {
      if (snap.exists()) setGroup({ id: snap.id, ...snap.data() });
    });

    onSnapshot(collection(db, "groups", groupId, "members"), (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMembers(list);
      const me = list.find(m => m.id === user?.id);
      if (me) setMyStatus(me.status);
    });

    const q = query(collection(db, "groups", groupId, "messages"), orderBy("timestamp", "asc"), limit(100));
    onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    setLoading(false);
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || !wearerName.trim()) {
      return; 
    }
    if (!user) return;
    try {
      const code = generateCode();
      const groupRef = await addDoc(collection(db, "groups"), {
        name: groupName.trim(),
        wearerName: wearerName.trim(),
        wearerId: user.id,
        joinCode: code,
        createdBy: user.id,
        createdAt: serverTimestamp(),
      });
      await setDoc(doc(db, "groups", groupRef.id, "members", user.id), {
        userId: user.id, name: myName, status: "Available", isCreator: true,
      });
      await updateDoc(doc(db, "users", user.id), { groupId: groupRef.id });

      setShowCreate(false);
      loadGroup(groupRef.id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) return;
    if (!user) return;
    try {
      const groupQuery = query(collection(db, "groups"), where("joinCode", "==", joinCode.trim().toUpperCase()));
      const groupSnap = await getDocs(groupQuery);
      if (groupSnap.empty) {
        alert('Invalid Join Code. Please try again.');
        return;
      }
      const groupId = groupSnap.docs[0].id;
      await setDoc(doc(db, "groups", groupId, "members", user.id), {
        userId: user.id, name: myName, status: "Available", isCreator: false,
      });
      await updateDoc(doc(db, "users", user.id), { groupId });

      setShowJoin(false);
      loadGroup(groupId);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !group || !user) return;
    const text = inputText.trim();
    setInputText("");
    await addDoc(collection(db, "groups", group.id, "messages"), {
      senderId: user.id, senderName: myName, text, type: "text", timestamp: serverTimestamp(),
    });
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen text-black">Loading...</div>;

  return (
    <div className="relative flex flex-col min-h-screen bg-white font-sans overflow-hidden">
  
      <div className="absolute inset-0 bg-blue-50 animate-pulse -z-10 opacity-50 pointer-events-none"></div>

      <div className="absolute top-4 right-4 z-50">
        <button onClick={() => {}} className="text-xs text-red-500 underline cursor-pointer">
          Delete Account & Data
        </button>
      </div>

      {!group ? (
        <div className="flex flex-col items-center justify-center flex-grow p-8 space-y-6">
          <span className="text-6xl">👥</span>

          <h1 className="text-2xl font-bold text-gray-300">No group yet</h1>
          <p className="text-gray-200 text-center">Create a group for the wearer or join one with a code.</p>

          {showCreate ? (
            <div className="w-full max-w-sm p-6 border rounded-xl shadow-sm bg-white flex flex-col gap-4">
              <h2 className="font-bold text-black">Create Group</h2>
              <input className="border p-3 rounded-lg text-black" placeholder="Group name" value={groupName} onChange={e => setGroupName(e.target.value)} />
              <input className="border p-3 rounded-lg text-black" placeholder="Wearer's name" value={wearerName} onChange={e => setWearerName(e.target.value)} />
              <button className="bg-black text-white p-3 rounded-lg font-bold" onClick={handleCreateGroup}>Create Group</button>
              <button className="text-sm text-gray-500" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          ) : showJoin ? (
            <div className="w-full max-w-sm p-6 border rounded-xl shadow-sm bg-white flex flex-col gap-4">
              <h2 className="font-bold text-black">Join Group</h2>
              <input className="border p-3 rounded-lg text-black uppercase" maxLength={6} placeholder="Enter 6-character code" value={joinCode} onChange={e => setJoinCode(e.target.value)} />
              <button className="bg-black text-white p-3 rounded-lg font-bold" onClick={handleJoinGroup}>Join Group</button>
              <button className="text-sm text-gray-500" onClick={() => setShowJoin(false)}>Cancel</button>
            </div>
          ) : (
            <div className="w-full max-w-sm flex flex-col gap-3">
              <button className="w-full bg-black text-white p-4 rounded-xl font-bold" onClick={() => setShowCreate(true)}>Create a Group</button>
              <button className="w-full border border-black text-black p-4 rounded-xl font-bold" onClick={() => setShowJoin(true)}>Join with Code</button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col h-screen">
          <div className="flex items-center justify-between p-4 border-b bg-white">
            <div>
              <h1 className="text-lg font-extrabold text-black">{group.name}</h1>
              <p className="text-xs text-gray-500">Wearer: {group.wearerName}</p>
            </div>
            <div className="flex flex-col items-center p-2 border rounded-lg bg-gray-50">
              <span className="text-[10px] font-bold tracking-widest text-gray-500 uppercase">Code</span>
              <span className="text-lg font-black text-black tracking-widest">{group.joinCode}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <span className="text-4xl mb-2">💬</span>
                <p>No messages yet. Say something!</p>
              </div>
            ) : (
              messages.map((msg, i) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe ? "bg-indigo-500 text-white rounded-br-sm" : "bg-gray-100 text-black rounded-bl-sm"}`}>
                      {!isMe && <p className="text-[10px] font-bold mb-1 text-gray-500">{msg.senderName}</p>}
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <p className={`text-[10px] text-right mt-1 ${isMe ? "text-indigo-200" : "text-gray-400"}`}>{formatTime(msg.timestamp)}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="absolute bottom-0 w-full bg-white border-t p-3 flex items-center gap-2">
            
            <button className="w-10 h-10 flex items-center justify-center border rounded-full text-gray-600 hover:bg-gray-100" onClick={() => {}}>
              📍
            </button>

            <input
              type="text"
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm text-black outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button 
              className={`w-10 h-10 flex items-center justify-center rounded-full text-white font-bold transition-colors ${inputText.trim() ? "bg-indigo-500" : "bg-gray-300"}`}
              onClick={handleSend}
              disabled={!inputText.trim()}
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </div>
  );
}