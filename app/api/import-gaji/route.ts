
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabaseAdmin } from "@/lib/supabase-admin";

type RowExcel = Record<
  string,
  string | number | null | undefined
>;

function angka(value: unknown): number {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  let text = String(value).trim();

  if (!text) return 0;

  /*
   * Angka Excel Indonesia:
   * 6.305.200
   * 512.830
   * 20.000
   *
   * Jika ada koma desimal:
   * 6.305.200,50
   */

  text = text.replace(/\s/g, "");

  /*
   * Jika ada format Rp
   */
  text = text
    .replace(/^Rp/i, "")
    .replace(/\./g, "");

  /*
   * Koma Indonesia menjadi titik desimal.
   */
  text = text.replace(",", ".");

  /*
   * Hilangkan karakter selain angka,
   * minus dan titik.
   */
  text = text.replace(/[^\d.-]/g, "");

  const n = Number(text);

  return Number.isFinite(n) ? n : 0;
}

function teks(value: unknown): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(value).trim();
}

function normalisasiNama(value: unknown): string {
  let nama = teks(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  nama = nama
    .replace(/\braden\s+mas\b/g, "rm")
    .replace(/\brm\.\s*/g, "rm ")
    .replace(/\bmuhamad\b/g, "muhammad")
    .replace(/\bdwi\s+asty\b/g, "dwi asti")
    .replace(/\bbayu\s+santosa\b/g, "bayu santoso")
    .replace(/\bahmad\b/g, "achmad")
    .replace(/\bsyaripudin\b/g, "syarifudin");

  /*
   * Hilangkan gelar.
   */
  nama = nama
    .replace(
      /\b(a\.?md\.?ip\.?|a\.?md\.?|a\.?md\.?tg|a\.?md\.?sab|s\.?h\.?|s\.?e\.?|s\.?sos\.?|s\.?psi\.?|s\.?kom\.?|s\.?pd\.?|s\.?pd\.?i\.?|s\.?ag\.?|s\.?tr\.?pas|s\.?t\.?p\.?|s\.?ap\.?|s\.?pt\.?|s\.?gz\.?|s\.?i\.kom\.?|m\.?si\.?|m\.?h\.?|m\.?krim\.?|m\.?m\.?|a\.?m\.?tg)\b/gi,
      ""
    );

  nama = nama
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return nama;
}

function variasiNama(value: unknown): string[] {
  const normal = normalisasiNama(value);

  if (!normal) return [];

  const hasil = new Set<string>();

  hasil.add(normal);

  hasil.add(
    normal
      .replace(/\brm\b/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );

  hasil.add(
    normal.replace(
      /\bmuhammad\b/g,
      "muhamad"
    )
  );

  hasil.add(
    normal.replace(
      /\bmuhamad\b/g,
      "muhammad"
    )
  );

  return Array.from(hasil);
}

function cariPenggunaDenganNama(
  namaExcel: unknown,
  mapNama: Map<string, number>
) {
  const variasi = variasiNama(namaExcel);

  /*
   * 1. Pencocokan normal
   */
  for (const nama of variasi) {
    const penggunaId = mapNama.get(nama);

    if (penggunaId) {
      return penggunaId;
    }
  }

  /*
   * 2. Alias yang memang sudah diketahui.
   */
  const aliasNama: Record<string, string> = {
    "dwi asty meryani":
      "dwi asti meryani",

    "muhamad teguh arief wibowo":
      "muhammad teguh arief wibowo",

    "bayu santosa":
      "bayu santoso",

    "syaripudin":
      "syarifudin",

    "ahmad fauzi":
      "achmad fauzi",
  };

  for (const nama of variasi) {
    const alias = aliasNama[nama];

    if (!alias) continue;

    const penggunaId =
      mapNama.get(alias);

    if (penggunaId) {
      return penggunaId;
    }
  }

  return undefined;
}

/*
 * Membaca kolom berdasarkan posisi Excel.
 *
 * Excel:
 *
 * A = COL_0
 * B = COL_1
 * C = COL_2
 * ...
 * BA = COL_52
 */
function kolom(
  row: RowExcel,
  index: number
): unknown {
  return row[`COL_${index}`];
}

/*
 * Struktur 53 kolom.
 *
 * 0  = kosong
 * 1  = NO
 * 2  = Nama
 * 3  = Pangkat/Golongan
 * 4  = Rekening
 *
 * 5-16 = Penghasilan
 * 17   = Jumlah Penghasilan
 *
 * 18   = POTONGAN / kelompok
 * 19-27 = potongan aplikasi gaji
 *
 * 28   = kolom pemisah
 *
 * 29-43 = potongan BAPAS
 *
 * 44   = kolom tambahan
 * 45   = Gaji Bersih
 * 46-52 = kolom tambahan Excel
 */

const POSISI = {
  NO: 1,
  NAMA: 2,
  PANGKAT: 3,
  REKENING: 4,

  GAJI_POKOK: 5,
  T_ISTRI_SUAMI: 6,
  T_ANAK: 7,
  T_UMUM: 8,
  T_PAPUA: 9,
  T_TERPENCIL: 10,
  T_STRUKTURAL: 11,
  T_FUNGSIONAL: 12,
  LAIN_LAIN: 13,
  PEMBULATAN: 14,
  T_BERAS: 15,
  T_PAJAK: 16,

  JUMLAH_PENGHASILAN: 17,

  PADA_APLIKASI_GAJI: 19,
  POT_BERAS: 20,
  IWP: 21,
  BPJS: 22,
  POT_PPH: 23,
  SEWA_RUMAH: 24,
  TUNGGAKAN: 25,
  UTANG_LEBIH: 26,
  POTONGAN_LAIN: 27,
  TAPERUM: 28,

  IURAN_DANSOS: 30,
  IURAN_DW: 31,
  KOPERASI: 32,
  IPKEMINDO: 33,
  BRI: 34,
  BJB: 35,
  BAPOR: 36,
  ARISAN_BAPAS: 37,
  PERPISAHAN_AZIZ: 38,
  ANAK_ASUH: 39,
  IURAN_DW_PIPAS: 40,
  ARISAN_PIPAS: 41,
  INKOPASNIDO: 42,
  JAHIT_BAJU_PIPAS_1: 43,
  KACAMATA_KE_2: 44,

  GAJI_BERSIH: 45,

  TAMBAHAN_46: 46,
  TAMBAHAN_47: 47,
  TAMBAHAN_48: 48,
  TAMBAHAN_49: 49,
  TAMBAHAN_50: 50,
  TAMBAHAN_51: 51,
  TAMBAHAN_52: 52,
} as const;

export async function POST(
  request: Request
) {
  try {
    const session =
      await getServerSession(
        authOptions
      );

    if (!session?.penggunaId) {
      return NextResponse.json(
        {
          error:
            "Sesi pengguna tidak ditemukan.",
        },
        { status: 401 }
      );
    }

    const penggunaIdSession =
      Number(session.penggunaId);

    if (!penggunaIdSession) {
      return NextResponse.json(
        {
          error:
            "ID pengguna tidak valid.",
        },
        { status: 400 }
      );
    }

    /*
     * Hanya Admin Rio yang boleh import.
     */
    const role = session.role || "";
    const username =
      session.user?.name || "";

    /*
     * Validasi menggunakan data session
     * dan database.
     */
    const { data: penggunaLogin } =
      await supabaseAdmin
        .from("pengguna")
        .select(
          "id,nama,username,role,status"
        )
        .eq(
          "id",
          penggunaIdSession
        )
        .maybeSingle();

    if (
      !penggunaLogin ||
      penggunaLogin.role !== "Admin" ||
      penggunaLogin.username !==
        "199408232017121004"
    ) {
      return NextResponse.json(
        {
          error:
            "Hanya Admin yang berwenang melakukan import data gaji.",
        },
        { status: 403 }
      );
    }

    const body =
      await request.json();

    const rows =
      Array.isArray(body?.data)
        ? (body.data as RowExcel[])
        : [];

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error:
            "Data Excel kosong.",
        },
        { status: 400 }
      );
    }

    /*
     * Ambil seluruh pengguna.
     */
    const {
      data: pengguna,
      error: penggunaError,
    } = await supabaseAdmin
      .from("pengguna")
      .select(
        "id,nama,username,role,status"
      );

    if (penggunaError) {
      console.error(
        penggunaError
      );

      return NextResponse.json(
        {
          error:
            "Gagal mengambil data pengguna.",
        },
        { status: 500 }
      );
    }

    /*
     * Map username/NIP.
     */
    const mapUsername =
      new Map<string, number>();

    /*
     * Map nama.
     */
    const mapNama =
      new Map<string, number>();

    for (const p of pengguna || []) {
      if (p.username) {
        mapUsername.set(
          String(p.username).trim(),
          p.id
        );
      }

      for (const nama of variasiNama(
        p.nama
      )) {
        if (!mapNama.has(nama)) {
          mapNama.set(
            nama,
            p.id
          );
        }
      }
    }

    /*
     * Default periode.
     *
     * File yang sedang digunakan:
     * September 2026.
     */
    const bulan = 9;
    const tahun = 2026;

    const kesalahan: Array<{
      baris: number;
      nip?: string;
      error: string;
    }> = [];

   const dataSiap: Array<{
  pengguna_id: number;
  bulan: number;
  tahun: number;
  gaji_pokok: number;
  tunjangan_keluarga: number;
  tunjangan_jabatan: number;
  tunjangan_lainnya: number;
  potongan_pajak: number;
  potongan_bpjs: number;
  potongan_pensiun: number;
  potongan_koperasi: number;
  potongan_arisan_dw: number;
  potongan_lainnya: number;
  total_pendapatan: number;
  total_potongan: number;
  gaji_bersih: number;
  keterangan: string;
}> = [];
    /*
     * Proses setiap pegawai.
     */
    for (
      let i = 0;
      i < rows.length;
      i++
    ) {
      const row = rows[i];

      const nomorBaris =
        i + 5;

      const namaExcel =
        kolom(
          row,
          POSISI.NAMA
        );

      const nama =
        teks(namaExcel);

      const nipExcel = teks(
        row.NIP ??
          row.Nip ??
          row.Username ??
          row.username ??
          ""
      );

      /*
       * Cari berdasarkan NIP terlebih dahulu.
       */
      let penggunaId:
        | number
        | undefined;

      if (nipExcel) {
        penggunaId =
          mapUsername.get(
            nipExcel
          );
      }

      /*
       * Kalau tidak ada NIP,
       * cari berdasarkan nama.
       */
      if (!penggunaId) {
        penggunaId =
          cariPenggunaDenganNama(
            namaExcel,
            mapNama
          );
      }

      if (!penggunaId) {
        kesalahan.push({
          baris: nomorBaris,
          nip:
            nipExcel ||
            undefined,
          error:
            `Pegawai "${nama}" tidak ditemukan di tabel pengguna.`,
        });

        continue;
      }

      /*
       * Ambil seluruh nominal.
       */

      const gajiPokok =
        angka(
          kolom(
            row,
            POSISI.GAJI_POKOK
          )
        );

      const tIstriSuami =
        angka(
          kolom(
            row,
            POSISI.T_ISTRI_SUAMI
          )
        );

      const tAnak =
        angka(
          kolom(
            row,
            POSISI.T_ANAK
          )
        );

      const tUmum =
        angka(
          kolom(
            row,
            POSISI.T_UMUM
          )
        );

      const tPapua =
        angka(
          kolom(
            row,
            POSISI.T_PAPUA
          )
        );

      const tTerpencil =
        angka(
          kolom(
            row,
            POSISI.T_TERPENCIL
          )
        );

      const tStruktural =
        angka(
          kolom(
            row,
            POSISI.T_STRUKTURAL
          )
        );

      const tFungsional =
        angka(
          kolom(
            row,
            POSISI.T_FUNGSIONAL
          )
        );

      const lainLain =
        angka(
          kolom(
            row,
            POSISI.LAIN_LAIN
          )
        );

      const pembulatan =
        angka(
          kolom(
            row,
            POSISI.PEMBULATAN
          )
        );

      const tBeras =
        angka(
          kolom(
            row,
            POSISI.T_BERAS
          )
        );

      const tPajak =
        angka(
          kolom(
            row,
            POSISI.T_PAJAK
          )
        );

      /*
       * Total penghasilan.
       */
      const totalPendapatan =
        angka(
          kolom(
            row,
            POSISI.JUMLAH_PENGHASILAN
          )
        );

      /*
       * Potongan.
       */
      const padaAplikasiGaji =
        angka(
          kolom(
            row,
            POSISI.PADA_APLIKASI_GAJI
          )
        );

      const potBeras =
        angka(
          kolom(
            row,
            POSISI.POT_BERAS
          )
        );

      const iwp =
        angka(
          kolom(
            row,
            POSISI.IWP
          )
        );

      const bpjs =
        angka(
          kolom(
            row,
            POSISI.BPJS
          )
        );

      const potPph =
        angka(
          kolom(
            row,
            POSISI.POT_PPH
          )
        );

      const sewaRumah =
        angka(
          kolom(
            row,
            POSISI.SEWA_RUMAH
          )
        );

      const tunggakan =
        angka(
          kolom(
            row,
            POSISI.TUNGGAKAN
          )
        );

      const utangLebih =
        angka(
          kolom(
            row,
            POSISI.UTANG_LEBIH
          )
        );

      const potonganLain =
        angka(
          kolom(
            row,
            POSISI.POTONGAN_LAIN
          )
        );

      const taperum =
        angka(
          kolom(
            row,
            POSISI.TAPERUM
          )
        );

      /*
       * Potongan BAPAS.
       */
      const iuranDansos =
        angka(
          kolom(
            row,
            POSISI.IURAN_DANSOS
          )
        );

      const iuranDw =
        angka(
          kolom(
            row,
            POSISI.IURAN_DW
          )
        );

      const koperasi =
        angka(
          kolom(
            row,
            POSISI.KOPERASI
          )
        );

      const ipkemindo =
        angka(
          kolom(
            row,
            POSISI.IPKEMINDO
          )
        );

      const bri =
        angka(
          kolom(
            row,
            POSISI.BRI
          )
        );

      const bjb =
        angka(
          kolom(
            row,
            POSISI.BJB
          )
        );

      const bapor =
        angka(
          kolom(
            row,
            POSISI.BAPOR
          )
        );

      const arisanBapas =
        angka(
          kolom(
            row,
            POSISI.ARISAN_BAPAS
          )
        );

      const perpisahanAziz =
        angka(
          kolom(
            row,
            POSISI.PERPISAHAN_AZIZ
          )
        );

      const anakAsuh =
        angka(
          kolom(
            row,
            POSISI.ANAK_ASUH
          )
        );

      const iuranDwPipas =
        angka(
          kolom(
            row,
            POSISI.IURAN_DW_PIPAS
          )
        );

      const arisanPipas =
        angka(
          kolom(
            row,
            POSISI.ARISAN_PIPAS
          )
        );

      const inkopasnido =
        angka(
          kolom(
            row,
            POSISI.INKOPASNIDO
          )
        );

      const jahitBajuPipas1 =
        angka(
          kolom(
            row,
            POSISI.JAHIT_BAJU_PIPAS_1
          )
        );

      const kacamataKe2 =
        angka(
          kolom(
            row,
            POSISI.KACAMATA_KE_2
          )
        );

      /*
       * Gaji bersih.
       */
      const gajiBersih =
        angka(
          kolom(
            row,
            POSISI.GAJI_BERSIH
          )
        );

      /*
       * Total potongan aplikasi gaji.
       *
       * Mengikuti angka "Gaji Bersih"
       * dan komponen potongan dari Excel.
       */
      const totalPotongan =
        padaAplikasiGaji +
        potBeras +
        iwp +
        bpjs +
        potPph +
        sewaRumah +
        tunggakan +
        utangLebih +
        potonganLain +
        taperum;

      /*
       * Tunjangan lama untuk kompatibilitas
       * dengan tampilan Rincian Gaji lama.
       */
      const tunjanganKeluarga =
        tIstriSuami + tAnak;

      const tunjanganJabatan =
        tStruktural;

      const tunjanganLainnya =
        tUmum +
        tPapua +
        tTerpencil +
        tFungsional +
        lainLain +
        pembulatan +
        tBeras +
        tPajak;

dataSiap.push({
  pengguna_id: penggunaId,
  bulan,
  tahun,

  gaji_pokok: gajiPokok,

  tunjangan_keluarga:
    tunjanganKeluarga,

  tunjangan_jabatan:
    tunjanganJabatan,

  tunjangan_lainnya:
    tunjanganLainnya,

  potongan_pajak:
    potPph,

  potongan_bpjs:
    bpjs,

  potongan_pensiun:
    iwp,

  potongan_koperasi:
    koperasi,

  potongan_arisan_dw:
    iuranDw,

  potongan_lainnya:
    potonganLain,

  total_pendapatan:
    totalPendapatan,

  total_potongan:
    totalPotongan,

  gaji_bersih:
    gajiBersih,

  keterangan:
    "Import Excel September 2026",
});
    }

    /*
     * Jika ada pegawai yang tidak ditemukan,
     * hentikan import agar data tidak setengah masuk.
     */
    if (kesalahan.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Import dibatalkan karena ada pegawai yang tidak ditemukan.",
          total: rows.length,
          berhasilDivalidasi:
            dataSiap.length,
          kesalahan,
        },
        { status: 400 }
      );
    }

    /*
     * Simpan satu per satu menggunakan upsert.
     *
     * Kunci:
     * pengguna_id + bulan + tahun
     */
    for (const item of dataSiap) {
      const { error } =
        await supabaseAdmin
          .from("rincian_gaji")
          .upsert(
            item,
            {
              onConflict:
                "pengguna_id,bulan,tahun",
            }
          );

      if (error) {
        console.error(
          "Gagal menyimpan rincian gaji:",
          error
        );

        return NextResponse.json(
          {
            success: false,
            error:
              `Gagal menyimpan data gaji untuk pengguna ID ${item.pengguna_id}: ${error.message}`,
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message:
        `Berhasil mengimport ${dataSiap.length} data gaji pegawai untuk September 2026.`,
      total: rows.length,
      berhasilDivalidasi:
        dataSiap.length,
      kesalahan: [],
    });
  } catch (error) {
    console.error(
      "API import-gaji error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          "Terjadi kesalahan pada server saat import gaji.",
      },
      { status: 500 }
    );
  }
}

