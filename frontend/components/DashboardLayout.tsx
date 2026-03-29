"use client";

import Sidebar from "./Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <main className="ml-64 min-h-screen px-8 py-6">
        {children}
      </main>
    </div>
  );
}
