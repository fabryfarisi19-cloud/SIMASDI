"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DashboardPage() {
  const [suratMasuk, setSuratMasuk] = useState(0);
    const [disposisiMenunggu, setDisposisiMenunggu] = useState(0);
      const [disposisiSelesai, setDisposisiSelesai] = useState(0);

        useEffect(() => {
            loadData();
              }, []);

                const loadData = async () => {
                    const { data: surat } = await supabase
                          .from("surat_masuk")
                                .select("*");

                                    const { data: menunggu } = await supabase
                                          .from("disposisi")
                                                .select("*")
                                                      .eq("status", "Menunggu");

                                                          const { data: selesai } = await supabase
                                                                .from("disposisi")
                                                                      .select("*")
                                                                            .eq("status", "Selesai");

                                                                                setSuratMasuk(surat?.length || 0);
                                                                                    setDisposisiMenunggu(menunggu?.length || 0);
                                                                                        setDisposisiSelesai(selesai?.length || 0);
                                                                                          };

                                                                                            return (
                                                                                                <div style={{ padding: "20px" }}>
                                                                                                      <h2>Dashboard SIMASDI</h2>

                                                                                                            <div
                                                                                                                    style={{
                                                                                                                              display: "grid",
                                                                                                                                        gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                                                                                                                                                  gap: "20px",
                                                                                                                                                            marginTop: "20px",
                                                                                                                                                                    }}
                                                                                                                                                                          >
                                                                                                                                                                                  <div style={{ padding: "20px", background: "white", borderRadius: "10px" }}>
                                                                                                                                                                                            <h3>📥 Surat Masuk</h3>
                                                                                                                                                                                                      <h1>{suratMasuk}</h1>
                                                                                                                                                                                                              </div>

                                                                                                                                                                                                                      <div style={{ padding: "20px", background: "#facc15", borderRadius: "10px" }}>
                                                                                                                                                                                                                                <h3>🟡 Menunggu</h3>
                                                                                                                                                                                                                                          <h1>{disposisiMenunggu}</h1>
                                                                                                                                                                                                                                                  </div>

                                                                                                                                                                                                                                                          <div style={{ padding: "20px", background: "#22c55e", color: "white", borderRadius: "10px" }}>
                                                                                                                                                                                                                                                                    <h3>✅ Selesai</h3>
                                                                                                                                                                                                                                                                              <h1>{disposisiSelesai}</h1>
                                                                                                                                                                                                                                                                                      </div>
                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                                  );
                                                                                                                                                                                                                                                                                                  }