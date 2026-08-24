"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  Package,
  Hash,
  UserRound,
  ClipboardCheck,
  FileText,
  ShieldCheck,
  DatabaseBackup,
  Save,
  Upload,
  ChevronRight,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
const menuPengaturan = [
  {
    id: "instansi",
    title: "Identitas Instansi",
    description: "Atur identitas Bapas dan informasi instansi",
    icon: Building2,
  },
  {
    id: "barang",
    title: "Barang & Kategori",
    description: "Atur kategori, satuan, kondisi dan status BMN",
    icon: Package,
  },
  {
    id: "nomor",
    title: "Nomor Dokumen",
    description: "Pengaturan nomor transaksi BMN otomatis",
    icon: Hash,
  },
  {
    id: "penanggungjawab",
    title: "Penanggung Jawab",
    description: "Atur pejabat/petugas penanggung jawab BMN",
    icon: UserRound,
  },
  {
    id: "opname",
    title: "Stock Opname",
    description: "Pengaturan periode dan pemeriksaan stok",
    icon: ClipboardCheck,
  },
  {
    id: "laporan",
    title: "Laporan & PDF",
    description: "Atur kop surat dan penandatangan laporan",
    icon: FileText,
  },
  {
    id: "keamanan",
    title: "Pengguna & Keamanan",
    description: "Atur hak akses dan keamanan aplikasi",
    icon: ShieldCheck,
  },
  {
    id: "backup",
    title: "Backup Data",
    description: "Kelola pencadangan dan pemulihan data",
    icon: DatabaseBackup,
  },
];

