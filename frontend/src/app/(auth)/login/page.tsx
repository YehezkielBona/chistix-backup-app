"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const { data, error } = await authClient.signIn.email({
        email,
        password,
      });
      if (error) {
        if (error.status === 403 && error.code === "EMAIL_NOT_VERIFIED") {
          setErrorMsg(
            "Email belum diverifikasi. Silakan cek kotak masuk Anda.",
          );
        } else {
          setErrorMsg(error.message || "Email atau password salah.");
        }
        setIsLoading(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setErrorMsg("Error in the server");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Welcome</h2>
        <p className="text-sm text-gray-500">
          Please login to find events & manage your tickets
        </p>
      </div>
      {errorMsg && (
        <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-gray-700">Email</label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="yourname@mail.com"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>
          </div>
          <div className="relative flex items-center">
            <Lock className="absolute left-3 w-5 h-5 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••••"
              className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          </div>
          <div className="text-right w-full">
            <Link
              href="/forgot-password"
              className="text-xs text-neutral-700 hover:text-amber-800 hover:underline font-medium"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        <button
        type="submit"
        disabled={isLoading}

        className="w-full bg-[#f58200] hover:bg-[#e67300] text-white font-bold py-2.5 rounded-full transition-colors mt-2">
          {isLoading ? "Loading..." : "Login"}
        </button>
      </form>

      <p className="text-sm text-center mt-4 text-gray-600">
        New to Chistix?{" "}
        <Link
          href="/register"
          className="text-orange-600 font-bold hover:underline"
        >
          Register your account
        </Link>
      </p>

      {/* <div className="relative flex items-center justify-center my-6">
        <span className="absolute bg-white px-2 text-xs text-gray-400">
          or continue with
        </span>
        <div className="w-full h-px bg-gray-200"></div>
      </div>

      <button className="flex items-center justify-center w-full bg-white border border-gray-300 rounded-full py-2.5 hover:bg-gray-50 transition-colors">
        <img
          src="https://www.svgrepo.com/show/475656/google-color.svg"
          alt="Google"
          className="w-5 h-5 mr-2"
        />
        <span className="text-sm font-bold text-blue-600">Login by Google</span>
      </button> */}
    </div>
  );
}
