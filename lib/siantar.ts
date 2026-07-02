import { supabase } from "./supabase";


export async function getDashboard() {
  const [total, menunggu, dipanggil, selesai] = await Promise.all([
    supabase.from("antrian").select("*", { count: "exact", head: true }),

    supabase
      .from("antrian")
      .select("*", { count: "exact", head: true })
      .eq("status", "MENUNGGU"),

    supabase
      .from("antrian")
      .select("*", { count: "exact", head: true })
      .eq("status", "DIPANGGIL"),

    supabase
      .from("antrian")
      .select("*", { count: "exact", head: true })
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
    .gte("created_at", `${hariIni}T00:00:00`)
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
    status: "MENUNGGU",
  });

console.log("HASIL INSERT:", result);

if (result.error) {
  throw result.error;
}



  return nomor;
}
export async function panggilBerikutnya(loket: number) {
  const { data, error } = await supabase
    .from("antrian")
    .select("*")
    .eq("status", "MENUNGGU")
    .order("id", { ascending: true })
    .limit(1)
    .single();

  if (error || !data) return null;
  
  const { error: updateError } = await supabase
    .from("antrian")
    .update({
      status: "DIPANGGIL",
      loket,
      called_at: new Date().toISOString(),
    })
    .eq("id", data.id);

  if (updateError) throw updateError;

 return {
  id: data.id,
  nomor: data.nomor,
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