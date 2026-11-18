import "server-only";

export async function limitedBody(request: Request): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    length += next.value.byteLength;
    if (length > 65536) { await reader.cancel(); throw new Error("Request too large"); }
    chunks.push(next.value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
