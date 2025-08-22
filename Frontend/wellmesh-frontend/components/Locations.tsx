"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import EventMap from "./Map";
import SearchBox from "./SearchBox";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// ---------------- Validation Schema ----------------
const locationSchema = z.object({
  name: z.string().min(2, "Name is required"),
  address: z.string().min(5, "Address is required"),
  booking_cost:  z.preprocess(Number, z.number().min(0, "Booking cost must be >= 0")),
  url: z.url("Invalid URL").optional().or(z.literal("")),
});

type LocationFormData = z.infer<typeof locationSchema>;

type Location = {
  id: number;
  name: string;
  address: string;
  booking_cost: number;
  url: string;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
};

type ApiResponse = {
  locations: Location[];
  currentPage: number;
  totalPages: number;
  limit: number;
};

export default function Locations() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState<Record<number, boolean>>({});
  const [editingId, setEditingId] = useState<number | null>(null);

  // query params
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ✅ destructure like activities
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LocationFormData>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      name: "",
      address: "",
      booking_cost: 0,
      url: "",
    },
  });

  useEffect(() => {
    fetchLocations();
  }, [sortBy, sortOrder, search, page, limit]);

  const fetchLocations = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse>("/locations", {
        params: { sortBy, sortOrder, search, page, limit },
      });
      setLocations(res.data.locations);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("❌ Failed to fetch locations:", err);
    } finally {
      setLoading(false);
    }
  };

  // ---------------- CRUD ----------------
  const onSubmit = async (data: LocationFormData) => {
    try {
      if (editingId) {
        await api.put(`/locations/update/${editingId}`, data);
        setEditingId(null);
        setSuccess("✅ Location updated successfully!");
        setTimeout(() => {
          setSuccess(null);
        }, 2000);
      } else {
        await api.post("/locations/create", data);
        setSuccess("✅ Location created successfully!");
        setTimeout(() => {
          setSuccess(null);
        }, 2000);
      }
      reset();
      fetchLocations();
    } catch (err) {
      console.error("❌ Save failed:", err);
      setError("❌ Failed to save location");
      setTimeout(() => {
          setError(null);
        }, 2000);
    }
  };

  const handleEdit = (loc: Location) => {
    setEditingId(loc.id);
    reset({
      name: loc.name,
      address: loc.address,
      booking_cost: loc.booking_cost,
      url: loc.url,
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this location?")) return;
    try {
      await api.put(`/locations/remove/${id}`);
      setSuccess("✅ Location removed successfully!");
        setTimeout(() => {
          setSuccess(null);
        }, 2000);
      fetchLocations();
    } catch (err) {
      console.error("❌ Delete failed:", err);
      setError("❌ Failed to delete location");
      setTimeout(() => {
          setError(null);
        }, 2000);
    }
  };

  // toggle helper
  const toggleMap = (id: number) => {
    setShowMap((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen text-red-600 text-lg">
        {error}
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex justify-center items-center h-screen text-green-600 text-lg">
        {success}
      </div>
    );
  }

  return (
    <div className="space-y-6 text-gray-800">
      {/* ---------------- Top Controls ---------------- */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">Sort By</option>
            {["name", "address", "booking_cost"].map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
            className="border p-2 rounded"
          >
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>

        <SearchBox
          value={search}
          onSearch={setSearch}
          placeholder="Search locations..."
        />
      </div>

      {/* ---------------- Form (Create / Edit) ---------------- */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="border p-4 rounded-lg bg-gray-50 space-y-3"
      >
        <h3 className="font-semibold text-lg">
          {editingId ? "Edit Location" : "Create Location"}
        </h3>

        <input
          {...register("name")}
          placeholder="Location name"
          className="w-full border p-2 rounded"
        />
        {errors.name && (
          <p className="text-red-500 text-sm">{errors.name.message}</p>
        )}

        <input
          {...register("address")}
          placeholder="Address"
          className="w-full border p-2 rounded"
        />
        {errors.address && (
          <p className="text-red-500 text-sm">{errors.address.message}</p>
        )}

        <input
          type="number"
          {...register("booking_cost")}
          placeholder="Booking Cost"
          className="w-full border p-2 rounded"
        />
        {errors.booking_cost && (
          <p className="text-red-500 text-sm">{errors.booking_cost.message}</p>
        )}

        <input
          {...register("url")}
          placeholder="Website URL"
          className="w-full border p-2 rounded"
        />
        {errors.url && (
          <p className="text-red-500 text-sm">{errors.url.message}</p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            {editingId ? "Update" : "Create"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                reset();
              }}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* ---------------- Location Cards ---------------- */}
      {loading ? (
        <p>Loading...</p>
      ) : locations.length === 0 ? (
        <p>No locations found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="border rounded-lg shadow p-4 flex flex-col gap-2"
            >
              <h2 className="text-lg font-semibold">{loc.name}</h2>
              <p className="text-sm text-gray-700">
                <strong>Address:</strong> {loc.address}
              </p>

              {showMap[loc.id] ? (
                <>
                  <div className="h-32 mx-2 md:h-96 md:mx-4">
                    <EventMap
                      event={{
                        id: loc.id,
                        address: loc.address,
                        title: loc.name,
                      }}
                    />
                  </div>
                  <button
                    onClick={() => toggleMap(loc.id)}
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    Close Map
                  </button>
                </>
              ) : (
                <button
                  onClick={() => toggleMap(loc.id)}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Show Map
                </button>
              )}

              <p className="text-sm text-gray-700">
                <strong>Booking Cost:</strong> ${loc.booking_cost}
              </p>
              {loc.url && (
                <a
                  href={loc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm"
                >
                  Visit Website
                </a>
              )}

              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleEdit(loc)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(loc.id)}
                  className="bg-red-600 text-white px-3 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---------------- Pagination ---------------- */}
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
