import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { useTranslation } from "react-i18next";
import { fetchOrders, cancelOrder, OrderItem, PlanItem } from "@/services/auth";
import { Visibility as VisibilityIcon, Cancel as CancelIcon } from '@mui/icons-material';

interface OrderListViewProps {
  onViewOrderDetail: (tradeNo: string) => void;
  onOrderCancelled: () => void; // 用于取消订单后刷新列表的回调
}

const OrderListView = ({ onViewOrderDetail, onOrderCancelled }: OrderListViewProps) => {
  const { t } = useTranslation();

  const [orders, setOrders] = useState<OrderItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [selectedOrderToCancel, setSelectedOrderToCancel] = useState<string | null>(null);

  const priceLabelMap: { [key in keyof PlanItem]?: string } = {
    month_price: t("月付"),
    quarter_price: t("季度"),
    half_year_price: t("半年"),
    year_price: t("一年"),
    two_year_price: t("两年"),
    three_year_price: t("三年"),
    onetime_price: t("一次性"),
  };

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchOrders();
      if (result.success && result.data) {
        setOrders(result.data);
      } else {
        throw new Error(result.error || "获取订单列表失败");
      }
    } catch (e: any) {
      console.error("获取订单列表失败:", e);
      setError(e.message || "操作失败");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCancelOrder = async () => {
    if (selectedOrderToCancel) {
      setCancelConfirmOpen(false);
      setLoading(true); // 取消订单时显示加载状态
      setError(null);
      try {
        const result = await cancelOrder(selectedOrderToCancel);
        if (result.success) {
          onOrderCancelled(); // 触发父组件刷新列表的回调
          loadOrders(); // 重新加载订单列表
        } else {
          throw new Error(result.error || "取消订单失败");
        }
      } catch (e: any) {
        console.error("取消订单失败:", e);
        setError(e.message || "操作失败");
      } finally {
        setLoading(false);
        setSelectedOrderToCancel(null);
      }
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000); // 假设 timestamp 是秒级
    return date.toLocaleString();
  };

  const getStatusLabel = (status: 0 | 2 | 3) => {
    switch (status) {
      case 0: return t("待支付");
      case 2: return t("已取消");
      case 3: return t("已完成");
      default: return t("未知状态");
    }
  };

  return (
    <Box>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ my: 4 }}>{t("Error")}: {error}</Alert>
      )}

      {!loading && !error && orders && orders.length > 0 ? (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="order list table">
            <TableHead>
              <TableRow>
                <TableCell>{t("订单号")}</TableCell>
                <TableCell>{t("创建时间")}</TableCell>
                <TableCell>{t("周期")}</TableCell>
                <TableCell align="right">{t("金额")}</TableCell>
                <TableCell>{t("状态")}</TableCell>
                <TableCell align="center">{t("操作")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.map((order, i) => (
                <TableRow key={`${order.id}${i}`}>
                  <TableCell component="th" scope="row">{order.trade_no}</TableCell>
                  <TableCell>{formatTimestamp(order.created_at)}</TableCell>
                  <TableCell>{priceLabelMap[order.period as keyof PlanItem]}</TableCell>
                  <TableCell align="right">¥ {(order.total_amount / 100).toFixed(2)}</TableCell>
                  <TableCell>{getStatusLabel(order.status)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title={t("查看详情")}>
                      <span>
                        <IconButton onClick={() => onViewOrderDetail(order.trade_no)} disabled={order.status !== 0}>
                          <VisibilityIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={t("取消订单")}>
                      <span>
                        <IconButton onClick={() => {
                          setSelectedOrderToCancel(order.trade_no);
                          setCancelConfirmOpen(true);
                        }} disabled={order.status !== 0}>
                          <CancelIcon />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      ) : (
        !loading && !error && <Typography variant="body1" color="text.secondary" sx={{ my: 4 }}>{t("没有订单记录")}</Typography>
      )}

      <Dialog
        open={cancelConfirmOpen}
        onClose={() => setCancelConfirmOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">{t("您确定要取消此订单吗？")}</DialogTitle>
        <DialogContent>
          <Typography id="alert-dialog-description">
            {t("此操作无法撤销。")}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelConfirmOpen(false)}>{t("取消")}</Button>
          <Button onClick={handleCancelOrder} autoFocus color="error">
            {t("确定")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderListView;
