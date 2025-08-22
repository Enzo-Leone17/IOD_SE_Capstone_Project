"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
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
  phone: z
    .string()
    .regex(/^[0-9+\-\s()]+$/, "Invalid phone number")
    .min(6, "Phone number too short"),
  image_url: z.url("Must be a valid URL"),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const router = useRouter();

  // ✅ Setup form with default values from user
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      role:
        (user?.role as "admin" | "staff" | "manager" | "guest" | undefined) ||
        "guest",
      secret_code: "",
      email: user?.email || "",
      username: user?.username || "",
      phone: user?.phone || "",
      image_url: user?.image_url || "https://placehold.co/400",
    },
  });

  const onSubmit = async (data: ProfileForm) => {
    const res = await api.put(`/users/update/${user?.id}`, {
      ...user,
      ...data,
    });
    setUser(res.data);
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <>
      <Navbar onMenuClick={() => {}} />
      <div className="max-w-3xl mx-auto p-6 bg-white shadow rounded mt-24 text-black">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>

        {!isEditing ? (
          <div className="flex items-start gap-6">
            <img
              src={user?.image_url}
              alt="Profile Picture"
              className="w-32 h-32 rounded-full border object-cover"
            />
            <div className="space-y-3">
              <p>
                <strong>Role:</strong> {user?.role || "guest"}
              </p>
              <p>
                <strong>Email:</strong> {user?.email || "-"}
              </p>
              <p>
                <strong>Username:</strong> {user?.username || "-"}
              </p>
              <p>
                <strong>Phone:</strong> {user?.phone || "-"}
              </p>

              <button
                onClick={() => {
                  reset(); // reset to latest user values
                  setIsEditing(true);
                }}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-800"
              >
                Edit Profile
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role */}
            <div>
              {watch("role") !== "guest" && (
                <>
                  <label className="block text-sm font-medium">Role</label>
                  <select
                    {...register("role")}
                    className="w-full p-2 border rounded"
                  >
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                  </select>
                  <input
                    {...register("secret_code")}
                    className="w-full p-2 border rounded"
                    placeholder="Validation code for role change"
                  />
                  {errors.role && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.role.message}
                    </p>
                  )}
                </>
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
                Save
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        <div className="border-t mt-6 flex justify-end">
          <button
            onClick={handleLogout}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-800"
          >
            Logout
          </button>
        </div>
      </div>
    </>
  );
}
