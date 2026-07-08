import { supabase } from "./supabase";


export async function getDashboard() {
const hariIni = new Date().toISOString().split("T")[0];  
  const [total, menunggu, dipanggil, selesai] = await Promise.all([
   supabase
  .from("antrian")
  .select("*", { count: "exact", head: true })
  .eq("tanggal", hariIni),

    supabase
      .from("antrian")
      .select("*", { count: "exact", head: true })
      .eq("tanggal", hariIni)
      .eq("status", "MENUNGGU"),

    supabase
      .from("antrian")
      .select("*", { count: "exact", head: true })
      .eq("tanggal", hariIni)
      .eq("status", "DIPANGGIL"),

    supabase
      .from("antrian")
      .select("*", { count: "exact", head: true })
      .eq("tanggal", hariIni)
      .eq("status", "SELESAI"),
  ]);

  return {
    total: total.count ?? 0,
    menunggu: menunggu.count ?? 0,
    dipanggil: dipanggil.count ?? 0,
    selesai: selesai.count ?? 0,
  };
}

export async function ambilNomor(
  kode: string,
  layanan: string
) {
  const hariIni = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("antrian")
    .select("nomor")
    .eq("kode", kode)
    .eq("tanggal", hariIni)
    .order("id", { ascending: false })
    .limit(1);

  if (error) throw error;

  let urut = 1;

  if (data && data.length > 0) {
    urut = Number(data[0].nomor.substring(1)) + 1;
  }

  const nomor = `${kode}${String(urut).padStart(3, "0")}`;

const result = await supabase
  .from("antrian")
  .insert({
    nomor,
    kode,
    layanan,
    tanggal: hariIni,
    status: "MENUNGGU",
  })
  .select();

console.log("DATA INSERT:", result.data);
console.log("ERROR INSERT:", result.error);

if (result.error) {
  throw result.error;
}

  return nomor;
}
export async function panggilBerikutnya(loket: number) {
const hariIni = new Date().toISOString().split("T")[0];  
  const { data, error } = await supabase
    .from("antrian")
    .select("*")
    .eq("status", "MENUNGGU")
    .eq("tanggal", hariIni)
    .order("id", { ascending: true })
    .limit(1);

  console.log("DATA MENUNGGU:", data);
  console.log("ERROR:", error);

  if (error) throw error;

  if (!data || data.length === 0) {
    return null;
  }

  const antrian = data[0];

  const { error: updateError } = await supabase
    .from("antrian")
    .update({
      status: "DIPANGGIL",
      loket,
      called_at: new Date().toISOString(),
    })
    .eq("id", antrian.id);

  if (updateError) throw updateError;

  return {
    id: antrian.id,
    nomor: antrian.nomor,
    loket,
  };
}
export async function panggilUlang(id: number) {
  const { error } = await supabase
    .from("antrian")
    .update({
      called_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
}
export async function selesai(id: number) {
  const { error } = await supabase
    .from("antrian")
    .update({
      status: "SELESAI",
    })
    .eq("id", id);

  if (error) throw error;
}
