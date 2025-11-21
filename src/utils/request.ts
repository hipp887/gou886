import axios from "axios";
import { authActions, store } from "./store";

import { initRemoteApi, getCachedApi } from "./remoteConfig";

export const request = axios.create({
  baseURL: (getCachedApi() ?? "") + "/api/v1", // 先用缓存加速首屏；无缓存时为 "/api/v1"
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// 初始化：页面启动时运行，拿到远程解密结果并校验是否变化
export async function initRequestBaseURL() {
  const api = await initRemoteApi((newApi) => {
    // 远程与缓存不同 => 动态更新 axios baseURL
    request.defaults.baseURL = newApi.replace(/\/+$/, "") + "/api/v1";
  });
  // 首次构建 baseURL（当没有缓存时）
  if (
    !request.defaults.baseURL ||
    request.defaults.baseURL.endsWith("/api/v1") === false
  ) {
    request.defaults.baseURL = api.replace(/\/+$/, "") + "/api/v1";
  }
}

request.interceptors.request.use(
  (config) => {
    let authData = localStorage.getItem("auth_data");
    console.log(getCachedApi(), 123123);
    if (authData) {
      config.headers["Authorization"] = authData;
    }

    return config;
  },
  (error) => {
    console.error("请求拦截器错误:", error);
    return Promise.reject(new Error("请求配置错误"));
  },
);

request.interceptors.response.use(
  (response) => {
    try {
      const res = response.data;

      if (!res && res.message !== "未登录或登陆已过期") {
        console.log("检测到登录已过期，执行登出操作");
        console.log("outoutoutoutoutout");
        store.dispatch(authActions.logout());
        return Promise.reject(new Error(res.message));
      }

      return res;
    } catch (err) {
      console.error("响应数据处理错误:", err);
      return Promise.reject(new Error("响应数据处理错误"));
    }
  },
  (error) => {
    console.error("请求错误:", error);

    if (error.response && error.response.data && error.response.data.message) {
      error.response.message = error.response.data.message;
    } else if (error.response) {
      const statusCode = error.response.status;
      switch (statusCode) {
        case 400:
          error.response.message = "请求参数错误";
          break;
        case 401:
          error.response.message = "未授权，请重新登录";
          break;
        case 403:
          error.response.message = "拒绝访问";
          break;
        case 404:
          error.response.message = "请求的资源不存在";
          break;
        default:
          error.response.message = `请求失败 (${statusCode})`;
      }
    } else if (error.message) {
      if (error.message.includes("timeout")) {
        error.message = "请求超时";
      } else if (error.message.includes("Network Error")) {
        error.message = "网络错误，请检查您的网络连接";
      }
    }

    return Promise.reject(error);
  },
);
