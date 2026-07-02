"use client";

import StatisticsCard from "../../components/StatisticsCard";
import {
  Users,
  Clock3,
  CheckCircle,
  Ticket,
} from "lucide-react";

export default function DashboardAntrian() {
  return (
    <main className="p-8">

      <h1 className="text-3xl font-bold mb-8">
        Dashboard SIANTAR
      </h1>

      <div className="grid md:grid-cols-4 gap-6">

        <StatisticsCard
          title="Total Hari Ini"
          value={120}
          icon={<Ticket />}
        />

        <StatisticsCard
          title="Menunggu"
          value={25}
          color="bg-yellow-500"
          icon={<Clock3 />}
        />

        <StatisticsCard
          title="Dilayani"
          value={4}
          color="bg-blue-600"
          icon={<Users />}
        />

        <StatisticsCard
          title="Selesai"
          value={91}
          color="bg-green-600"
          icon={<CheckCircle />}
        />

      </div>

    </main>
  );
}