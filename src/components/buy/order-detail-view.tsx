import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Divider, Paper, CircularProgress, Alert, Grid, ToggleButtonGroup, ToggleButton, useTheme } from '@mui/material';
import { ArrowBack as ArrowBackIcon, ShoppingCart as ShoppingCartIcon } from '@mui/icons-material';
import { useTranslation } from "react-i18next";
import { PlanItem, saveOrder, fetchOrderDetail, OrderDetail } from "@/services/auth"; // 移除 fetchPaymentMethods, PaymentMethod

interface OrderDetailViewProps {
    selectedPlan: PlanItem;
    selectedOrderPeriod: keyof PlanItem;
    onBackToShop: () => void;
    onOrderSubmitted: (tradeNo: string) => void; // 添加新的回调函数
}

const OrderDetailView = ({ selectedPlan, selectedOrderPeriod, onBackToShop, onOrderSubmitted }: OrderDetailViewProps) => {
    const { t } = useTranslation();

    const priceLabelMap: { [key in keyof PlanItem]?: string } = {
        month_price: t("月付"),
        quarter_price: t("季度"),
        half_year_price: t("半年"),
        year_price: t("一年"),
        two_year_price: t("两年"),
        three_year_price: t("三年"),
        onetime_price: t("一次性"),
    };

    const [orderLoading, setOrderLoading] = useState(false);
    const [orderError, setOrderError] = useState<string | null>(null);
    const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
    const [selectedPeriodForDetail, setSelectedPeriodForDetail] = useState<keyof PlanItem>(selectedOrderPeriod); // 用于订单详情页的价格选择

    const availablePeriods = (['month_price', 'quarter_price', 'half_year_price', 'year_price', 'two_year_price', 'three_year_price', 'onetime_price'] as (keyof PlanItem)[])
        .filter(key => (selectedPlan as any)[key] !== null)
        .map(key => ({ key, label: priceLabelMap[key] }));

    // 提交订单逻辑
    const handleSubmitOrder = async () => {
        setOrderLoading(true);
        setOrderError(null);
        try {
            const saveResult = await saveOrder(selectedPlan.id, selectedPeriodForDetail); // 使用 selectedPeriodForDetail
            if (!saveResult.success || !saveResult.data) {
                throw new Error(saveResult.error || "提交订单失败");
            }
            const trade_no = saveResult.data;

            const detailResult = await fetchOrderDetail(trade_no); // 不再调用 fetchPaymentMethods

            if (!detailResult.success || !detailResult.data) {
                throw new Error(detailResult.error || "获取订单详情失败");
            }
            setOrderDetail(detailResult.data);

            onOrderSubmitted(trade_no); // 触发回调，传递 trade_no

        } catch (e: any) {
            console.error("订单提交或获取详情失败:", e);
            setOrderError(e.message || "操作失败");
        } finally {
            setOrderLoading(false);
        }
    };

    const theme = useTheme(); // 获取主题

    return (
        <Box sx={{ p: 0 }}>
            <Box sx={{ bgcolor: theme.palette.background.paper, p: 2, borderRadius: 2, mb: 2 }}>
                <Typography variant="h4" gutterBottom>{t("确认订单")}</Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    {t("请确认您的订单信息并完成支付")}
                </Typography>
            </Box>

            {orderLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
                    <CircularProgress />
                </Box>
            )}

            {orderError && (
                <Alert severity="error" sx={{ my: 4 }}>{t("Error")}: {orderError}</Alert>
            )}

            {!orderLoading && !orderError && ( // 只有在没有加载和错误时才显示内容
                <Grid container spacing={2}>
                    <Grid size={6}>
                        <Paper elevation={3} sx={{ p: 2, py: 1 }}>
                            <Typography variant="h6" sx={{ mt: 2 }}>{orderDetail?.plan_name || selectedPlan.name}</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                <span dangerouslySetInnerHTML={{ __html: orderDetail?.content || selectedPlan.content }}></span>
                            </Typography>

                            {availablePeriods.length > 1 && (
                                <ToggleButtonGroup
                                    value={selectedPeriodForDetail}
                                    exclusive
                                    onChange={(_, newPeriod) => {
                                        if (newPeriod !== null) {
                                            setSelectedPeriodForDetail(newPeriod as keyof PlanItem);
                                        }
                                    }}
                                    aria-label="price period"
                                    sx={{ mb: 3 }}
                                >
                                    {availablePeriods.map((periodOption) => (
                                        <ToggleButton key={periodOption.key} value={periodOption.key}>
                                            {periodOption.label}
                                        </ToggleButton>
                                    ))}
                                </ToggleButtonGroup>
                            )}

                        </Paper>
                    </Grid>

                    <Grid size={6}>
                        <Paper elevation={3} sx={{ p: 2 }}>
                            <Typography variant="h5" gutterBottom>{t("订单摘要")}</Typography>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body1">{t("套餐名称")}</Typography>
                                <Typography variant="body1" fontWeight="bold">{orderDetail?.plan_name || selectedPlan.name}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body1">{t("周期")}</Typography>
                                <Typography variant="body1" fontWeight="bold">{priceLabelMap[selectedPeriodForDetail]}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="body1">{t("价格")}</Typography>
                                <Typography variant="body1" fontWeight="bold">¥ {orderDetail?.total_amount ? (orderDetail.total_amount / 100).toFixed(2) : ((selectedPlan as any)[selectedPeriodForDetail] / 100).toFixed(2)}</Typography>
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                <Typography variant="h6">{t("总计")}</Typography>
                                <Typography variant="h6" color="primary.main">¥ {orderDetail?.total_amount ? (orderDetail.total_amount / 100).toFixed(2) : ((selectedPlan as any)[selectedPeriodForDetail] / 100).toFixed(2)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                                <Button variant="outlined" startIcon={<ArrowBackIcon />} onClick={onBackToShop} disabled={orderLoading}>
                                    {t("返回商店")}
                                </Button>
                                <Button variant="contained" endIcon={<ShoppingCartIcon />} onClick={handleSubmitOrder} disabled={orderLoading}>
                                    {t("提交订单")}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
};

export default OrderDetailView;
