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
import { Button, PasswordInput, TextInput } from "@mantine/core";
import { Loader2 } from "lucide-react";
import ErrorAlert from "@/components/ui/error-alert";

type LoginMethod = "email" | "phone";

export default function LoginForm() {
  const { locale, translate } = useI18n();
  const getLocalizedHref = useLocaleHref();

  const { setUser } = useUser();

  const [method, setMethod] = useState<LoginMethod>("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const { loading, setLoading, error, setError } = useDataHandler({ initialData: null });

  const identifier = method === "email" ? email : phone;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleRequest(locale, setLoading, setError, async () => {
      const response = await authApi.login({
        dto: {
          email: method === "email" ? email : null,
          phone: method === "phone" ? phone : null,
          password,
        },
      });
      setUser(toUserState(response));
      localStorage.setItem(LOGGED_IN_FLAG, "true");
    });
  };

  return (
    <form onSubmit={handleSubmit} className="animate-fade-in mx-auto flex w-[450px] max-w-full flex-col gap-4">
      {method === "email" ? (
        <TextInput
          key="email"
          required
          type="email"
          placeholder={translate("Email", "البريد الإلكتروني")}
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
          autoFocus
          radius="md"
          size="lg"
        />
      ) : (
        <TextInput
          key="phone"
          required
          type="tel"
          placeholder={translate("Phone", "رقم الهاتف")}
          value={phone}
          onChange={(e) => setPhone(e.currentTarget.value)}
          autoFocus
          radius="md"
          size="lg"
        />
      )}

      <PasswordInput
        required
        placeholder={translate("Password", "كلمة المرور")}
        value={password}
        onChange={(e) => setPassword(e.currentTarget.value)}
        radius="md"
        size="lg"
      />

      <Link href={getLocalizedHref("/forgot-password")} className="text-blue-500 hover:text-blue-600">
        {translate("Forgot password?", "نسيت كلمة المرور؟")}
      </Link>

      <Button size="md" radius="md" type="submit" disabled={!identifier || !password || loading}>
        {loading ? <Loader2 className="animate-spin" /> : translate("Login", "تسجيل الدخول")}
      </Button>

      {error && <ErrorAlert error={error} fade />}

      <p className="flex items-center justify-center gap-1">
        <span>
          {method === "email"
            ? translate("Prefer phone?", "تفضّل الهاتف؟")
            : translate("Prefer email?", "تفضّل البريد الإلكتروني؟")}
        </span>
        <button
          type="button"
          style={{ fontWeight: 500 }}
          className="text-blue-500 hover:text-blue-600"
          onClick={() => setMethod(method === "email" ? "phone" : "email")}
        >
          {method === "email"
            ? translate("Sign in with phone", "تسجيل الدخول بالهاتف")
            : translate("Sign in with email", "تسجيل الدخول بالبريد")}
        </button>
      </p>
    </form>
  );
}
