"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { supabaseBrowser } from "@/shared/infrastructure/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      let mustChangePassword = false;

      // Autenticação com Supabase Auth
      if (
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
      ) {
        const { data, error } = await supabaseBrowser.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          throw error;
        }

        // Verifica se é primeiro acesso (senha não alterada pelo usuário)
        const hasChangedPassword = Boolean(data.user?.user_metadata?.password_changed);
        if (!hasChangedPassword) {
          mustChangePassword = true;
        }
      }

      sessionStorage.setItem("moven_admin_logged", "true");
      sessionStorage.setItem("moven_admin_email", email);
      sessionStorage.setItem("moven_password_changed", mustChangePassword ? "false" : "true");

      if (mustChangePassword) {
        router.push("/admin/change-password?first_access=true");
      } else {
        router.push("/admin");
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || "E-mail ou senha incorretos. Acesso restrito à liderança."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)] flex items-center justify-center py-12 px-5">
      <div className="max-w-md w-full bg-[var(--card)] p-8 sm:p-10 rounded-3xl border border-[var(--terra)]/20 shadow-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-[var(--terra)] font-semibold mb-6 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Início
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-2xl bg-[#8fa66a]/20 text-[#8fa66a]">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-heading">
              Painel Admin · MOVEN
            </h1>
            <p className="text-xs text-[var(--mut)]">
              Acesso restrito à liderança do núcleo
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              E-mail Autorizado
            </label>
            <input
              type="email"
              required
              placeholder="lideranca@moven.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8fa66a]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1">
              Senha
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/70 dark:bg-black/30 border border-black/15 dark:border-white/15 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8fa66a]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#072119] text-[#e9e1d0] font-heading font-semibold py-3 rounded-full hover:bg-[var(--terra)] transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 mt-2 shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Autenticando...
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-[#8fa66a]" />
                Entrar no Painel
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
