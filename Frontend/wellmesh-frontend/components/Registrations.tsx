"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import api from "@/lib/axios";

type User = {
  id: number;
  username: string;
  email: string;
  role: string;
  image_url: string | null;
  phone: string | null;
  is_verified: boolean;
  createdAt: string;
};

type Event = {
  id: number;
  title: string;
  date: string;
};

type Registration = {
  id: number;
  event_id: number;
  user_id: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  Event: Event;
};

type ApiResponse = {
  user: User;
  registered: {
    total: number;
    page: number;
    totalPages: number;
    registrations: Registration[];
  };
};

export default function Registrations() {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchRegistrations();
  }, [page, limit]);

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      console.log(user?.id);
      const res = await api.get<ApiResponse>(`/users/${user?.id}`, {
        params: { page, limit },
      });
      setRegistrations(res.data.registered.registrations);
      setTotalPages(res.data.registered.totalPages);
    } catch (err) {
      console.error("❌ Failed to fetch registrations:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-gray-800">
      {/* User Info */}
      {user && (
        <div className="border rounded-lg shadow p-4 bg-gray-50">
          <h2 className="text-xl font-bold">{user.username}</h2>
          <p className="text-sm text-gray-700">{user.email}</p>
          <p className="text-sm">
            <strong>Role:</strong> {user.role}
          </p>
          <p className="text-sm">
            <strong>Verified:</strong> {user.is_verified ? "✅ Yes" : "❌ No"}
          </p>
        </div>
      )}

      {/* Registrations */}
      <div>
        <h3 className="text-lg font-semibold mb-3">My Registrations</h3>

        {loading ? (
          <p>Loading...</p>
        ) : registrations.length === 0 ? (
          <p>No registrations found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {registrations.map((reg) => (
              <div
                key={reg.id}
                className="border rounded-lg shadow p-4 flex flex-col gap-2"
              >
                <h4 className="text-md font-semibold">{reg.Event.title}</h4>
                <p className="text-sm text-gray-700">
                  <strong>Date:</strong>{" "}
                  {new Date(reg.Event.date).toLocaleDateString()}
                </p>
                <p className="text-sm">
                  <strong>Status:</strong>{" "}
                  <span
                    className={`${
                      reg.status === "completed"
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {reg.status}
                  </span>
                </p>
                <p className="text-xs text-gray-500">
                  Registered on: {new Date(reg.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex gap-2 flex-wrap">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setPage(num)}
              className={`px-3 py-1 rounded ${
                num === page
                  ? "bg-blue-600 text-white"
                  : "border border-gray-400 hover:bg-gray-100"
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="border p-2 rounded"
        >
          <option value={5}>5 / page</option>
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
        </select>
      </div>
    </div>
  );
}
