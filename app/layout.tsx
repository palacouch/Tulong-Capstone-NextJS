import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { Metadata } from "next";

export const metadata: Metadata = {
title: {
template: 'C.A.R.E | %s',
default: 'C.A.R.E',
},
description: "Emergency Alert System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
        
      </body>
    </html>
  );
}