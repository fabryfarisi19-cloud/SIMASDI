"use client";

import { useEffect, useState } from "react";

export default function DigitalClock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(
        new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-5xl font-bold text-white">
      {time}
    </div>
  );
}