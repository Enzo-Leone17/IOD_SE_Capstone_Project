"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import SearchBox from "./SearchBox";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// ✅ Schema validation
const activitySchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().optional(),
  category: z.enum(["sports", "charity", "games", "other"]),
  additional_notes: z.string().nullable().optional(),
});

type ActivityForm = z.infer<typeof activitySchema>;

type Media = {
  id: number;
  type: "image" | "video";
  url: string;
};

type Item = {
  id: number;
  title: string;
  description?: string;
  category?: "sports" | "charity" | "games" | "other";
  additional_notes?: string | null;
  Media: Media[];
};

type CardListProps = {
  endpoint: string; // e.g. "/activities"
  sortByParams: string[];
};

export default function Activities({ endpoint, sortByParams }: CardListProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  // Query states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");

  // Pagination
  const [totalPages, setTotalPages] = useState(1);

  // Form/Edit states
  const [editMode, setEditMode] = useState(false);
  const [selected, setSelected] = useState<Item | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ActivityForm>({ resolver: zodResolver(activitySchema) });

  // Prefill when editing
  useEffect(() => {
    if (selected) {
      reset({
        title: selected.title,
        description: selected.description || "",
        category: selected.category || "other",
        additional_notes: selected.additional_notes || "",
      });
    }
  }, [selected, reset]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, limit, sortBy, sortOrder };
      if (search) params.search = search;

      const res = await api.get(endpoint, { params });
      setItems(res.data.activities);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      console.error(`❌ Failed to fetch from ${endpoint}:`, err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, limit, sortBy, sortOrder, search, endpoint]);

  // CRUD Handlers
  const onSubmit = async (data: ActivityForm) => {
    try {
      if (selected) {
        await api.put(`${endpoint}/update/${selected.id}`, data);
        setSuccess("✅ Activity updated successfully!");
        setTimeout(() => {
          setSuccess(null);
        }, 2000);
      } else {
        await api.post(`${endpoint}/create`, data);
        setSuccess("✅ Activity created successfully!");
        setTimeout(() => {
          setSuccess(null);
        }, 2000);
      }
      setEditMode(false);
      setSelected(null);
      reset();
      fetchItems();
    } catch {
      setError("❌ Failed to save activity");
      setTimeout(() => {
          setError(null);
        }, 2000);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.put(`${endpoint}/remove/${id}`);
      setSuccess("🗑️ Activity deleted successfully!");
      setTimeout(() => {
          setSuccess(null);
        }, 2000);
      fetchItems();
    } catch {
      setError("❌ Failed to delete activity");
      setTimeout(() => {
          setError(null);
        }, 2000);
    }
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

  // Render form when in edit/create mode
  if (editMode) {
    return (
      <div className="max-w-xl mx-auto mt-10 p-6 bg-white shadow rounded">
        <h2 className="text-2xl font-semibold text-blue-600 mb-4">
          {selected ? "Edit Activity" : "Create Activity"}
        </h2>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 text-gray-800"
        >
          <div>
            <label className="block text-sm">Title</label>
            <input
              {...register("title")}
              className="w-full border rounded p-2"
            />
            {errors.title && (
              <p className="text-red-600">{errors.title.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm">Description</label>
            <textarea
              {...register("description")}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm">Category</label>
            <select
              {...register("category")}
              className="w-full border rounded p-2"
            >
              <option value="other">Other</option>
              <option value="sports">Sports</option>
              <option value="games">Games</option>
              <option value="charity">Charity</option>
            </select>
          </div>
          <div>
            <label className="block text-sm">Additional Notes</label>
            <textarea
              {...register("additional_notes")}
              className="w-full border rounded p-2"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              {selected ? "Update" : "Create"}
            </button>
            {selected && (
              <button
                type="button"
                onClick={() => handleDelete(selected.id)}
                className="bg-red-600 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setEditMode(false);
                setSelected(null);
                reset();
              }}
              className="bg-gray-400 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Normal list view
  return (
    <div className="p-6 space-y-6 text-gray-800">
      {/* Controls Top */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded shadow">
        {/* Sort */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border rounded p-2"
        >
          <option value="id">Sort By</option>
          {sortByParams.map((param) => (
            <option key={param} value={param}>
              {param}
            </option>
          ))}
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "asc" | "desc")}
          className="border rounded p-2"
        >
          <option value="asc">Asc</option>
          <option value="desc">Desc</option>
        </select>

        {/* Search */}
        <SearchBox
          value={search}
          onSearch={(value) => setSearch(value)}
          placeholder="Search..."
        />

        {/* Create Button */}
        <button
          onClick={() => {
            setSelected(null);
            setEditMode(true);
          }}
          className="ml-auto bg-green-600 text-white px-4 py-2 rounded"
        >
          + Create Activity
        </button>
      </div>

      {/* Items */}
      {loading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center text-gray-500">No results found.</div>
      ) : (
        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                setSelected(item);
                setEditMode(true);
              }}
              className="flex flex-col gap-3 border p-4 rounded-lg shadow bg-white cursor-pointer hover:bg-gray-50"
            >
              <div>
                <p className="text-lg font-semibold text-blue-600">
                  {item.title}
                </p>
                {item.category && (
                  <p className="text-sm text-gray-500">{item.category}</p>
                )}
              </div>
              {item.description && (
                <p className="text-gray-700">{item.description}</p>
              )}
              {item.additional_notes && (
                <p className="text-sm text-gray-500 italic">
                  Note: {item.additional_notes}
                </p>
              )}
              {item.Media?.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3">
                  {item.Media.map((media) =>
                    media.type === "image" ? (
                      <img
                        key={media.id}
                        src={media.url}
                        alt={item.title}
                        className="w-32 h-32 object-cover rounded"
                      />
                    ) : (
                      <video
                        key={media.id}
                        src={media.url}
                        controls
                        className="w-32 h-32 object-cover rounded"
                      />
                    )
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Controls Bottom (Pagination + Limit) */}
      <div className="flex items-center justify-between bg-white p-4 rounded shadow">
        {/* Pagination */}
        <div className="flex gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setPage(num)}
              className={`px-3 py-1 rounded ${
                num === page
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              {num}
            </button>
          ))}
        </div>

        {/* Limit */}
        <select
          value={limit}
          onChange={(e) => {
            setLimit(Number(e.target.value));
            setPage(1);
          }}
          className="border rounded p-2"
        >
          {[5, 10, 20].map((l) => (
            <option key={l} value={l}>
              {l} per page
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
