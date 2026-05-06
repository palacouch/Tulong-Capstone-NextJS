import Navbar from "../components/Navbar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="p-6">
        {children}
      </main>
    </div>
  );
}