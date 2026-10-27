import { NextRequest, NextResponse } from "next/server";
import { EdgeTTS } from "../../../vendor/node-edge-tts/dist/edge-tts-v1.2.12-reference.js";
import fs from "fs/promises";
import os from "os";
import path from "path";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const secret = process.env.TTS_TEST_SECRET;
  const token = req.headers.get("x-tts-test-token");

if (!secret || token !== secret) {
  return NextResponse.json(
    {
      error: "Akses pengujian ditolak",
      diagnostic: {
        secretAvailable: Boolean(secret),
        tokenReceived: token !== null,
        tokenLength: token?.length ?? 0,
        secretLength: secret?.length ?? 0,
      },
    },
    { status: 401 }
  );
}
  let tempFile: string | undefined;

  try {
    const { text } = await req.json();

    if (typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Teks tidak valid" },
        { status: 400 }
      );
    }

    tempFile = path.join(
      os.tmpdir(),
      `simasdi-tts-test-${Date.now()}.mp3`
    );

    const tts = new EdgeTTS({
      voice: "id-ID-GadisNeural",
      lang: "id-ID",
      outputFormat: "audio-24khz-96kbitrate-mono-mp3",
      rate: "-8%",
      pitch: "-15Hz",
      volume: "+0%",
      timeout: 30000,
    });

    await tts.ttsPromise(text, tempFile);
    const audio = await fs.readFile(tempFile);

    return new NextResponse(new Uint8Array(audio), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("EDGE TTS TEST ERROR:", error);

    return NextResponse.json(
      {
        error: "Pengujian TTS v1.2.12 gagal",
        detail:
          error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  } finally {
    if (tempFile) {
      await fs.unlink(tempFile).catch(() => {});
    }
  }
}