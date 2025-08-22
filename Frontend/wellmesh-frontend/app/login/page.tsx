"use client";

import { useAuth } from "@/context/AuthContext";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import Navbar from "@/components/Navbar";

const loginSchema = z.object({
  email: z.email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { user, login } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // if user already logged in, redirect to homepage
      router.push("/");
    }
  }, [user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      console.log("✅ Logged in successfully!");
    } catch (err) {
      if (err instanceof z.ZodError) {
        const zodError = err as z.ZodError;
        setServerError(zodError.issues[0].message);
      } else if (err instanceof AxiosError) {
        if (err.response) {
          const { status, data } = err.response;

          if (status === 401) {
            // Invalid email/password
            setServerError(data.error || "Invalid email or password.");
          } else if (status === 500) {
            // Backend error format: { error: "...", details: "..." }
            setServerError(`${data.error}: ${data.details}`);
          } else {
            // Other known errors
            setServerError(
              data.error || "Something went wrong. Please try again."
            );
          }
        } else {
          // No response (network / CORS issue)
          setServerError("Network error. Please try again later.");
        }
      } else {
        setServerError("Unexpected error occurred.");
      }
    }
  };

  // Prevent flashing login form before redirect
  if (user) return null;

  return (
    <>
      <Navbar />
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white p-6 rounded shadow-md w-96"
        >
          <h1 className="text-blue-400 text-2xl font-bold mb-4">
            WellMesh Login
          </h1>

          {serverError && (
            <p className="text-red-500 text-sm mb-3 border border-red-300 p-2 rounded bg-red-50">
              {serverError}
            </p>
          )}

          <div className="mb-3">
            <input
              type="email"
              placeholder="Email"
              {...register("email")}
              className="text-black w-full p-2 border rounded"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="mb-3">
            <input
              type="password"
              placeholder="Password"
              {...register("password")}
              className="text-black w-full p-2 border rounded"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-800 text-white py-2 rounded"
          >
            Login
          </button>
        </form>
        {/* No account? register here */}
        <div className="mt-4 text-center">
          <p className="text-gray-600">
            Don&apos;t have an account?{" "}
            <a href="/register" className="text-blue-600 hover:underline">
              Register here
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
