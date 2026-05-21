"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PrivacyConsentModal from "../../components/PrivacyConsentModal";

import { GoogleMap, Marker, useLoadScript } from "@react-google-maps/api";

type Contact = { id: string; name: string; phone: string };
type AlertLog = { id: string; message: string; timestamp: any };
type Location = { lat: number; lng: number } | null;

export const metadata = {
title: 'Dashboard',
};

export default function DashboardPage() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [alerts, setAlerts] = useState<AlertLog[]>([]);
  const [location, setLocation] = useState<Location>(null);

  // ✅ Google Maps loader
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  const mapCenter = location
    ? { lat: location.lat, lng: location.lng }
    : { lat: 14.5995, lng: 120.9842 }; // fallback Manila

  // 🔐 auth gate
  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  // 📍 location
  useEffect(() => {
    if (!user) return;

    navigator.geolocation.getCurrentPosition((pos) => {
      setLocation({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  }, [user]);

  // 📇 contacts
  useEffect(() => {
    if (!user) return;

    const unsub = onSnapshot(
      collection(db, "users", user.uid, "contacts"),
      (snap) => {
        setContacts(
          snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Contact[]
        );
      }
    );

    return () => unsub();
  }, [user]);

  // 🚨 alerts
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "users", user.uid, "alerts"),
      orderBy("timestamp", "desc"),
      limit(5)
    );

    const unsub = onSnapshot(q, (snap) => {
      setAlerts(
        snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AlertLog[]
      );
    });

    return () => unsub();
  }, [user]);

  const sendSOS = async () => {
    if (!user) return;

    await addDoc(collection(db, "users", user.uid, "alerts"), {
      message: "SOS! Emergency!",
      timestamp: serverTimestamp(),
    });
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleLogout = async () => {
    if (!confirm("Log out?")) return;
    await logout();
    router.replace("/login");
  };

  if (loading) {
    return <div className="p-6 text-white bg-black min-h-screen">Loading...</div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">

      {/* TOP BAR */}
      <div className="flex justify-between items-center px-5 pt-10 pb-4 border-b border-zinc-800">
        <div>
          <h1 className="text-xl font-bold">Tulong 🚨</h1>
          <p className="text-xs text-gray-400">
            Device status: <span className="text-green-400">Active</span>
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="border border-zinc-700 px-3 py-1 rounded text-sm"
        >
          Log out
        </button>
      </div>

      {/* SCROLL AREA */}
      <div className="p-4 space-y-4 overflow-y-auto">

        {/* SOS */}
        <button
          onClick={sendSOS}
          className="w-full border border-red-500 bg-red-500/10 py-3 rounded font-semibold"
        >
          🚨 Send SOS
        </button>

        {/* ✅ GOOGLE MAPS (REPLACED HERE) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded p-4">
          <div className="flex justify-between mb-2">
            <h2 className="font-semibold text-sm uppercase">Live Location</h2>
          </div>

          <div className="h-64 w-full rounded overflow-hidden">
            {!isLoaded ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                Loading Map...
              </div>
            ) : (
              <GoogleMap
                center={mapCenter}
                zoom={16}
                mapContainerStyle={{ width: "100%", height: "100%" }}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false,
                }}
              >
                {location && (
                  <Marker
                    position={{ lat: location.lat, lng: location.lng }}
                    label="You"
                  />
                )}
              </GoogleMap>
            )}
          </div>
        </div>

        {/* CONTACTS */}
        <div className="bg-zinc-900 border border-zinc-800 rounded">
          <div className="p-4 border-b border-zinc-800">

            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm uppercase">
                Emergency Contacts
              </h2>

              {/* This button links to the page we just converted! */}
              <Link 
                href="/add-contact" 
                className="bg-black text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition"
              >
                + Add Contact
              </Link>
            </div>
          </div>
        </div>

          {contacts.length === 0 && (
            <p className="p-4 text-gray-400 text-sm">No contacts yet.</p>
          )}

          {contacts.map((c) => (
            <div
              key={c.id}
              className="flex justify-between items-center px-4 py-3 border-b border-zinc-800"
            >
              <div>
                <p className="font-semibold">{c.name}</p>
                <p className="text-xs text-gray-400">{c.phone}</p>
              </div>

              <button
                onClick={() => handleCall(c.phone)}
                className="bg-white text-black px-3 py-1 rounded text-sm font-semibold"
              >
                Call
              </button>
            </div>
          ))}
        </div>

        {/* ALERTS */}
        <div className="bg-zinc-900 border border-zinc-800 rounded">
          <div className="p-4 border-b border-zinc-800">
            <h2 className="font-semibold text-sm uppercase">
              Recent Alerts
            </h2>
          </div>

          {alerts.length === 0 && (
            <p className="p-4 text-gray-400 text-sm">No alerts yet.</p>
          )}

          {alerts.map((a) => (
            <div key={a.id} className="px-4 py-3 border-b border-zinc-800">
              <p className="text-sm">{a.message}</p>
            </div>
          ))}
        </div>

        <div className="h-10" />

        {/*<PrivacyConsentModal />*/}
      </div>
  );
}