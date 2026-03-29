import type { Metadata } from "next";

import DashboardLayout from "@/components/DashboardLayout";

export const metadata: Metadata = {
  title: "Settings",
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
