import { useEffect, useState } from 'react';
import { Box, Typography, Grid, useTheme, Button, ToggleButtonGroup, ToggleButton, CircularProgress, Alert } from '@mui/material';
import { useTranslation } from "react-i18next";
import { fetchPlan, PlanItem } from "@/services/auth";
import { BasePage } from "@/components/base"; // 导入 BasePage
import OrderDetailView from "@/components/buy/order-detail-view"; // 导入 OrderDetailView
import PaymentView from "@/components/buy/payment-view"; // 导入 PaymentView
import OrderListView from "@/components/buy/order-list-view"; // 导入 OrderListView
import IconButton from '@mui/material/IconButton'; // 导入 IconButton
import ListAltIcon from '@mui/icons-material/ListAlt'; // 导入 ListAltIcon
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Tooltip from '@mui/material/Tooltip'; // 导入 Tooltip

// interface CardItem {
//     title: string;
//     description: string;
//     price: string;
//     // 可以根据实际采集到的数据结构添加更多字段
// }

// 新增 PlanCard 组件
interface PlanCardProps {
    card: PlanItem;
    loading: boolean;
    onSelectPlan: (plan: PlanItem, period: keyof PlanItem) => void; // 添加 onSelectPlan 回调
}

const PlanCard = ({ card, loading, onSelectPlan }: PlanCardProps) => {
    const { t } = useTranslation();
    const theme = useTheme();

    // 根据第一个有值的价格字段设置默认 selectedPeriod
    const initialSelectedPeriod = (['month_price', 'quarter_price', 'half_year_price', 'year_price', 'two_year_price', 'three_year_price', 'onetime_price'] as (keyof PlanItem)[])
        .find(key => (card as any)[key] !== null) || 'year_price';
    const [selectedPeriod, setSelectedPeriod] = useState<keyof PlanItem>(initialSelectedPeriod);

    const currentPrice = (card as any)[selectedPeriod];
    const currentPeriodLabel = [{ key: 'month_price', label: t("月付") },
    { key: 'quarter_price', label: t("季度") },
    { key: 'half_year_price', label: t("半年") },
    { key: 'year_price', label: t("一年") },
    { key: 'two_year_price', label: t("两年") },
    { key: 'three_year_price', label: t("三年") },
    { key: 'onetime_price', label: t("一次性") }
    ].find(item => item.key === selectedPeriod)?.label || '';

    const availablePeriods = [{ key: 'month_price', label: t("月付") },
    { key: 'quarter_price', label: t("季度") },
    { key: 'half_year_price', label: t("半年") },
    { key: 'year_price', label: t("一年") },
    { key: 'two_year_price', label: t("两年") },
    { key: 'three_year_price', label: t("三年") },
    { key: 'onetime_price', label: t("一次性") }
    ].filter(periodOption => (card as any)[periodOption.key] !== null);

    return (
        <Grid size={6}> {/* 每个卡片占据 50% 宽度 */}
            <Box
                sx={{
                    borderRadius: 2,
                    // p: 2,
                    boxShadow: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    bgcolor: theme.palette.background.paper,
                    height: '100%'
                }}
            >
                <Box sx={{ m: 2, mb: 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" gutterBottom component="h2" sx={{ mb: 0 }}>{card.name}</Typography>
                        <Box
                            sx={{
                                bgcolor: 'success.main',
                                color: 'success.contrastText',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                fontSize: '0.75rem',
                                fontWeight: 'bold',
                            }}
                        >
                            {t("库存充足")}
                        </Box>
                    </Box>
                    {availablePeriods.length > 1 && (
                        <ToggleButtonGroup
                            value={selectedPeriod}
                            exclusive
                            onChange={(_, newPeriod) => {
                                if (newPeriod !== null) {
                                    setSelectedPeriod(newPeriod as keyof PlanItem);
                                }
                            }}
                            aria-label="price period"
                            sx={{ mb: 3 }}
                        >
                            {availablePeriods.map((periodOption) => (
                                <ToggleButton key={periodOption.key} value={periodOption.key} disabled={loading}>
                                    {periodOption.label}
                                </ToggleButton>
                            ))}
                        </ToggleButtonGroup>
                    )}

                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            <span dangerouslySetInnerHTML={{ __html: card.content }}></span>
                        </Typography>
                    </Box>
                </Box>
                <Box sx={{ m: 2, mt: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 2, flexWrap: 'wrap' }}>
                        {currentPrice !== null && currentPrice !== undefined ? (
                            <Box sx={{ display: 'flex', alignItems: 'baseline', mr: 1, mb: 0.5 }}>
                                <Typography variant="h5" color="primary.main" sx={{ mr: 0.5 }}>¥</Typography>
                                <Typography variant="h4" color="primary.main" fontWeight="bold">{(currentPrice / 100).toFixed(2)}</Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}> / {currentPeriodLabel}</Typography>
                            </Box>
                        ) : (
                            <Typography variant="body2" color="text.secondary">{t("暂无此周期价格")}</Typography>
                        )}
                    </Box>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={() => onSelectPlan(card, selectedPeriod)}
                    >
                        {t("购买")}
                    </Button>
                </Box>
            </Box>
        </Grid>
    );
};

const Buy = () => {
    const { t } = useTranslation();
    const theme = useTheme();
    const [cards, setCards] = useState<PlanItem[] | undefined>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<'list' | 'detail' | 'payment'>('list'); // 管理视图状态，添加 'payment'
    const [selectedPlan, setSelectedPlan] = useState<PlanItem | null>(null); // 存储选中的套餐
    const [selectedOrderPeriod, setSelectedOrderPeriod] = useState<keyof PlanItem | null>(null); // 存储选中的周期
    const [tradeNo, setTradeNo] = useState<string | null>(null); // 存储订单号
    const [isOrderListOpen, setIsOrderListOpen] = useState(false); // 控制订单列表弹窗的显示与隐藏

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await fetchPlan();
                if (result.success) {
                    if (Array.isArray(result.data)) {
                        setCards(result.data);
                    } else {
                        console.warn("fetchNotice returned non-array data:", result.data);
                        setCards([]);
                    }
                } else {
                    throw new Error(result.error || "Failed to fetch notice data");
                }

            } catch (e: any) {
                console.error('Error fetching data:', e);
                setError(e.message || 'Failed to fetch card data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleSelectPlan = (plan: PlanItem, period: keyof PlanItem) => {
        setSelectedPlan(plan);
        setSelectedOrderPeriod(period);
        setCurrentView('detail');
    };

    const handleBackToShop = () => {
        setCurrentView('list');
        setSelectedPlan(null);
        setSelectedOrderPeriod(null);
        setTradeNo(null); // 返回商店时清空 tradeNo
    };

    const handleOrderSubmitted = (submittedTradeNo: string) => {
        setTradeNo(submittedTradeNo);
        setCurrentView('payment');
        // 提交订单后，如果订单列表开着，可能需要刷新或者关闭
        // setIsOrderListOpen(false); // 可以选择关闭订单列表
    };

    const handleViewOrderDetailFromList = (tradeNoFromList: string) => {
        setTradeNo(tradeNoFromList);
        setCurrentView('payment'); // 跳转到支付详情页
        setIsOrderListOpen(false); // 关闭订单列表弹窗
    };

    const handleOrderListRefresh = () => {
        // 刷新订单列表的逻辑，例如重新调用 fetchOrders
        // 或者在 OrderListView 内部自己管理刷新
        console.log("订单列表需要刷新");
    };

    const handlePaymentCompleted = () => {
        setCurrentView('list'); // 支付完成，返回商店列表
        setSelectedPlan(null);
        setSelectedOrderPeriod(null);
        setTradeNo(null);
        // 可以选择刷新订单列表
        handleOrderListRefresh();
    };

    return (
        <BasePage title={t("Label-Buy")} contentStyle={{ padding: 2 }} header={
            <Box sx={{ display: "flex", alignItems: "center" }}>
                <Tooltip title={t("订单列表")}>
                    <IconButton color="inherit" onClick={() => setIsOrderListOpen(true)}>
                        <ListAltIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        }>
            {currentView === 'list' && !loading && !error && (
                <Grid container spacing={1.5} columns={{ xs: 6, sm: 6, md: 12 }} >
                    {cards?.map((card, index) => (
                        <PlanCard
                            key={card.id}
                            card={card}
                            loading={loading}
                            onSelectPlan={handleSelectPlan}
                        />
                    ))}
                </Grid>
            )}

            {currentView === 'detail' && selectedPlan && selectedOrderPeriod && (
                <OrderDetailView
                    selectedPlan={selectedPlan}
                    selectedOrderPeriod={selectedOrderPeriod}
                    onBackToShop={handleBackToShop}
                    onOrderSubmitted={handleOrderSubmitted}
                />
            )}

            {currentView === 'payment' && tradeNo && (
                <PaymentView 
                    tradeNo={tradeNo} 
                    onBackToShop={handleBackToShop} 
                    onOrderCancelled={handleOrderListRefresh} // 传递取消订单回调
                    onPaymentCompleted={handlePaymentCompleted} // 传递支付完成回调
                />
            )}

            <Dialog open={isOrderListOpen} onClose={() => setIsOrderListOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>{t("我的订单")}</DialogTitle>
                <DialogContent>
                    <OrderListView
                        onViewOrderDetail={handleViewOrderDetailFromList}
                        onOrderCancelled={handleOrderListRefresh}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setIsOrderListOpen(false)}>{t("关闭")}</Button>
                </DialogActions>
            </Dialog>
        </BasePage>
    );
};

export default Buy;
