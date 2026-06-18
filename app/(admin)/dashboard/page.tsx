"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSession } from "next-auth/react";

export default function DashboardPage() {
const { data: session } = useSession();
console.log("SESSION =", session);
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
    background: "#f5f5f5",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "20px",
  }}
>
  <b>Login sebagai:</b><br />
  {session?.user?.name}<br />
  {session?.user?.email}
</div>
                                                                    <div
                                                                    style={{
                                                                    display: "grid",
                                                                                                                gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
                                                                                                                gap: "20px",
                                                                                                                marginTop: "20px",
                                                                                                                }}
                                                                                                                >
                                                                                                                <div style={{ background: "white", padding: "20px", borderRadius: "10px" }}>
                                                                                                                                                                                            <h3>📥 Surat Masuk</h3>
                                                                                                                                                                                                      <h1>{suratMasuk}</h1>
                                                                                                                                                                                                              </div>

                                                                                                                                                                                                                      <div style={{ background: "#facc15", padding: "20px", borderRadius: "10px" }}>
                                                                                                                                                                                                                                <h3>🟡 Menunggu</h3>
                                                                                                                                                                                                                                          <h1>{disposisiMenunggu}</h1>
                                                                                                                                                                                                                                                  </div>

                                                                                                                                                                                                                                                          <div
                                                                                                                                                                                                                                                                    style={{
                                                                                                                                                                                                                                                                                background: "#22c55e",
                                                                                                                                                                                                                                                                                            color: "white",
                                                                                                                                                                                                                                                                                                        padding: "20px",
                                                                                                                                                                                                                                                                                                                    borderRadius: "10px",
                                                                                                                                                                                                                                                                                                                              }}
                                                                                                                                                                                                                                                                                                                                      >
                                                                                                                                                                                                                                                                                                                                                <h3>✅ Selesai</h3>
                                                                                                                                                                                                                                                                                                                                                          <h1>{disposisiSelesai}</h1>
                                                                                                                                                                                                                                                                                                                                                                  </div>
                                                                                                                                                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                                                                                                                                                            </div>
                                                                                                                                                                                                                                                                                                                                                                              );
                                                                                                                                                                                                                                                                                                                                                                              }
