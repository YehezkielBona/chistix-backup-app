"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { Suspense } from "react";

// 1. Pindahkan isi utama ke komponen terpisah
function VerifyRegistrationContent() {
  const searchParams = useSearchParams();
  const userEmail = searchParams.get("email");

  return (
    <div className="flex flex-col text-center">
      <h2 className="text-xl font-bold text-neutral-900 mb-2">
        Account Has Been Created!
      </h2>
      <p className="text-lg text-neutral-500 mb-6 px-2 leading-relaxed">
        Your Account successfully created. We've sent you a verification code to{" "}
        <span className="font-semibold text-gray-900">{userEmail || "your email"}</span>.
        Please check your Inbox or Spam folder.
      </p>

      <div className="space-y-6 text-center">
        <Link
          href="/"
          className="text-sm text-amber-600 hover:underline font-bold"
        >
          Go Back to Homepage
        </Link>
      </div>
    </div>
  );
}

// 2. Bungkus dengan Suspense di komponen utama yang di-export
export default function VerifyRegistrationPage() { // <-- Nama function disesuaikan
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 flex justify-center items-center">Loading...</div>}>
      <VerifyRegistrationContent />
    </Suspense>
  );
}


// "use client";
// import Link from "next/link";
// import { useSearchParams } from "next/navigation";
// import { MailCheck } from "lucide-react";
// import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";

// export default function ForgotPasswordPage() {
//   const searchParams = useSearchParams();
//   const userEmail = searchParams.get("email");
//   const router = useRouter();
//   const [isVerifying, setIsVerifying] = useState(true);

//   useEffect(() => {
//     const navEntries = performance.getEntriesByType(
//       "navigation",
//     ) as PerformanceNavigationTiming[];
//     if (navEntries.length > 0) {
//       const navType = navEntries[0].type;
//       if (navType === "reload" || navType === "navigate") {
//         router.replace("/register");
//       } else {
//         setIsVerifying(false);
//       }
//     }
//   }, [router]);

//   if (isVerifying) {
//     return <div className="min-h-screen bg-gray-50"></div>;
//   }

//   return (
//     <div className="flex flex-col text-center">
//       <h2 className="text-xl font-bold text-neutral-900 mb-2">
//         Account Has Been Created!
//       </h2>
//       <p className="text-lg tex-neutral-500 mb-6 px-2 leading-relaxed">
//         Your Account succesfully created. We've sent you verrification code to{" "}
//         <span className="font-semibold text-gray-900">{userEmail || ""}</span>.
//         Please check on your Inbox or Spam.
//       </p>

//       <div className="space-y-6 text-center">
//         {/* <button className="w-full border border-amber-500 hover:bg-amber-500 text-amber-500 hover:text-white font-bold py-2.5 rounded-full transition-colors text-sm">Go Back to Homepage</button> */}
//         <Link
//           href="/"
//           className="text-sm text-amber-600 hover:underline font-bold"
//         >
//           Go Back to Homepage
//         </Link>
//       </div>
//     </div>
//   );
// }
