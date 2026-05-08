"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  addDoc, collection, doc, getDoc, getDocs, limit, onSnapshot, 
  orderBy, query, serverTimestamp, setDoc, updateDoc, where 
} from "firebase/firestore";

import { db } from "../../../config/firebase";
import { useAuth } from "../../context/AuthContext"; 

const QUICK_STATUSES = [
  { key: "responded", icon: "👋", label: "Responded", text: "I have responded to the alert.", color: "#6366f1" },
  { key: "on_the_way", icon: "🚗", label: "On the way", text: "I am on the way to the wearer.", color: "#fb923c" },
  { key: "arrived", icon: "📍", label: "Arrived", text: "I have arrived at the wearer's location.", color: "#378ADD" },
  { key: "aided", icon: "✅", label: "Wearer aided", text: "I have aided the wearer. All clear.", color: "#4ade80" },
];

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
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [myStatus, setMyStatus] = useState("Available");
  const [inputText, setInputText] = useState("");

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
    if (!groupName.trim() || !wearerName.trim()) return;
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
    } catch (e) { console.error(e); }
  };

  const handleJoinGroup = async () => {
    if (!joinCode.trim()) return;
    if (!user) return;
    try {
      const groupQuery = query(collection(db, "groups"), where("joinCode", "==", joinCode.trim().toUpperCase()));
      const groupSnap = await getDocs(groupQuery);
      if (groupSnap.empty) return;
      
      const groupId = groupSnap.docs[0].id;
      await setDoc(doc(db, "groups", groupId, "members", user.id), {
        userId: user.id, name: myName, status: "Available", isCreator: false,
      });
      await updateDoc(doc(db, "users", user.id), { groupId });
      setShowJoin(false);
      loadGroup(groupId);
    } catch (e) { console.error(e); }
  };

  const handleSend = async () => {
    if (!inputText.trim() || !group || !user) return;
    const text = inputText.trim();
    setInputText("");
    await addDoc(collection(db, "groups", group.id, "messages"), {
      senderId: user.id, senderName: myName, text, type: "text", timestamp: serverTimestamp(),
    });
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen bg-black text-white">Loading...</div>;

  return (
    <div className="relative flex flex-col min-h-screen bg-black font-sans overflow-hidden text-white">
      
      <div className="absolute top-4 right-4 z-50">
        <button className="text-xs text-red-500/80 hover:text-red-500 underline transition-colors">
          Delete Account & Data
        </button>
      </div>

      {!group ? (
        <div className="flex flex-col items-center justify-center flex-grow p-8 space-y-8 bg-black">
          <div className="w-24 h-24 bg-zinc-900 border border-zinc-800 rounded-full flex items-center justify-center shadow-2xl">
            <span className="text-5xl">👥</span>
          </div>

          <div className="text-center space-y-2">
            {/* I corrected the color palette to white for high contrast visibility */}
            <h1 className="text-3xl font-extrabold text-white tracking-tight">No group yet</h1>
            {/* I corrected the color palette to zinc-400 for better subtext readability */}
            <p className="text-zinc-400 text-base max-w-[280px] mx-auto leading-relaxed">
              Create a safety group for the wearer or join an existing one.
            </p>
          </div>

          {showCreate ? (
            <div className="w-full max-w-sm p-6 border border-zinc-800 rounded-2xl bg-zinc-900 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
              <h2 className="font-bold text-white text-lg">Create Group</h2>
              <input className="bg-black border border-zinc-800 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Group name" value={groupName} onChange={e => setGroupName(e.target.value)} />
              <input className="bg-black border border-zinc-800 p-3 rounded-xl text-white outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Wearer's name" value={wearerName} onChange={e => setWearerName(e.target.value)} />
              <button className="bg-white text-black p-4 rounded-xl font-bold hover:bg-zinc-200 transition-all" onClick={handleCreateGroup}>Create Group</button>
              <button className="text-sm text-zinc-500 hover:text-white transition-colors" onClick={() => setShowCreate(false)}>Cancel</button>
            </div>
          ) : showJoin ? (
            <div className="w-full max-w-sm p-6 border border-zinc-800 rounded-2xl bg-zinc-900 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
              <h2 className="font-bold text-white text-lg">Join Group</h2>
              <input className="bg-black border border-zinc-800 p-3 rounded-xl text-white uppercase tracking-widest outline-none focus:ring-2 focus:ring-indigo-500" maxLength={6} placeholder="6-character code" value={joinCode} onChange={e => setJoinCode(e.target.value)} />
              <button className="bg-white text-black p-4 rounded-xl font-bold hover:bg-zinc-200 transition-all" onClick={handleJoinGroup}>Join Group</button>
              <button className="text-sm text-zinc-500 hover:text-white transition-colors" onClick={() => setShowJoin(false)}>Cancel</button>
            </div>
          ) : (
            <div className="w-full max-w-sm flex flex-col gap-4">
              <button className="w-full bg-white text-black p-4 rounded-2xl font-extrabold hover:scale-[1.02] active:scale-95 transition-all shadow-lg" onClick={() => setShowCreate(true)}>Create a Group</button>
              <button className="w-full border border-zinc-800 bg-zinc-900 text-white p-4 rounded-2xl font-bold hover:bg-zinc-800 active:scale-95 transition-all" onClick={() => setShowJoin(true)}>Join with Code</button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col h-screen">
          <div className="flex items-center justify-between p-5 border-b border-zinc-800 bg-black/50 backdrop-blur-md sticky top-0 z-20">
            <div>
              <h1 className="text-lg font-black text-white uppercase tracking-tight">{group.name}</h1>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Wearer: {group.wearerName}</p>
            </div>
            <div className="flex flex-col items-center px-4 py-1 border border-zinc-800 rounded-xl bg-zinc-900/50">
              <span className="text-[9px] font-bold tracking-[0.2em] text-zinc-500 uppercase">Code</span>
              <span className="text-lg font-black text-white tracking-widest">{group.joinCode}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-28">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-600">
                <span className="text-5xl mb-4 opacity-20">💬</span>
                <p className="font-medium">No messages yet. Start the conversation!</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.senderId === user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${isMe ? "bg-indigo-600 text-white rounded-br-none shadow-indigo-500/10 shadow-lg" : "bg-zinc-900 border border-zinc-800 text-white rounded-bl-none"}`}>
                      {!isMe && <p className="text-[10px] font-black mb-1 text-indigo-400 uppercase tracking-tighter">{msg.senderName}</p>}
                      <p className="text-[15px] leading-snug font-medium">{msg.text}</p>
                      <p className={`text-[9px] text-right mt-1 font-bold ${isMe ? "text-indigo-200/60" : "text-zinc-500"}`}>{formatTime(msg.timestamp)}</p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="absolute bottom-0 w-full bg-black/80 backdrop-blur-xl border-t border-zinc-800 p-4 flex items-center gap-3">
            <button className="w-12 h-12 flex items-center justify-center border border-zinc-800 rounded-2xl text-zinc-400 hover:bg-zinc-900 transition-colors" onClick={() => {}}>
              📍
            </button>
            <input
              type="text"
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl px-5 py-3 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              placeholder="Type your message..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button 
              className={`w-12 h-12 flex items-center justify-center rounded-2xl text-white transition-all shadow-lg ${inputText.trim() ? "bg-indigo-600 scale-100 hover:bg-indigo-500" : "bg-zinc-800 scale-95 opacity-50"}`}
              onClick={handleSend}
              disabled={!inputText.trim()}
            >
              <span className="text-xl font-bold">↑</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}