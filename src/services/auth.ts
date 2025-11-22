import { request } from "@/utils/request";

export const handleLoginSuccess = (responseData: any) => {
  try {
    localStorage.setItem("token", responseData.token);
    if (responseData.is_admin === 1) {
      localStorage.setItem("is_admin", "1");
    }
    localStorage.setItem("is_auth", "1");

    if (responseData.auth_data) {
      localStorage.setItem("auth_data", responseData.auth_data);
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const login = async (loginData: any) => {
  const { rememberMe, ...requestData } = loginData;
  try {
    const response = await request({
      url: "/passport/auth/login",
      method: "post",
      data: requestData,
    });
    let responseData: any = response;
    if (
      (response && response.data) ||
      (response &&
        typeof response === "object" &&
        Object.prototype.hasOwnProperty.call(response, "data"))
    ) {
      responseData = response.data;
    }

    if (!responseData || !(responseData.token || responseData.auth_data)) {
      throw new Error("登录数据不完整");
    }

    const handledResponse = handleLoginSuccess(responseData);

    if (handledResponse.success) {
      return {
        success: true,
        token: responseData.token,
        auth_data: responseData.auth_data,
        is_admin: responseData.is_admin,
      };
    } else {
      throw new Error(handledResponse.error);
    }
  } catch (error: any) {
    console.log(error.message);
  }
};

export const register = async (registrationData: any) => {
  try {
    const response = await request({
      url: "/passport/auth/register",
      method: "post",
      data: registrationData,
    });
    let responseData: any = response;
    if (
      (response && response.data) ||
      (response &&
        typeof response === "object" &&
        Object.prototype.hasOwnProperty.call(response, "data"))
    ) {
      responseData = response.data;
    }

    if (!responseData || !(responseData.token || responseData.auth_data)) {
      throw new Error("登录数据不完整");
    }

    const handledResponse = handleLoginSuccess(responseData);

    if (handledResponse.success) {
      return {
        success: true,
        token: responseData.token,
        auth_data: responseData.auth_data,
        is_admin: responseData.is_admin,
      };
    } else {
      throw new Error(handledResponse.error);
    }
  } catch (error: any) {
    console.log(error.message);
    return { success: false, error: error.message };
  }
};

export const sendVerificationCode = async (email: string) => {
  try {
    const response = await request({
      url: "/passport/comm/sendEmailVerify", // 假设的发送验证码接口
      method: "post",
      data: { email, isForgetPassword: false },
    });
    let responseData: any = response;
    if (
      (response && response.data) ||
      (response &&
        typeof response === "object" &&
        Object.prototype.hasOwnProperty.call(response, "data"))
    ) {
      responseData = response.data;
    }

    if (responseData) {
      // 假设成功响应的code为0
      return {
        success: true,
        message: responseData.message || "验证码发送成功",
      };
    } else {
      throw new Error(responseData?.message || "验证码发送失败");
    }
  } catch (error: any) {
    console.log(error.message);
    return { success: false, error: error.message };
  }
};

export function getUserSubscribe() {
  return request({
    url: "/user/getSubscribe",
    method: "get",
  });
}

export interface PlanItem {
  id: number;
  group_id: number;
  transfer_enable: number;
  name: string;
  speed_limit: number | null;
  show: number;
  sort: number;
  renew: number;
  content: string;
  month_price: number | null;
  quarter_price: number | null;
  half_year_price: number | null;
  year_price: number | null;
  two_year_price: number | null;
  three_year_price: number | null;
  onetime_price: number | null;
  reset_price: number;
  reset_traffic_method: number | null;
  capacity_limit: number | null;
  created_at: number;
  updated_at: number;
}

export const fetchPlan = async (): Promise<{
  success: boolean;
  data?: PlanItem[];
  error?: string;
}> => {
  try {
    const response = await request({
      url: "/user/plan/fetch",
      method: "get",
    });
    let responseData: any = response;
    if (
      (response && response.data) ||
      (response &&
        typeof response === "object" &&
        Object.prototype.hasOwnProperty.call(responseData, "data"))
    ) {
      responseData = response.data;
    }
    return { success: true, data: responseData };
  } catch (error: any) {
    console.log(error.message);
    return { success: false, error: error.message };
  }
};

export const saveOrder = async (
  plan_id: number,
  period: keyof PlanItem,
): Promise<{ success: boolean; data?: string; error?: string }> => {
  try {
    const response = await request({
      url: "/user/order/save",
      method: "post",
      data: { plan_id, period },
    });
    let responseData: any = response;
    if (
      (response && response.data) ||
      (response &&
        typeof response === "object" &&
        Object.prototype.hasOwnProperty.call(response, "data"))
    ) {
      responseData = response.data;
    }
    if (responseData) {
      // 假设成功响应的code为0
      return { success: true, data: responseData }; // 返回 trade_no
    } else {
      throw new Error(responseData?.message || "保存订单失败");
    }
  } catch (error: any) {
    console.log(error.message);
    return { success: false, error: error.message };
  }
};

export interface OrderPlan {
  name: string;
  transfer_enable: number;
}

export interface OrderDetail {
  // 根据 /user/order/detail 接口的实际返回结构定义
  trade_no: string;
  plan_name: string;
  period: string; // 将 period_label 修改为 period
  total_amount: number;
  content: string; // 添加 content 属性
  transfer_enable: number; // 添加 transfer_enable 属性
  created_at: number; // 添加 created_at 属性
  plan: OrderPlan; // 添加 plan 属性
  // ... 其他订单详情字段
}

export const fetchOrderDetail = async (
  trade_no: string,
): Promise<{ success: boolean; data?: OrderDetail; error?: string }> => {
  try {
    const response = await request({
      url: `/user/order/detail?trade_no=${trade_no}`,
      method: "get",
    });
    let responseData: any = response;
    if (
      (response && response.data) ||
      (response &&
        typeof response === "object" &&
        Object.prototype.hasOwnProperty.call(response, "data"))
    ) {
      responseData = response.data;
    }
    if (responseData) {
      // 假设成功响应的code为0
      return { success: true, data: responseData };
    } else {
      throw new Error(responseData?.message || "获取订单详情失败");
    }
  } catch (error: any) {
    console.log(error.message);
    return { success: false, error: error.message };
  }
};

export interface PaymentMethod {
  id: number;
  name: string;
  icon: string; // 支付方式图标 URL
  // ... 其他支付方式字段
}

export const fetchPaymentMethods = async (): Promise<{
  success: boolean;
  data?: PaymentMethod[];
  error?: string;
}> => {
  try {
    const response = await request({
      url: "/user/order/getPaymentMethod",
      method: "get",
    });
    let responseData: any = response;
    if (
      (response && response.data) ||
      (response &&
        typeof response === "object" &&
        Object.prototype.hasOwnProperty.call(response, "data"))
    ) {
      responseData = response.data;
    }
    if (responseData) {
      // 假设成功响应的code为0
      return { success: true, data: responseData };
    } else {
      throw new Error(responseData?.message || "获取支付方式失败");
    }
  } catch (error: any) {
    console.log(error.message);
    return { success: false, error: error.message };
  }
};

export interface OrderItem {
  id: number;
  trade_no: string;
  created_at: number;
  period: string;
  total_amount: number;
  status: 0 | 2 | 3; // 0是待支付，2是已取消，3是已完成
  plan_id: number;
  plan_name: string;
}

export const fetchOrders = async (): Promise<{
  success: boolean;
  data?: OrderItem[];
  error?: string;
}> => {
  try {
    const response = await request({
      url: "/user/order/fetch",
      method: "get",
    });
    let responseData: any = response;
    if (
      (response && response.data) ||
      (response &&
        typeof response === "object" &&
        Object.prototype.hasOwnProperty.call(response, "data"))
    ) {
      responseData = response.data;
    }
    if (responseData) {
      // 假设成功响应的code为0
      return { success: true, data: responseData };
    } else {
      throw new Error(responseData?.message || "获取订单列表失败");
    }
  } catch (error: any) {
    console.log(error.message);
    return { success: false, error: error.message };
  }
};

export const cancelOrder = async (
  trade_no: string,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await request({
      url: "/user/order/cancel",
      method: "post",
      data: { trade_no },
    });
    let responseData: any = response;
    if (
      (response && response.data) ||
      (response &&
        typeof response === "object" &&
        Object.prototype.hasOwnProperty.call(response, "data"))
    ) {
      responseData = response.data;
    }
    if (responseData) {
      // 假设成功响应的code为0
      return { success: true };
    } else {
      throw new Error(responseData?.message || "取消订单失败");
    }
  } catch (error: any) {
    console.log(error.message);
    return { success: false, error: error.message };
  }
};

export const checkOrderStatus = async (
  trade_no: string,
): Promise<{ success: boolean; status?: number; error?: string }> => {
  try {
    const response = await request({
      url: `/user/order/check?trade_no=${trade_no}`,
      method: "get",
    });
    let responseData: any = response;
    if (
      (response && response.data) ||
      (response &&
        typeof response === "object" &&
        Object.prototype.hasOwnProperty.call(response, "data"))
    ) {
      responseData = response.data;
    }
    return { success: true, status: responseData }; // 返回支付状态
  } catch (error: any) {
    console.log(error.message);
    return { success: false, error: error.message };
  }
};

export const checkOrder = async (
  tradeNo: string,
  methodId: number,
): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    const response = await request({
      url: `/user/order/checkout`,
      method: "post",
      data: {
        trade_no: tradeNo,
        method: methodId,
      },
    });
    let responseData: any = response;
    if (
      (response && response.data) ||
      (response &&
        typeof response === "object" &&
        Object.prototype.hasOwnProperty.call(response, "data"))
    ) {
      responseData = response.data;
    }
    return { success: true, data: responseData }; // 返回支付状态
  } catch (error: any) {
    console.log(error.message);
    return { success: false, error: error.message };
  }
};
