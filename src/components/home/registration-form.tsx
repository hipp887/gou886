import { useState } from "react";
import { TextField, Button, Checkbox, FormControlLabel, Link, Dialog, DialogTitle, DialogContent, DialogActions, alpha, Box, FormControl, FormLabel, useTheme, Typography, Select, MenuItem, InputAdornment } from "@mui/material";
import LogoImg from "@/assets/image/logo.png";
import { Controller, useForm } from "react-hook-form";
import { register, sendVerificationCode } from "@/services/auth";
import { useDispatch } from "react-redux";
import { authActions } from "@/utils/store";
import { useNavigate } from "react-router-dom";

interface RegistrationFormProps {
  onSwitchToLogin: () => void;
}

export const RegistrationForm = ({ onSwitchToLogin }: RegistrationFormProps) => {
  const theme = useTheme();

  const { control, handleSubmit, formState: { errors }, watch } = useForm<RegistrationFormData>();
  const agreeToTerms = watch("agreeToTerms");

  const [openTermsDialog, setOpenTermsDialog] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const handleRegister = async (data: RegistrationFormData) => {
    const { emailPrefix, emailSuffix, ...rest } = data;
    const fullEmail = `${emailPrefix}@${emailSuffix}`;
    const dataToSend = { ...rest, email: fullEmail };

    const res = await register(dataToSend);
    if (res?.success) {
      dispatch(authActions.login(res));
      navigate("/home")
    } else {
      throw new Error(res?.error || "The given data was invalid.");
    }
  };

  const handleSendCode = async () => {
    const emailPrefix = watch("emailPrefix");
    const emailSuffix = watch("emailSuffix");

    setIsSendingCode(true);
    const fullEmail = `${emailPrefix}@${emailSuffix}`;
    const res = await sendVerificationCode(fullEmail);
    if (res?.success) {
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsSendingCode(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setIsSendingCode(false);
      throw new Error(res?.error || "发送验证码失败");
    }
  };

  const handleOpenTerms = () => {
    setOpenTermsDialog(true);
  };

  const handleCloseTerms = () => {
    setOpenTermsDialog(false);
  };

  interface RegistrationFormData {
    emailPrefix: string;
    emailSuffix: string;
    password: string;
    confirmPassword: string;
    invite_code?: string;
    agreeToTerms: boolean;
  }
  return (
    <>
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          width: "100%",
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            flexDirection: "column",
            overflowY: "auto", // 超出高度时启用垂直滚动
            maxHeight: 'calc(100vh - 150px)', // 设置最大高度

            borderRadius: 2,
            px: 4,
            py: 6,
            width: "50%",
            bgcolor: alpha(theme.palette.primary.contrastText, 1),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          }}
        >
          <img
            style={{
              width: 100,
              height: 100,
              marginBottom: 20,
            }}
            srcSet={`${LogoImg}?w=164&h=164&fit=crop&auto=format&dpr=2 2x`}
            src={`${LogoImg}?w=164&h=164&fit=crop&auto=format`}
            alt="logo"
            loading="lazy"
          />
          <div style={{ fontSize: 20, fontWeight: "bold", marginBottom: 20 }}>
            创建账号
          </div>

          <form onSubmit={handleSubmit(handleRegister)} style={{ width: "100%" }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <FormLabel htmlFor="emailPrefix">邮箱</FormLabel>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                // border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`, // 移除外层边框
                // borderRadius: 1,
                // p: 0.5
              }}>
                <Controller
                  name="emailPrefix"
                  control={control}
                  rules={{ required: "邮箱前缀是必填项" }}
                  render={({ field: { onChange, value } }) => (
                    <TextField
                      onChange={onChange}
                      value={value || ""}
                      placeholder="您的邮箱前缀"
                      fullWidth
                      variant="outlined"
                      error={!!errors.emailPrefix}
                      helperText={errors.emailPrefix?.message}
                      sx={{ flexGrow: 1, '& .MuiOutlinedInput-root': { borderRadius: '4px 0 0 4px' } }}
                    />
                  )}
                />

                <Controller
                  name="emailSuffix"
                  control={control}
                  rules={{ required: "邮箱后缀是必填项" }}
                  defaultValue="gmail.com" // 可以设置一个默认值
                  render={({ field: { onChange, value } }) => (
                    <Select
                      onChange={onChange}
                      value={value || "gmail.com"}
                      fullWidth
                      variant="outlined"
                      error={!!errors.emailSuffix}
                      sx={{ width: '30%' }}
                      style={{ borderRadius: '0 4px 4px 0', borderLeft: 'none' }}
                    >
                      <MenuItem value="gmail.com">@gmail.com</MenuItem>
                      <MenuItem value="qq.com">@qq.com</MenuItem>
                      <MenuItem value="163.com">@163.com</MenuItem>
                      <MenuItem value="yahoo.com">@yahoo.com</MenuItem>
                      <MenuItem value="sina.com">@sina.com</MenuItem>
                      <MenuItem value="126.com">@126.com</MenuItem>
                    </Select>
                  )}
                />
              </Box>
              {errors.emailSuffix && <Typography color="error" variant="caption">{errors.emailSuffix?.message}</Typography>}
            </FormControl>

           

            <FormControl fullWidth sx={{ mb: 3 }}>
              <Controller
                name="password"
                control={control}
                rules={{ required: "密码是必填项", minLength: { value: 8, message: "密码至少8位" } }}
                render={({ field: { onChange, value } }) => (
                  <div>
                    <FormLabel htmlFor="password">密码</FormLabel>
                    <TextField
                      type="password"
                      onChange={onChange}
                      value={value || ""}
                      placeholder="••••••"
                      fullWidth
                      variant="outlined"
                      error={!!errors.password}
                      helperText={errors.password?.message}
                    />
                  </div>
                )}
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <Controller
                name="confirmPassword"
                control={control}
                rules={{ required: "确认密码是必填项", validate: (value) => value === watch("password") || "两次密码不一致" }}
                render={({ field: { onChange, value } }) => (
                  <div>
                    <FormLabel htmlFor="confirmPassword">确认密码</FormLabel>
                    <TextField
                      type="password"
                      onChange={onChange}
                      value={value || ""}
                      placeholder="••••••"
                      fullWidth
                      variant="outlined"
                      error={!!errors.confirmPassword}
                      helperText={errors.confirmPassword?.message}
                    />
                  </div>
                )}
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <Controller
                name="invite_code"
                control={control}
                render={({ field: { onChange, value } }) => (
                  <div>
                    <FormLabel htmlFor="invite_code">邀请码 (可选)</FormLabel>
                    <TextField
                      onChange={onChange}
                      value={value || ""}
                      placeholder="输入邀请码"
                      fullWidth
                      variant="outlined"
                      error={!!errors.invite_code}
                      helperText={errors.invite_code?.message}
                    />
                  </div>
                )}
              />
            </FormControl>

            <FormControlLabel
              control={
                <Controller
                  name="agreeToTerms"
                  control={control}
                  rules={{ required: "请同意服务条款" }}
                  render={({ field: { onChange, value } }) => (
                    <Checkbox
                      checked={!!value}
                      onChange={(e) => onChange(e.target.checked)}
                    />
                  )}
                />
              }
              label={
                <span>
                  我已阅读并同意
                  <Link component="button" onClick={handleOpenTerms}>
                    服务条款
                  </Link>
                </span>
              }
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              type="submit"
              disabled={!agreeToTerms}
              sx={{ mt: 3, mb: 2 }}
            >
              创建账号
            </Button>
          </form>
          <Box sx={{ display: 'flex', alignItems: 'center', my: 3, width: '100%' }}>
            <Box sx={{ flexGrow: 1, borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }} />
            <Typography variant="body2" sx={{ mx: 2, color: 'text.secondary' }}>
              已有账号？
            </Typography>
            <Box sx={{ flexGrow: 1, borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }} />
          </Box>
          <Button onClick={onSwitchToLogin} variant="outlined"
            fullWidth>
            登录
          </Button>
        </Box>
      </Box>

      <Dialog open={openTermsDialog} onClose={handleCloseTerms}>
        <DialogTitle>服务条款</DialogTitle>
        <DialogContent>
          <p>这是服务条款的占位符。</p>
          <p>请仔细阅读。</p>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTerms} color="primary">
            关闭
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
