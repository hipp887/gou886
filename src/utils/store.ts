import { createSlice } from "@reduxjs/toolkit";

import { configureStore } from "@reduxjs/toolkit";
import { request } from "./request";

const name = "auth";
const initialState = createInitialState();
const slice = createSlice({
  name,
  initialState,
  reducers: {
    login(state, actions) {
      state.token = actions.payload.token;
      state.authData = actions.payload.auth_data;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.token = "";
      state.authData = "";
      state.isAuthenticated = false;

      localStorage.setItem("token", "");
      localStorage.setItem("is_admin", "0");
      localStorage.setItem("is_auth", "0");
      localStorage.setItem("auth_data", "");
    },
    setUser(_, actions) {
      localStorage.setItem("userInfo", JSON.stringify(actions.payload));
    },
  },
});

function createInitialState() {
  return {
    authData: localStorage.getItem("auth_data") || "",
    token: localStorage.getItem("token") || "",
    error: null,
    isAuthenticated: localStorage.getItem("is_auth") === "1",
  };
}

// exports

export const authActions = { ...slice.actions };
export const authReducer = slice.reducer;

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

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
