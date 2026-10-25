"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { card } from "@/lib/ui";

const field =
  "w-full rounded-2xl bg-zinc-100 px-4 py-3 text-base outline-none placeholder:text-zinc-400 focus:ring-2 focus:ring-indigo-400 dark:bg-zinc-800";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const isRegister = mode === "register";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Already logged in (valid session cookie) → skip the form.
  useEffect(() => {
    fetch("/api/auth/me").then((res) => {
      if (res.ok) window.location.replace("/");
    });
  }, []);

  async function submit(e: React.SyntheticEvent<HTMLFormElement, SubmitEvent>) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isRegister ? { email, password, name, code } : { email, password },
        ),
      });
      if (res.ok) {
        window.location.assign("/");
        return;
      }
      setError((await res.json().catch(() => null))?.error ?? "發生錯誤，請再試一次");
    } catch {
      setError("網路錯誤，請再試一次");
    }
    setSubmitting(false);
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-5">
      <div className="mb-6 text-center">
        <p className="text-4xl">📒</p>
        <h1 className="mt-2 text-xl font-bold">AI記帳本</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {isRegister ? "建立帳號開始記帳" : "登入你的帳號"}
        </p>
      </div>

      <form onSubmit={submit} className={`${card} flex flex-col gap-3 p-5`}>
        {isRegister && (
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={50}
            autoComplete="name"
            placeholder="姓名"
            className={field}
          />
        )}
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="Email"
          className={field}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={isRegister ? 8 : undefined}
          maxLength={128}
          autoComplete={isRegister ? "new-password" : "current-password"}
          placeholder={isRegister ? "密碼（至少 8 碼）" : "密碼"}
          className={field}
        />
        {isRegister && (
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            autoComplete="off"
            placeholder="驗證碼"
            className={field}
          />
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 py-3 text-sm font-semibold text-white shadow-md transition active:scale-95 disabled:opacity-40"
        >
          {submitting ? "處理中…" : isRegister ? "註冊" : "登入"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
        {isRegister ? "已經有帳號？" : "還沒有帳號？"}
        <Link
          href={isRegister ? "/login" : "/register"}
          className="ml-1 font-medium text-indigo-500"
        >
          {isRegister ? "登入" : "註冊"}
        </Link>
      </p>
    </div>
  );
}
