"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { User, Mail, Lock, Eye, EyeOff, Ticket } from "lucide-react";
import { registerSchema } from "@/middlewares/auth.middleware";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referral, setReferral] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("CUSTOMER");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRegister = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    const validation = registerSchema.safeParse({
      name,
      email,
      password,
      role,
    });
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0].message);
      return;
    }

    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name,
      role,
      callbackURL: "/login",
      fetchOptions: {
        onSuccess: () => router.push(`/verify-registration?email=${encodeURIComponent(email)}`),
      },
    } as any);

    if (error) {
      setErrorMessage(
        error.message || "There's some problem when Registration",
      );
      setIsLoading(false);
    } else {
      router.push(`/verify-registration?email=${encodeURIComponent(email)}`);
    }
  };

  // const handleGoogleLogin = async () => {
  //   await authClient.signIn.social({ provider: "google",
  //     callbackURL: "/" //redirect klu berhasil
  //    });
  // };
  // sementara pakai ini dulu
  const [showMaintenance, setShowMaintenance] = useState(false);
  const handleGoogleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    setShowMaintenance(true);
    setTimeout(() => {
      setShowMaintenance(false);
    }, 3000);
  };

  return (
    <div className="flex flex-col">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Create Your Account</h2>
        <p className="text-xs text-gray-500 mt-1">
          Join to buy tickets or host your own events.
          <br />
          Select your role to create account!
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700">
            Full Name
          </label>
          <div className="relative flex items-center">
            <User className="absolute left-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="John Doe"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-full outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700">Email</label>
          <div className="relative flex items-center">
            <Mail className="absolute left-3 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="yourname@mail.com"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-full outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-700">
            Password
          </label>
          <div className="relative flex items-center">
            <Lock className="absolute left-3 w-4 h-4 text-gray-400" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-full outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-gray-400"
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-neutral-700">
            Choose Role
          </label>
          <div className="flex bg-gray-100 p-3 rounded-full mb-2">
            <button
              type="button"
              onClick={() => setRole("CUSTOMER")}
              className={`flex-1 py-2 text-sm font-medium rounded-full transition-all ${
                role === "CUSTOMER"
                  ? "bg-white shadow-sm text-orange-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => setRole("ORGANIZER")}
              className={`flex-1 py-2 text-sm font-medium rounded-full transition-all ${
                role === "ORGANIZER"
                  ? "bg-white shadow-sm text-orange-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Organizer
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-700">
            Referral code{" "}
            <span className="text-gray-400 font-normal">(Optional)</span>
          </label>
          <div className="relative flex items-center">
            <Ticket className="absolute left-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="CHX-7K2P9"
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-full outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-1">
            Join with a code and get a discount coupon
          </p>
        </div>

        {errorMessage && (
          <div className="p-2 text-xs text-red-600 bg-red-50 rounded">
            {errorMessage}
          </div>
        )}
        <button className="w-full bg-[#f58200] hover:bg-[#e67300] text-white font-bold py-2.5 rounded-full transition-colors mt-4 text-sm">
          Register Account
        </button>
      </form>

      <div className="relative flex items-center justify-center my-5">
        <span className="absolute bg-white px-2 text-[10px] text-gray-400">
          or continue with
        </span>
        <div className="w-full h-px bg-gray-200"></div>
      </div>

      {/* tambahain: onClick={handleGoogleLogin} di dalam button klu mau pake google  */}
      <div className="relative w-full">
        {showMaintenance && (
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1.5 px-3 rounded-md shadow-lg flex items-center whitespace-nowrap animate-in fade-in slide-in-from-bottom-2 duration-200">
            This Featture is in Maintenance Mode
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          className="flex items-center justify-center w-full bg-white border border-gray-300 rounded-full py-2 hover:bg-gray-50 transition-colors"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-4 h-4 mr-2"
          />
          <span className="text-sm font-bold text-blue-600">
            Login by Google
          </span>
        </button>
      </div>
    </div>
  );
}
