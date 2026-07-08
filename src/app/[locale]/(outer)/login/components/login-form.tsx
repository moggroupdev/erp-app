"use client";

import { useState } from "react";
import { useI18n, useLocaleHref } from "@/lib/i18n/hooks";
import useDataHandler from "@/hooks/use-data-handler";
import useUser from "@/contexts/user/hook";
import { LOGGED_IN_FLAG } from "@/lib/constants/global";
import authApi from "@/lib/api/auth";
import handleRequest from "@/lib/helpers/handle-request";
import toUserState from "@/lib/helpers/to-user-state";
import Link from "next/link";
import AuthForm from "@/components/global/auth-form";
import { PasswordInput, TextInput } from "@mantine/core";

export default function LoginForm() {
  const { locale, translate } = useI18n();
  const getLocalizedHref = useLocaleHref();

  const { setUser } = useUser();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

  const { loading, setLoading, error, setError } = useDataHandler({ initialData: null });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRequest(locale, setLoading, setError, async () => {
      const response = await authApi.login({ dto: { email, phone: "", password } }); // @TODO: Handle phone login
      setUser(toUserState(response));
      localStorage.setItem(LOGGED_IN_FLAG, "true");
    });
  };

  return (
    <AuthForm
      requiredFields={{ email, password }}
      submitLabel={translate("Login", "تسجيل الدخول")}
      onSubmit={handleSubmit}
      loading={loading}
      error={error}
      leave={{
        to: getLocalizedHref("/register"),
        label: translate("Register", "انشاء حساب"),
        hint: translate("Don't have an account?", "ليس لديك حساب؟"),
      }}
    >
      <TextInput
        required
        type="email"
        placeholder={translate("Email", "البريد الإلكتروني")}
        value={email}
        onChange={(e) => setEmail(e.currentTarget.value)}
        autoFocus
        size="lg"
      />
      <PasswordInput
        required
        placeholder={translate("Password", "كلمة المرور")}
        value={password}
        onChange={(e) => setPassword(e.currentTarget.value)}
        size="lg"
      />
      <Link href={getLocalizedHref("/forgot-password")} className="text-blue-500 hover:text-blue-600">
        {translate("Forgot password?", "نسيت كلمة المرور؟")}
      </Link>
    </AuthForm>
  );
}
