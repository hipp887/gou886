import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Divider,
  Paper,
  CircularProgress,
  Grid,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
} from "@mui/material"; // 导入 Snackbar
import { useTranslation } from "react-i18next";
import {
  fetchOrderDetail,
  fetchPaymentMethods,
  OrderDetail,
  PaymentMethod,
  cancelOrder,
  checkOrderStatus,
  PlanItem,
  checkOrder,
} from "@/services/auth"; // 导入 PlanItem
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Cancel as CancelIcon,
  Close as CloseIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
} from "@mui/icons-material"; // 导入 CheckCircleOutlineIcon
import { alpha } from "@mui/material/styles"; // 导入 alpha
import { useImport } from "@/hooks/use-import";
import { getUserSubscribe } from "@/services/auth";
import { showNotice } from "@/services/noticeService";

interface PaymentViewProps {
  tradeNo: string;
  onBackToShop: () => void; // 返回商店的回调
  onOrderCancelled: () => void; // 取消订单后刷新 buy 页面的回调
  onPaymentCompleted: () => void; // 支付成功后返回商店列表的回调
}

const PaymentView = ({
  tradeNo,
  onBackToShop,
  onOrderCancelled,
  onPaymentCompleted,
}: PaymentViewProps) => {
  const { t } = useTranslation();
  const theme = useTheme(); // 获取主题

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[] | null>(
    null,
  );
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    number | null
  >(null);
  const [pollingIntervalId, setPollingIntervalId] = useState<number | null>(
    null,
  ); // 用于存储定时器ID，类型改为 number
  const [snackbarOpen, setSnackbarOpen] = useState(false); // 控制 Snackbar 显示
  const [snackbarMessage, setSnackbarMessage] = useState(""); // Snackbar 消息
  const [paymentSuccessDialogOpen, setPaymentSuccessDialogOpen] =
    useState(false); // 控制支付成功 Dialog 显示
  const { onImport } = useImport();

  const priceLabelMap: { [key in keyof PlanItem]?: string } = {
    month_price: t("月付"),
    quarter_price: t("季度"),
    half_year_price: t("半年"),
    year_price: t("一年"),
    two_year_price: t("两年"),
    three_year_price: t("三年"),
    onetime_price: t("一次性"),
  };

  const finshBuy = async () => {
    const data = await getUserSubscribe();
    onImport(data?.data?.subscribe_url, data?.data?.expired_at);
  };

  const loadPaymentData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [detailResult, paymentResult] = await Promise.all([
        fetchOrderDetail(tradeNo),
        fetchPaymentMethods(),
      ]);
      console.log(paymentResult, 123);
      if (!detailResult.success || !detailResult.data) {
        throw new Error(detailResult.error || "获取订单详情失败");
      }
      setOrderDetail(detailResult.data);

      if (!paymentResult.success || !paymentResult.data) {
        throw new Error(paymentResult.error || "获取支付方式失败");
      }
      setPaymentMethods(paymentResult.data);
      if (paymentResult.data.length > 0) {
        setSelectedPaymentMethod(paymentResult.data[0].id); // 默认选中第一个支付方式
      }
    } catch (e: any) {
      console.error("获取支付信息失败:", e);
      // setError(e.message || "操作失败");
      setSnackbarMessage(e.message || t("操作失败")); // 使用 Snackbar 提示
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentData();

    // 启动每10秒检查支付状态的定时器
    const intervalId = setInterval(async () => {
      try {
        const result = await checkOrderStatus(tradeNo);
        if (result.status === 3) {
          // 假设3表示已完成支付
          clearInterval(intervalId); // 支付完成，清除定时器
          setPollingIntervalId(null);
          // setSnackbarMessage(t("支付已完成！"));
          // setSnackbarOpen(true);
          finshBuy();
          setPaymentSuccessDialogOpen(true); // 打开支付成功 Dialog
          // onPaymentCompleted(); // 返回商店列表
        }
      } catch (e) {
        console.error("定时检查支付状态失败:", e);
      }
    }, 10000); // 每10秒检查一次

    setPollingIntervalId(intervalId);

    return () => {
      // 组件卸载时清除定时器
      if (intervalId) {
        // 使用局部变量 intervalId 清除
        clearInterval(intervalId);
      }
    };
  }, [tradeNo, onPaymentCompleted]); // 依赖项移除 pollingIntervalId

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000); // 假设 timestamp 是秒级
    return date.toLocaleString();
  };

  const handleCancelOrder = async () => {
    if (tradeNo) {
      setCancelConfirmOpen(false);
      setLoading(true); // 取消订单时显示加载状态
      setError(null);
      try {
        const result = await cancelOrder(tradeNo);
        if (result.success) {
          onOrderCancelled(); // 触发父组件刷新列表的回调
          onBackToShop(); // 返回商店列表
          if (pollingIntervalId) {
            // 取消订单后清除定时器
            clearInterval(pollingIntervalId);
            setPollingIntervalId(null);
          }
        } else {
          throw new Error(result.error || "取消订单失败");
        }
      } catch (e: any) {
        console.error("取消订单失败:", e);
        // setError(e.message || "操作失败");
        setSnackbarMessage(e.message || t("操作失败")); // 使用 Snackbar 提示
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCheckout = async () => {
    if (tradeNo && selectedPaymentMethod !== null) {
      const response = await checkOrder(tradeNo, selectedPaymentMethod);
      if (response.data) {
        //  const checkoutUrl =`/user/order/checkout?trade_no=${tradeNo}&method=${selectedPaymentMethod}`;
        window.open(response.data, "_blank"); // 在新页面打开支付链接
      }
    }
  };

  const handleCheckPaymentStatus = async () => {
    setLoading(true); // 检查状态时显示加载
    setError(null);
    try {
      const result = await checkOrderStatus(tradeNo);
      if (result.status === 3) {
        finshBuy();
        setPaymentSuccessDialogOpen(true);
      } else if (result.status === 0) {
        // alert(t("订单待支付"));
        setSnackbarMessage(t("订单待支付"));
        setSnackbarOpen(true);
      } else if (result.status === 2) {
        // alert(t("订单已取消"));
        setSnackbarMessage(t("订单已取消"));
        setSnackbarOpen(true);
      } else {
        throw new Error(result.error || "检查支付状态失败");
      }
    } catch (e: any) {
      console.error("检查支付状态失败:", e);
      // setError(e.message || "操作失败");
      setSnackbarMessage(e.message || t("操作失败")); // 使用 Snackbar 提示
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccessDialogClose = () => {
    setPaymentSuccessDialogOpen(false);
    onPaymentCompleted(); // 返回首页
  };

  return (
    <Box sx={{ p: 0 }}>
      <Box
        sx={{
          bgcolor: theme.palette.background.paper,
          p: 2,
          borderRadius: 2,
          mb: 2,
        }}
      >
        <Typography variant="h4" gutterBottom>
          {t("支付订单")}
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {t("请选择您的支付方式以完成订单")}
        </Typography>
      </Box>

      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {/* 移除 Alert，将在下面使用 Snackbar */}
      {/* {error && (
        <Alert severity="error" sx={{ my: 4 }}>{t("Error")}: {error}</Alert>
      )} */}

      {!loading && !error && orderDetail && (
        <Box sx={{ mt: 2 }}>
          {/* 产品信息 */}
          <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t("产品信息")}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography variant="body2">{t("套餐名称")}</Typography>
              <Typography variant="body2" fontWeight="bold">
                {orderDetail.plan.name}
              </Typography>
            </Box>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography variant="body2">{t("周期")}</Typography>
              <Typography variant="body2" fontWeight="bold">
                {priceLabelMap[orderDetail.period as keyof PlanItem] ||
                  orderDetail.period}
              </Typography>
            </Box>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography variant="body2">{t("流量")}</Typography>
              <Typography variant="body2" fontWeight="bold">
                {orderDetail.plan.transfer_enable} GB
              </Typography>
            </Box>
          </Paper>

          {/* 订单详情 */}
          <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t("订单详情")}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography variant="body2">{t("订单号")}</Typography>
              <Typography variant="body2" fontWeight="bold">
                {orderDetail.trade_no}
              </Typography>
            </Box>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography variant="body2">{t("创建时间")}</Typography>
              <Typography variant="body2" fontWeight="bold">
                {formatTimestamp(orderDetail.created_at)}
              </Typography>
            </Box>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography variant="body2">{t("套餐金额")}</Typography>
              <Typography variant="body2" fontWeight="bold">
                ¥ {(orderDetail.total_amount / 100).toFixed(2)}
              </Typography>
            </Box>
            <Box
              sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}
            >
              <Typography variant="body2">{t("含手续费总额")}</Typography>
              <Typography variant="body2" fontWeight="bold">
                ¥ {(orderDetail.total_amount / 100).toFixed(2)}
              </Typography>
            </Box>
          </Paper>

          {/* 支付方式 */}
          <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t("支付方式")}
            </Typography>
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {paymentMethods && paymentMethods.length > 0 ? (
                paymentMethods.map((method) => (
                  <Button
                    key={method.id}
                    variant={"outlined"}
                    // 选中时改为带有透明度的主色
                    sx={
                      selectedPaymentMethod === method.id
                        ? { borderLeftWidth: 8 }
                        : {}
                    } // 应用透明主色
                    fullWidth
                    startIcon={
                      method.icon ? (
                        <img
                          src={method.icon}
                          alt={method.name}
                          style={{ width: 24, height: 24 }}
                        />
                      ) : undefined
                    }
                    onClick={() => setSelectedPaymentMethod(method.id)}
                  >
                    {method.name}
                  </Button>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t("暂无可用支付方式")}
                </Typography>
              )}
            </Box>

            {/* 底部按钮 */}
            <Box
              sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2 }}
            >
              <Button
                variant="contained"
                fullWidth
                onClick={handleCheckout}
                disabled={!selectedPaymentMethod || loading}
              >
                {t("立即支付")}
              </Button>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setCancelConfirmOpen(true)}
                  disabled={loading}
                  fullWidth
                >
                  {t("取消订单")}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCheckPaymentStatus}
                  disabled={loading}
                  fullWidth
                >
                  {t("检查支付状态")}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
      )}

      <Dialog
        open={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        aria-labelledby="cancel-dialog-title"
        aria-describedby="cancel-dialog-description"
      >
        <DialogTitle id="cancel-dialog-title">
          {t("您确定要取消此订单吗？")}
        </DialogTitle>
        <DialogContent>
          <Typography id="cancel-dialog-description">
            {t("此操作无法撤销。")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelConfirmOpen(false)}>
            {t("取消")}
          </Button>
          <Button onClick={handleCancelOrder} autoFocus color="error">
            {t("确定")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        open={snackbarOpen}
        autoHideDuration={5000} // 6秒后自动关闭
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => setSnackbarOpen(false)}
          >
            <CloseIcon fontSize="small" />
          </Button>
        }
      />

      {/* 支付成功 Dialog */}
      <Dialog
        open={paymentSuccessDialogOpen}
        onClose={handlePaymentSuccessDialogClose} // 点击外部或 ESC 键关闭时也返回首页
        aria-labelledby="payment-success-dialog-title"
        maxWidth="xs"
        fullWidth
      >
        <DialogContent sx={{ textAlign: "center", py: 4 }}>
          <Box
            sx={{
              bgcolor: theme.palette.primary.main,
              borderRadius: "50%",
              width: 80,
              height: 80,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <CheckCircleOutlineIcon
              sx={{ fontSize: 48, color: theme.palette.primary.contrastText }}
            />
          </Box>
          <Typography variant="h5" gutterBottom>
            {t("支付成功")}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {t("您的订单支付成功，服务已开通")}
          </Typography>
          <Button
            variant="contained"
            onClick={handlePaymentSuccessDialogClose}
            fullWidth
          >
            {t("知道了")}
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PaymentView;
