import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { supabaseAdmin } from "@/lib/supabase-admin";

function angka(value: unknown): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  let text = String(value).trim();

  if (!text) {
    return 0;
  }

  if (text.includes(".") && text.includes(",")) {
    text = text.replace(/\./g, "").replace(",", ".");
  } else if (text.includes(",")) {
    text = text.replace(",", ".");
  }

  text = text.replace(/[^\d.-]/g, "");

  const hasil = Number(text);

  return Number.isFinite(hasil) ? hasil : 0;
}

function ambilKolom(
  row: Record<string, unknown>,
  namaKolom: string[]
): unknown {
  const key = Object.keys(row).find((key) => {
    const normal = key
      .toLowerCase()
      .trim()
      .replace(/\s+/g, " ");

    return namaKolom.some(
      (nama) => normal === nama.toLowerCase().trim()
    );
  });

  return key ? row[key] : "";
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.penggunaId) {
      return NextResponse.json(
        { error: "Sesi pengguna tidak ditemukan." },
        { status: 401 }
      );
    }

   const role = session.role || "";
const username = String((session as any).username || "").trim();

if (
  role !== "Admin" ||
  username !== "199408232017121004"
) {
  return NextResponse.json(
    {
      error:
        "Akses ditolak. Hanya akun Rio Andara yang dapat mengimport slip gaji.",
    },
    { status: 403 }
  );
}

    const body = await request.json();

    if (!Array.isArray(body?.data)) {
      return NextResponse.json(
        { error: "Data import tidak valid." },
        { status: 400 }
      );
    }

    const rows = body.data;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Tidak ada data yang akan diimport." },
        { status: 400 }
      );
    }

    const { data: pengguna, error: penggunaError } =
      await supabaseAdmin
        .from("pengguna")
        .select("id, nama, username")
        .not("username", "is", null);

    if (penggunaError) {
      console.error(
        "Gagal mengambil data pengguna:",
        penggunaError
      );

      return NextResponse.json(
        { error: "Gagal mengambil data pegawai." },
        { status: 500 }
      );
    }

    const mapPengguna = new Map<string, number>();

    for (const user of pengguna || []) {
      if (user.username) {
        mapPengguna.set(
          String(user.username).trim(),
          Number(user.id)
        );
      }
    }

    const dataImport = [];
    const errorRows = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index] as Record<string, unknown>;

      const nip = String(
        ambilKolom(row, [
          "NIP",
          "NIP / Username",
          "Username",
        ]) ?? ""
      ).trim();

      const bulan = angka(
        ambilKolom(row, ["Bulan"])
      );

      const tahun = angka(
        ambilKolom(row, ["Tahun"])
      );

      if (!nip) {
        errorRows.push({
          baris: index + 2,
          error: "NIP/Username kosong.",
        });
        continue;
      }

      const penggunaId = mapPengguna.get(nip);

      if (!penggunaId) {
        errorRows.push({
          baris: index + 2,
          nip,
          error:
            "NIP tidak ditemukan di tabel pengguna.",
        });
        continue;
      }

      if (!bulan || bulan < 1 || bulan > 12) {
        errorRows.push({
          baris: index + 2,
          nip,
          error: "Bulan tidak valid.",
        });
        continue;
      }

      if (!tahun || tahun < 2000 || tahun > 2100) {
        errorRows.push({
          baris: index + 2,
          nip,
          error: "Tahun tidak valid.",
        });
        continue;
      }

      dataImport.push({
        pengguna_id: penggunaId,
        bulan,
        tahun,

        gaji_pokok: angka(
          ambilKolom(row, ["Gaji Pokok"])
        ),

        tunjangan_keluarga: angka(
          ambilKolom(row, [
            "Tunjangan Keluarga",
            "T. Keluarga",
          ])
        ),

        tunjangan_jabatan: angka(
          ambilKolom(row, [
            "Tunjangan Jabatan",
            "T. Jabatan",
            "T. Struktural",
          ])
        ),

        tunjangan_lainnya: angka(
          ambilKolom(row, [
            "Tunjangan Lainnya",
            "T. Lainnya",
          ])
        ),

        potongan_pajak: angka(
          ambilKolom(row, [
            "Potongan Pajak",
            "Pot. Pajak",
            "Pot. PPh",
          ])
        ),

        potongan_bpjs: angka(
          ambilKolom(row, [
            "Potongan BPJS",
            "Pot. BPJS",
            "BPJS",
          ])
        ),

        potongan_pensiun: angka(
          ambilKolom(row, [
            "Potongan Pensiun",
            "Pot. Pensiun",
            "IWP",
          ])
        ),

        potongan_koperasi: angka(
          ambilKolom(row, [
            "Potongan Koperasi",
            "Koperasi",
          ])
        ),

        potongan_arisan_dw: angka(
          ambilKolom(row, [
            "Potongan Arisan DW",
            "Arisan DW",
          ])
        ),

        potongan_lainnya: angka(
          ambilKolom(row, [
            "Potongan Lainnya",
            "Pot. Lainnya",
          ])
        ),

        total_pendapatan: angka(
          ambilKolom(row, [
            "Total Pendapatan",
            "Jml Penghasilan",
          ])
        ),

        total_potongan: angka(
          ambilKolom(row, [
            "Total Potongan",
            "Jml Potongan",
          ])
        ),

        gaji_bersih: angka(
          ambilKolom(row, [
            "Gaji Bersih",
            "Take Home Pay",
          ])
        ),

        keterangan: String(
          ambilKolom(row, ["Keterangan"]) ?? ""
        ),
      });
    }

    // Jangan menyimpan apa pun jika ada satu saja
    // baris yang tidak valid.
    if (errorRows.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Import dibatalkan karena terdapat data yang tidak valid.",
          total: rows.length,
          berhasilDivalidasi: dataImport.length,
          kesalahan: errorRows,
        },
        { status: 400 }
      );
    }

    // Simpan data.
    // Jika kombinasi pengguna_id + bulan + tahun sudah ada,
    // data akan diperbarui.
    for (const item of dataImport) {
      const { data: dataLama, error: cekError } =
        await supabaseAdmin
          .from("rincian_gaji")
          .select("id")
          .eq("pengguna_id", item.pengguna_id)
          .eq("bulan", item.bulan)
          .eq("tahun", item.tahun)
          .maybeSingle();

      if (cekError) {
        console.error(
          "Gagal memeriksa data gaji:",
          cekError
        );

        return NextResponse.json(
          {
            error:
              "Gagal memeriksa data gaji yang sudah ada.",
          },
          { status: 500 }
        );
      }

      if (dataLama?.id) {
        const { error: updateError } =
          await supabaseAdmin
            .from("rincian_gaji")
            .update(item)
            .eq("id", dataLama.id);

        if (updateError) {
          console.error(
            "Gagal memperbarui data gaji:",
            updateError
          );

          return NextResponse.json(
            {
              error:
                "Gagal memperbarui data gaji.",
            },
            { status: 500 }
          );
        }
      } else {
        const { error: insertError } =
          await supabaseAdmin
            .from("rincian_gaji")
            .insert(item);

        if (insertError) {
          console.error(
            "Gagal menyimpan data gaji:",
            insertError
          );

          return NextResponse.json(
            {
              error:
                "Gagal menyimpan data gaji.",
            },
            { status: 500 }
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "Data gaji berhasil disimpan ke database.",
      total: dataImport.length,
    });
  } catch (error) {
    console.error(
      "API import gaji error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Terjadi kesalahan pada server.",
      },
      { status: 500 }
    );
  }
}