export default function PengaturanSimstokPage() {
  const [active, setActive] = useState("instansi");

const [instansi, setInstansi] = useState({
  nama: "Balai Pemasyarakatan Kelas I Jakarta Barat",
  unit: "Bapas Kelas I Jakarta Barat",
  alamat: "",
  telepon: "",
  email: "",
  logo_url: "",
});
const [penanggungJawab, setPenanggungJawab] = useState({
  nama: "",
  nip: "",
  jabatan: "",
  unit_kerja: "",
});
const [kategoriBarang, setKategoriBarang] = useState<string[]>([]);
const [satuanBarang, setSatuanBarang] = useState<string[]>([]);
const [kondisiBarang, setKondisiBarang] = useState<string[]>([]);
const [statusBarang, setStatusBarang] = useState<string[]>([]);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [message, setMessage] = useState("");
async function loadPenanggungJawab() {
  const { data, error } = await supabase
    .from("simstok_penanggung_jawab")
    .select("*")
    .eq("aktif", true)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Gagal mengambil penanggung jawab:", error);
    return;
  }

  if (data) {
    setPenanggungJawab({
      nama: data.nama || "",
      nip: data.nip || "",
      jabatan: data.jabatan || "",
      unit_kerja: data.unit_kerja || "",
    });
  }
}
async function loadKategoriBarang() {
  const { data, error } = await supabase
    .from("simstok_kategori_barang")
    .select("nama")
    .eq("aktif", true)
    .order("id", { ascending: true });

  if (error) {
    console.error("Gagal mengambil kategori barang:", error);
    return;
  }

  setKategoriBarang(data?.map((item) => item.nama) || []);
}
async function loadSatuanBarang() {
  const { data, error } = await supabase
    .from("simstok_satuan_barang")
    .select("nama")
    .eq("aktif", true)
    .order("id", { ascending: true });

  if (error) {
    console.error("Gagal mengambil satuan barang:", error);
    return;
  }
console.log("DATA SATUAN DARI SUPABASE:", data);
  setSatuanBarang(data?.map((item) => item.nama) || []);
}
async function loadKondisiBarang() {
  const { data, error } = await supabase
    .from("simstok_kondisi_barang")
    .select("nama")
    .eq("aktif", true)
    .order("id", { ascending: true });

  if (error) {
    console.error("Gagal mengambil kondisi barang:", error);
    return;
  }

  setKondisiBarang(data?.map((item) => item.nama) || []);
}
async function loadStatusBarang() {
  const { data, error } = await supabase
    .from("simstok_status_barang")
    .select("nama")
    .eq("aktif", true)
    .order("id", { ascending: true });

  if (error) {
    console.error("Gagal mengambil status barang:", error);
    return;
  }

  setStatusBarang(data?.map((item) => item.nama) || []);
}
async function loadPengaturan() {
  try {
    setLoading(true);

    const { data, error } = await supabase
      .from("simstok_pengaturan")
      .select("*")
      .eq("id", "default")
      .maybeSingle();
if (error) {
  console.error("DETAIL ERROR SUPABASE:", {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  });

  setMessage(
    `Gagal menyimpan: ${
      error.message ||
      error.details ||
      error.hint ||
      error.code ||
      "Error tidak diketahui"
    }`
  );

  return;
}

    if (data) {
      setInstansi({
        nama: data.nama_instansi || "",
        unit: data.unit_kerja || "",
        alamat: data.alamat || "",
        telepon: data.telepon || "",
        email: data.email || "",
        logo_url: data.logo_url || "",
      });
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    setLoading(false);
  }
}
useEffect(() => {
  loadPengaturan();
  loadPenanggungJawab();
  loadKategoriBarang();
  loadSatuanBarang();
  loadKondisiBarang();
  loadStatusBarang();
}, []);
  const [nomor, setNomor] = useState({
    
    
    prefix: "BMN",
    unit: "BAPAS-JB",
    format: "{PREFIX}/{NOMOR}/{UNIT}/{BULAN}/{TAHUN}",
    nomorTerakhir: "000",
  });

  const [opname, setOpname] = useState({
    periode: "Bulanan",
    stokMinimum: "5",
    notifikasi: true,
  });

  const [laporan, setLaporan] = useState({
    ukuran: "A4",
    orientasi: "Portrait",
    pejabat: "",
    nip: "",
    jabatan: "",
  });

  const [saved, setSaved] = useState(false);

async function simpanPengaturan() {
  try {
    setSaving(true);
    setMessage("");

    const { error } = await supabase
      .from("simstok_pengaturan")
      .upsert(
        {
          id: "default",
          nama_instansi: instansi.nama,
          unit_kerja: instansi.unit,
          alamat: instansi.alamat,
          telepon: instansi.telepon,
          email: instansi.email,
          logo_url: instansi.logo_url,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      );

    if (error) {
      console.error("Gagal menyimpan:", error);
      setMessage(`Gagal menyimpan: ${error.message}`);
      return;
    }
const { error: pjError } = await supabase
  .from("simstok_penanggung_jawab")
  .update({
    nama: penanggungJawab.nama,
    nip: penanggungJawab.nip,
    jabatan: penanggungJawab.jabatan,
    unit_kerja: penanggungJawab.unit_kerja,
    aktif: true,
    updated_at: new Date().toISOString(),
  })
  .eq("id", 1);

if (pjError) {
  console.error("Gagal menyimpan penanggung jawab:", pjError);
  setMessage(
    `Gagal menyimpan penanggung jawab: ${pjError.message}`
  );
  return;
}
    setMessage("✓ Pengaturan SIMSTOK berhasil disimpan.");
  } catch (error) {
    console.error(error);
    setMessage("Terjadi kesalahan saat menyimpan pengaturan.");
  } finally {
    setSaving(false);

    setTimeout(() => {
      setMessage("");
    }, 3000);
  }
}

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      {/* HEADER */}
      <div className="mb-6 rounded-3xl bg-gradient-to-r from-blue-900 to-blue-700 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded-xl bg-white/15 p-3">
                <ShieldCheck size={25} />
              </div>

              <div>
                <h1 className="text-2xl font-bold">
                  Pengaturan SIMSTOK BMN
                </h1>

                <p className="text-sm text-blue-100">
                  Kelola konfigurasi Sistem Informasi Manajemen Barang Milik
                  Negara
                </p>
              </div>
            </div>
          </div>

       <button
  onClick={simpanPengaturan}
  className="flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 font-semibold text-blue-800 shadow hover:bg-blue-50"
>
  <Save size={18} />
  Simpan Pengaturan
</button>
        </div>
      </div>

      {message && (
        <div className={`mb-5 rounded-2xl p-4 text-sm font-medium ${
          message.includes("Gagal") ? "border border-red-200 bg-red-50 text-red-700" : "border border-green-200 bg-green-50 text-green-700"
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* MENU */}
        <div className="h-fit rounded-3xl bg-white p-3 shadow-sm">
          <div className="px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Konfigurasi
            </p>
          </div>

          <div className="space-y-1">
            {menuPengaturan.map((item) => {
              const Icon = item.icon;
              const aktif = active === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                    aktif
                      ? "bg-blue-700 text-white shadow-md"
                      : "text-slate-700 hover:bg-blue-50"
                  }`}
                >
                  <div
                    className={`rounded-xl p-2 ${
                      aktif ? "bg-white/15" : "bg-blue-50 text-blue-700"
                    }`}
                  >
                    <Icon size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{item.title}</p>
                    <p
                      className={`mt-0.5 truncate text-xs ${
                        aktif ? "text-blue-100" : "text-slate-400"
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>

                  <ChevronRight size={16} />
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTENT */}
        <div className="rounded-3xl bg-white p-5 shadow-sm md:p-7">
          {/* IDENTITAS */}
          {active === "instansi" && (
            <Section
              title="Identitas Instansi"
              description="Informasi ini akan digunakan pada laporan dan dokumen SIMSTOK."
              icon={<Building2 size={22} />}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="Nama Instansi"
                  value={instansi.nama}
                  onChange={(value) =>
                    setInstansi({ ...instansi, nama: value })
                  }
                />

                <Input
                  label="Unit Kerja"
                  value={instansi.unit}
                  onChange={(value) =>
                    setInstansi({ ...instansi, unit: value })
                  }
                />

                <div className="md:col-span-2">
                  <Input
                    label="Alamat"
                    value={instansi.alamat}
                    onChange={(value) =>
                      setInstansi({ ...instansi, alamat: value })
                    }
                    textarea
                  />
                </div>

                <Input
                  label="Nomor Telepon"
                  value={instansi.telepon}
                  onChange={(value) =>
                    setInstansi({ ...instansi, telepon: value })
                  }
                />

                <Input
                  label="Email"
                  value={instansi.email}
                  onChange={(value) =>
                    setInstansi({ ...instansi, email: value })
                  }
                />
              </div>

              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl bg-blue-50">
  {instansi.logo_url ? (
    <img
      src={instansi.logo_url}
      alt="Logo Instansi"
      className="h-full w-full object-contain p-2"
    />
  ) : (
    <Building2 size={32} className="text-blue-700" />
  )}
</div>

                  <div className="flex-1">
                    <p className="font-bold text-slate-800">
                      Logo Instansi
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Gunakan format PNG/JPG dengan latar transparan jika
                      memungkinkan.
                    </p>
                  </div>
<label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-blue-200 px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50">
  <Upload size={17} />
  Upload Logo

  <input
    type="file"
    accept="image/png,image/jpeg,image/webp"
    className="hidden"
 onChange={async (e) => {
  const file = e.target.files?.[0];

  if (!file) return;

  try {
    setMessage("Mengupload logo...");

    const fileExt = file.name.split(".").pop();
    const fileName = `logo-instansi.${fileExt}`;

    const { error } = await supabase.storage
      .from("simstok")
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type,
      });

    if (error) {
      console.error("Gagal upload logo:", error);
      setMessage(`Gagal upload logo: ${error.message}`);
      return;
    }

    const { data } = supabase.storage
      .from("simstok")
      .getPublicUrl(fileName);

    const logoUrl = data.publicUrl;

    setInstansi((prev) => ({
      ...prev,
      logo_url: logoUrl,
    }));

    setMessage("✓ Logo berhasil diupload.");
  } catch (error) {
    console.error(error);
    setMessage("Terjadi kesalahan saat upload logo.");
  }
}}
  />
</label>
                </div>
              </div>
            </Section>
          )}

          {/* BARANG */}
          {active === "barang" && (
            <Section
              title="Barang & Kategori"
              description="Kelola data dasar yang digunakan pada pencatatan BMN."
              icon={<Package size={22} />}
            >
              <div className="grid gap-4 md:grid-cols-2">
              <SettingCard
  title="Kategori Barang"
  items={kategoriBarang}
/>

              <SettingCard
  title="Satuan Barang"
  items={satuanBarang}
/>
                <SettingCard
                  title="Kondisi Barang"
                 items={kondisiBarang}
                />

              <SettingCard
  title="Status Barang"
  items={statusBarang}
/>
              </div>
            </Section>
          )}

          {/* NOMOR */}
          {active === "nomor" && (
            <Section
              title="Nomor Dokumen"
              description="Atur format penomoran transaksi SIMSTOK secara otomatis."
              icon={<Hash size={22} />}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="Prefix"
                  value={nomor.prefix}
                  onChange={(value) =>
                    setNomor({ ...nomor, prefix: value })
                  }
                />

                <Input
                  label="Kode Unit"
                  value={nomor.unit}
                  onChange={(value) =>
                    setNomor({ ...nomor, unit: value })
                  }
                />

                <div className="md:col-span-2">
                  <Input
                    label="Format Nomor"
                    value={nomor.format}
                    onChange={(value) =>
                      setNomor({ ...nomor, format: value })
                    }
                  />
                </div>

                <Input
                  label="Nomor Terakhir"
                  value={nomor.nomorTerakhir}
                  onChange={(value) =>
                    setNomor({ ...nomor, nomorTerakhir: value })
                  }
                />
              </div>

              <div className="mt-6 rounded-2xl bg-blue-50 p-5">
                <p className="text-sm font-semibold text-blue-800">
                  Contoh nomor dokumen
                </p>

                <p className="mt-2 text-xl font-bold text-blue-900">
                  BMN/001/BAPAS-JB/VIII/2026
                </p>
              </div>
            </Section>
          )}

          {/* PENANGGUNG JAWAB */}
          {active === "penanggungjawab" && (
            <Section
              title="Penanggung Jawab"
              description="Data penanggung jawab digunakan dalam laporan BMN."
              icon={<UserRound size={22} />}
            >
              <div className="grid gap-5 md:grid-cols-2">
             <Input
  label="Nama Penanggung Jawab"
  value={penanggungJawab.nama}
  onChange={(value) =>
    setPenanggungJawab({
      ...penanggungJawab,
      nama: value,
    })
  }
/>

<Input
  label="NIP"
  value={penanggungJawab.nip}
  onChange={(value) =>
    setPenanggungJawab({
      ...penanggungJawab,
      nip: value,
    })
  }
/>

<Input
  label="Jabatan"
  value={penanggungJawab.jabatan}
  onChange={(value) =>
    setPenanggungJawab({
      ...penanggungJawab,
      jabatan: value,
    })
  }
/>

<Input
  label="Unit Kerja"
  value={penanggungJawab.unit_kerja}
  onChange={(value) =>
    setPenanggungJawab({
      ...penanggungJawab,
      unit_kerja: value,
    })
  }
/>
              </div>
            </Section>
          )}

          {/* OPNAME */}
          {active === "opname" && (
            <Section
              title="Stock Opname"
              description="Atur pemeriksaan dan batas minimum stok."
              icon={<ClipboardCheck size={22} />}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Select
                  label="Periode Stock Opname"
                  value={opname.periode}
                  options={["Bulanan", "Triwulanan", "Semester", "Tahunan"]}
                  onChange={(value) =>
                    setOpname({ ...opname, periode: value })
                  }
                />

                <Input
                  label="Stok Minimum"
                  value={opname.stokMinimum}
                  onChange={(value) =>
                    setOpname({ ...opname, stokMinimum: value })
                  }
                  type="number"
                />
              </div>

              <div className="mt-6 flex items-center justify-between rounded-2xl border p-4">
                <div>
                  <p className="font-bold text-slate-800">
                    Notifikasi Stok Minimum
                  </p>

                  <p className="text-sm text-slate-500">
                    Tampilkan peringatan ketika stok berada di bawah batas.
                  </p>
                </div>

                <button
                  onClick={() =>
                    setOpname({
                      ...opname,
                      notifikasi: !opname.notifikasi,
                    })
                  }
                  className={`h-7 w-12 rounded-full p-1 transition ${
                    opname.notifikasi ? "bg-blue-700" : "bg-slate-300"
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full bg-white transition ${
                      opname.notifikasi ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
            </Section>
          )}

          {/* LAPORAN */}
          {active === "laporan" && (
            <Section
              title="Laporan & PDF"
              description="Pengaturan tampilan laporan BMN dan dokumen PDF."
              icon={<FileText size={22} />}
            >
              <div className="grid gap-5 md:grid-cols-2">
                <Select
                  label="Ukuran Kertas"
                  value={laporan.ukuran}
                  options={["A4", "F4", "A5"]}
                  onChange={(value) =>
                    setLaporan({ ...laporan, ukuran: value })
                  }
                />

                <Select
                  label="Orientasi"
                  value={laporan.orientasi}
                  options={["Portrait", "Landscape"]}
                  onChange={(value) =>
                    setLaporan({ ...laporan, orientasi: value })
                  }
                />

                <Input
                  label="Nama Pejabat Penandatangan"
                  value={laporan.pejabat}
                  onChange={(value) =>
                    setLaporan({ ...laporan, pejabat: value })
                  }
                />

                <Input
                  label="NIP"
                  value={laporan.nip}
                  onChange={(value) =>
                    setLaporan({ ...laporan, nip: value })
                  }
                />

                <Input
                  label="Jabatan"
                  value={laporan.jabatan}
                  onChange={(value) =>
                    setLaporan({ ...laporan, jabatan: value })
                  }
                />
              </div>
            </Section>
          )}

          {/* KEAMANAN */}
          {active === "keamanan" && (
            <Section
              title="Pengguna & Keamanan"
              description="Kelola akses pengguna SIMSTOK BMN."
              icon={<ShieldCheck size={22} />}
            >
              <div className="grid gap-4 md:grid-cols-3">
                <RoleCard title="Administrator" desc="Akses penuh" />
                <RoleCard title="Operator BMN" desc="Kelola data BMN" />
                <RoleCard title="Viewer" desc="Lihat data dan laporan" />
              </div>

              <div className="mt-6 rounded-2xl border p-5">
                <p className="font-bold text-slate-800">
                  Log Aktivitas
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Catat aktivitas perubahan data BMN untuk meningkatkan
                  akuntabilitas.
                </p>
              </div>
            </Section>
          )}

          {/* BACKUP */}
          {active === "backup" && (
            <Section
              title="Backup Data"
              description="Lindungi data SIMSTOK dengan pencadangan berkala."
              icon={<DatabaseBackup size={22} />}
            >
              <div className="rounded-2xl bg-slate-50 p-6">
                <p className="font-bold text-slate-800">
                  Backup Database SIMSTOK
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Simpan salinan data BMN secara berkala untuk mencegah
                  kehilangan data.
                </p>

                <button className="mt-5 flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800">
                  <DatabaseBackup size={18} />
                  Backup Sekarang
                </button>
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= COMPONENT ================= */

function Section({
  title,
  description,
  icon,
  children,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-7 flex items-start gap-4 border-b pb-5">
        <div className="rounded-2xl bg-blue-100 p-3 text-blue-700">
          {icon}
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-800">
            {title}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {description}
          </p>
        </div>
      </div>

      {children}
    </div>
  );
}

function Input({
  label,
  value = "",
  onChange,
  textarea = false,
  type = "text",
}: {
  label: string;
  value?: string;
  onChange?: (value: string) => void;
  textarea?: boolean;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        />
      )}
    </div>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function SettingCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <p className="mb-3 font-bold text-slate-800">{title}</p>

      <div className="space-y-2">
        {items.map((item) => (
          <div
           key={`${title}-${item}`}
            className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm"
          >
           <span>{item}</span>
            <ChevronRight size={15} className="text-slate-400" />
          </div>
        ))}
      </div>
    </div>
  );
}

function RoleCard({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <ShieldCheck className="mb-3 text-blue-700" size={23} />
      <p className="font-bold text-slate-800">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{desc}</p>
    </div>
  );
}