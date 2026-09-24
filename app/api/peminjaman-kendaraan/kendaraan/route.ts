import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("kendaraan_dinas")
      .select("*");

    console.log("=== TEST KENDARAAN DINAS ===");
    console.log("DATA:", data);
    console.log("ERROR:", error);

    return NextResponse.json({
      success: !error,
      data: data || [],
      error: error?.message || null,
    });
  } catch (error: any) {
    console.error("ERROR:", error);

    return NextResponse.json({
      success: false,
      data: [],
      error: error?.message || "Error server",
    });
  }
}