"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/lib/axios";
import Navbar from "@/components/Navbar";

// ✅ Validation schema
const profileSchema = z.object({
  role: z.enum(["admin", "staff", "manager", "guest"]),
  secret_code: z
    .string()
    .min(6, "Secret code must be at least 6 characters")
    .optional()
    .or(z.literal("")),
  email: z.email("Invalid email address"),
  username: z.string().min(2, "Username must be at least 2 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]+$/, "Invalid phone number")
    .min(6, "Phone number too short")
    .optional()
    .or(z.literal("")),
  image_url: z.url("Must be a valid URL").optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function RegisterPage() {
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const router = useRouter();

  // Simple Setup form
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      role: "guest",
      secret_code: "",
      email: "",
      username: "",
      phone: "",
      image_url: "https://placehold.co/400",
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    try {
      console.log("ran submit");
      const res = await api.post(`/users/create`, {
        ...data,
      });
      if (res.status === 201) {
        setSuccessMsg(res.data.message);
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error(err);
      }
    }
  };

  if (successMsg) {
    return (
      <>
        <Navbar onMenuClick={() => {}} />
        <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded mt-24 text-black">
          <h1 className="text-2xl font-bold mb-6">Register</h1>
          <p className="text-green-500 font-bold">{successMsg}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar onMenuClick={() => {}} />
      <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded mt-24 text-black">
        <h1 className="text-2xl font-bold mb-6">Register</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Role */}
          <div>
            <label className="block text-sm font-medium">Role</label>
            <select {...register("role")} className="w-full p-2 border rounded">
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="manager">Manager</option>
              <option value="guest">Guest</option>
            </select>
            {watch("role") !== "guest" && (
              <>
                <input
                  type="password"
                  {...register("secret_code")}
                  className="w-full p-2 border rounded"
                  placeholder="Validation code for role"
                />
              </>
            )}
            {errors.role && (
              <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              {...register("email")}
              className="w-full p-2 border rounded"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium">Username</label>
            <input
              {...register("username")}
              className="w-full p-2 border rounded"
            />
            {errors.username && (
              <p className="text-red-500 text-xs mt-1">
                {errors.username.message}
              </p>
            )}
          </div>
          {/* Password */}
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              {...register("password")}
              className="w-full p-2 border rounded"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium">Phone</label>
            <input
              {...register("phone")}
              className="w-full p-2 border rounded"
            />
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">
                {errors.phone.message}
              </p>
            )}
          </div>

          {/* Profile Picture */}
          <div>
            <label className="block text-sm font-medium">
              Profile Picture URL
            </label>
            <input
              {...register("image_url")}
              className="w-full p-2 border rounded"
            />
            {errors.image_url && (
              <p className="text-red-500 text-xs mt-1">
                {errors.image_url.message}
              </p>
            )}
            <img
              src={watch("image_url") || "https://via.placeholder.com/150"}
              alt="Preview"
              className="w-24 h-24 rounded-full mt-2 object-cover border"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-800"
            >
              Register
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
