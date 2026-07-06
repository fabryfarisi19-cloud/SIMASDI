
export async function panggilSuara(nomor: string, loket: number) {
  console.log("1. MASUK FUNGSI");

  const audio = new Audio("/sound/call-to-attention.mp3");

  audio.oncanplay = () => console.log("2. AUDIO SIAP");
  audio.onplay = () => console.log("3. AUDIO PLAY");
  audio.onended = () => console.log("4. AUDIO SELESAI");
  audio.onerror = (e) => console.error("5. AUDIO ERROR", e);

  try {
    await audio.play();
    console.log("6. PLAY BERHASIL");
  } catch (e) {
    console.error("7. PLAY GAGAL", e);
  }
}