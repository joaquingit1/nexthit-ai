import type { Metadata } from "next";

import DashboardLayout from "@/components/DashboardLayout";

export const metadata: Metadata = {
  title: "Analisis",
};

export default function AnalisisLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
