"use client";

import { useEffect, useState } from "react";
import DashboardLayout from '@/components/DashboardLayout';

export default function AudioMarketplaceLanding() {
  const [userType, setUserType] = useState<"producer" | "writer" | null>(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role === "producer" || role === "writer") {
      setUserType(role);
    }
  }, []);

  if (!userType) return null; // Optionally show a loading spinner

  return (
    <DashboardLayout userType={userType}>
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-4">Audio Marketplace Landing</h1>
        {/* Add your audio marketplace landing content here */}
      </div>
    </DashboardLayout>
  );
}
