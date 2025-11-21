import {
  deleteProfile,
  getProfiles,
  importProfile,
  patchProfilesConfig,
} from "@/services/cmds";
import { showNotice } from "@/services/noticeService";
import { t } from "i18next";
import { useProfiles } from "./use-profiles";
import { useEffect } from "react";
import dayjs from "dayjs";
export const useImport = () => {
  const patchProfiles = async (
    value: Partial<IProfilesConfig>,
    signal?: AbortSignal,
  ) => {
    try {
      if (signal?.aborted) {
        throw new DOMException("Operation was aborted", "AbortError");
      }
      const success = await patchProfilesConfig(value);

      if (signal?.aborted) {
        throw new DOMException("Operation was aborted", "AbortError");
      }

      return success;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw error;
      }

      throw error;
    }
  };

  const activateProfile = async (profile: string) => {
    try {
      const currentAbortController = new AbortController();
      // 执行切换请求
      const requestPromise = patchProfiles(
        { current: profile },
        currentAbortController.signal,
      );

      await requestPromise;
    } catch (err: any) {
      console.error(`[Profile] 切换失败:`, err);
      showNotice("error", err?.message || err.toString(), 4000);
    }
  };

  const onImport = async (url: string, expired: number) => {
    if (!url) return;
    // 校验url是否为http/https
    if (!/^https?:\/\//i.test(url)) {
      showNotice("error", t("Invalid Profile URL"));
      return;
    }
    const currentTime = dayjs().unix(); // 获取当前时间戳 (秒)
    console.log(currentTime,expired)
    if (expired <= currentTime) {
      showNotice("error", t("套餐已过期，请续费")); // 提供完整的参数
      // 如果过期，也需要关闭 Dialog 并返回首页
      return;
    }

    try {
      let profiles = await getProfiles();
      const count = profiles.items?.filter((p) => p.url === url)?.length;
      if (count === 0) {
        // 尝试正常导入
        await importProfile(url);
        profiles = await getProfiles();
        const item = profiles.items?.find((p) => p.url === url);
        activateProfile(item?.uid ?? "");
        const items = profiles.items?.filter((p) => p.url !== url);
        items?.forEach((p) => deleteProfile(p.uid));
        showNotice("success", t("Profile Imported Successfully"));
      }
      // 增强的刷新策略
    } catch (err: any) {
      // 首次导入失败，尝试使用自身代理
      const errmsg = err.message || err.toString();
      showNotice("info", t("Import failed, retrying with Clash proxy..."));
      try {
        // 使用自身代理尝试导入
        await importProfile(url, {
          with_proxy: false,
          self_proxy: true,
        });
        // 回退导入成功
        showNotice("success", t("Profile Imported with Clash proxy"));
      } catch (retryErr: any) {
        // 回退导入也失败
        const retryErrmsg = retryErr?.message || retryErr.toString();
        showNotice(
          "error",
          `${t("Import failed even with Clash proxy")}: ${retryErrmsg}`,
        );
      }
    }
  };
  return {
    onImport,
  };
};
