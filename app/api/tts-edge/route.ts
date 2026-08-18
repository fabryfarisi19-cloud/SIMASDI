import { NextRequest, NextResponse } from "next/server";
import { EdgeTTS } from "node-edge-tts";
import fs from "fs/promises";
import os from "os";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Teks tidak valid" },
        { status: 400 }
      );
    }

    const tempFile = path.join(
      os.tmpdir(),
      `simasdi-${Date.now()}.mp3`
    );

    const tts = new EdgeTTS({
      voice: "id-ID-GadisNeural",
      lang: "id-ID",
      outputFormat: "audio-24khz-96kbitrate-mono-mp3",
      rate: "-8%",
      pitch: "-1Hz",
      volume: "+0%",
     timeout: 30000,
    });

    await tts.ttsPromise(text, tempFile);

    const audio = await fs.readFile(tempFile);

    await fs.unlink(tempFile).catch(() => {});

    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("EDGE TTS ERROR:", error);

    return NextResponse.json(
      {
        error: "Gagal membuat suara",
        detail:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}