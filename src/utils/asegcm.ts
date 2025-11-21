// src/lib/aesgcm.ts
// 浏览器端解密工具（方案A：盐/迭代从远端密文读取）

export type EncJson = {
  s: string; // salt (base64)
  it: number; // iterations
  n: string; // iv/nonce (base64, 12 bytes)
  c: string; // ciphertext+tag (base64)
};

function b64ToU8(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  // 确保底层是标准 ArrayBuffer，规避 TS 的 BufferSource 兼容性问题
  return new Uint8Array(bytes.buffer.slice(0));
}

async function deriveKeyFromRemote(
  passphrase: string,
  saltB64: string,
  iter: number,
) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase),
    { name: "PBKDF2" },
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: b64ToU8(saltB64) as any,
      iterations: iter,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
}

/** 解密远端加密配置，返回明文字符串（例如：'{"api":"https://api.xxxx.com"}'） */
export async function decryptRemoteConf(
  encJson: EncJson,
  passphrase: string,
): Promise<string> {
  const key = await deriveKeyFromRemote(passphrase, encJson.s, encJson.it);
  const iv = b64ToU8(encJson.n);
  const ctPlusTag = b64ToU8(encJson.c); // 已经是 cipher+tag 组合
  // WebCrypto AES-GCM 接口接受 cipher+tag 合并的缓冲，直接传入即可
  const plainBuf = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as any },
    key,
    ctPlusTag as any,
  );
  return new TextDecoder().decode(plainBuf);
}
