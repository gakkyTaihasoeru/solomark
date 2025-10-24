import pako from "pako";

export async function compressJSON(json: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(json);
  const compressed = pako.deflate(data);
  return btoa(String.fromCharCode(...compressed));
}

export async function decompressJSON(base64: string): Promise<string> {
  const binary = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const decompressed = pako.inflate(binary);
  const decoder = new TextDecoder();
  return decoder.decode(decompressed);
}
