// src/config/remoteConfig.ts
import { decryptRemoteConf, type EncJson } from "./asegcm";
import { callServerFetch } from "@/services/cmds";
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
  const text: any = await callServerFetch(CONF_URL);
  // 假设 EncJson, RemoteConf 类型已经声明

  let encJson: EncJson;
  try {
    const first = JSON.parse(text);
    if (typeof first === "string") {
      // 响应是一个字符串字面量，里面才是 JSON
      encJson = JSON.parse(first) as EncJson;
    } else {
      // 响应已经是对象
      encJson = first as EncJson;
    }

  } catch (e) {
    throw new Error("Invalid JSON from remote: " + (e as Error).message);
  }

  const plain = await decryptRemoteConf(encJson, PASSPHRASE);
  const conf = JSON.parse(plain) as RemoteConf;
  if (!conf.api || typeof conf.api !== "string")
    throw new Error("conf.api invalid");
  return conf;

  // const encJson = (await res.json()) as EncJson; // { s, it, n, c }
  // const plain = await decryptRemoteConf(encJson, PASSPHRASE);
  // const conf = JSON.parse(plain) as RemoteConf;
  // if (!conf.api || typeof conf.api !== "string")
  //   throw new Error("conf.api invalid");
  // return conf;
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
