// src/config/remoteConfig.ts
import { decryptRemoteConf, type EncJson } from "./asegcm";

const CONF_URL = import.meta.env.VITE_REMOTE_CONF_URL as string;
const PASSPHRASE = import.meta.env.VITE_CONF_PASSPHRASE as string;

const LS_KEY_API = "remote.api.url";
const LS_KEY_HASH = "remote.api.hash";

export type RemoteConf = { api: string };

/** 简单 hash（足够用于变更对比） */
function simpleHash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 131 + s.charCodeAt(i)) >>> 0;
  return String(h);
}

export function getCachedApi(): string | null {
  return localStorage.getItem(LS_KEY_API);
}

export function saveApiToCache(api: string) {
  localStorage.setItem(LS_KEY_API, api);
  localStorage.setItem(LS_KEY_HASH, simpleHash(api));
}

export function isDifferentFromCache(api: string): boolean {
  const hOld = localStorage.getItem(LS_KEY_HASH);
  const hNew = simpleHash(api);
  return hOld !== hNew;
}

/** 拉取远端加密配置并解密 -> RemoteConf */
export async function fetchAndDecryptRemote(): Promise<RemoteConf> {
  console.log(CONF_URL,3333)
  const res = await fetch(CONF_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch conf failed: ${res.status}`);
  const encJson = (await res.json()) as EncJson; // { s, it, n, c }
  const plain = await decryptRemoteConf(encJson, PASSPHRASE);
  const conf = JSON.parse(plain) as RemoteConf;
  if (!conf.api || typeof conf.api !== "string")
    throw new Error("conf.api invalid");
  return conf;
}

/** 初始化流程：
 * - 先用缓存（有则加速首屏）
 * - 并发校验远端；如变更则更新缓存并回调
 */
export async function initRemoteApi(
  onChanged?: (api: string) => void,
): Promise<string> {
  const cached = getCachedApi();
  let baseApi = cached ?? "";

  try {
    const conf = await fetchAndDecryptRemote();
    if (!cached || isDifferentFromCache(conf.api)) {
      saveApiToCache(conf.api);
      baseApi = conf.api;
      onChanged?.(conf.api);
    }
  } catch (e) {
    if (!cached) throw e;
    console.warn("remote conf fetch/decrypt failed, using cached api:", e);
  }

  if (!baseApi)
    throw new Error("no api available (remote & cache both unavailable)");
  return baseApi;
}
