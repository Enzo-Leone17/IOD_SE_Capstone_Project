"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import Navbar from "@/components/Navbar";

export default function VerifyPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("❌ No verification token found.");
      return;
    }

    const verify = async () => {
      try {
        const res = await api.post(
          `/auth/verify-email?token=${token}`
        );
        setStatus("success");
        setMessage("✅ Your email has been verified. Redirecting...");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } catch (err) {
        setStatus("error");
        setMessage("❌ Verification failed or token expired.");
      }
    };

    verify();
  }, [searchParams, router]);

  return (
    <>
      <Navbar onMenuClick={() => {}} />
      <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded mt-8 text-black">
        <h1 className="text-2xl font-bold mb-6">Email Verification</h1>
        {status === "loading" && <p>⏳ Verifying your account...</p>}
        {status !== "loading" && <p>{message}</p>}
      </div>
    </>
  );
}
