import { login } from "@/services/auth";
import {
  alpha,
  Box,
  Button,
  FormControl,
  FormLabel,
  TextField,
  useTheme,
  Typography,
} from "@mui/material";
import LogoImg from "@/assets/image/logo.png";
import { Controller, useForm } from "react-hook-form";
import { showNotice } from "@/services/noticeService";
import { useDispatch } from "react-redux";
import { authActions } from "@/utils/store";
import { useNavigate } from "react-router-dom";
export const LoginForm = ({ onSwitchToRegister }: { onSwitchToRegister: () => void }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { control, watch, register, ...formIns } = useForm<{
    email: string;
    password: string;
  }>();

  function isValidEmail(email: string) {
    if (!email) return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return emailRegex.test(email);
  }
  const validateGroup = () => {
    let group = formIns.getValues();
    console.log(group);
    if (!isValidEmail(group.email)) {
      throw new Error("The given data was invalid.");
    }
    if (group.password === "") {
      throw new Error("The given data was invalid.");
    }
  };
  return (
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
          登录账号
        </div>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <Controller
            name="email"
            control={control}
            render={({ field: { onChange, value } }) => (
              <div>
                <FormLabel htmlFor="email">Email</FormLabel>
                <TextField
                  type="email"
                  onChange={onChange}
                  placeholder="your@email.com"
                  fullWidth
                  variant="outlined"
                />
              </div>
            )}
          />
        </FormControl>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <Controller
            name="password"
            control={control}
            render={({ field: { onChange, value } }) => (
              <div>
                <FormLabel htmlFor="email">Password</FormLabel>
                <TextField
                  onChange={onChange}
                  placeholder="••••••"
                  type="password"
                  fullWidth
                  variant="outlined"
                />
              </div>
            )}
          />
        </FormControl>

        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={async (event) => {
            try {
              validateGroup();
              event.preventDefault();
              const d = formIns.getValues();
              const res = await login(d);
              if (res?.success) {
                dispatch(authActions.login(res));
                navigate("/home")
              } else {
                throw new Error("The given data was invalid.");
              }
            } catch (err: any) {
              showNotice("error", err.message || err.toString());
            }
          }}
        >
          登录
        </Button>
        <Box sx={{ display: 'flex', alignItems: 'center', my: 3, width: '100%' }}>
          <Box sx={{ flexGrow: 1, borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }} />
          <Typography variant="body2" sx={{ mx: 2, color: 'text.secondary' }}>
            还没有账号？
          </Typography>
          <Box sx={{ flexGrow: 1, borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }} />
        </Box>
        <Button onClick={onSwitchToRegister} variant="outlined"
          fullWidth>
          创建账号
        </Button>
      </Box>
    </Box>
  );
};
