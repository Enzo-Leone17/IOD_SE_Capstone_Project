"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import SearchBox from "./SearchBox";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// ✅ Zod Schema
const mediaSchema = z.object({
  activity_id: z.number().min(1, "Activity ID is required"),
  type: z.enum(["image", "video"], { error: "Invalid type. Must be either 'image' or 'video'." }),
  url: z.string().url("Must be a valid URL"),
});

type MediaForm = z.infer<typeof mediaSchema>;

type Media = {
  id: number;
  activity_id: number;
  type: "image" | "video";
  url: string;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
  Activity?: {
    id: number;
    title: string;
    description: string;
  };
};

type ApiResponse = {
  medias: Media[];
  page: number;
  totalPages: number;
  total: number;
};

export default function MediaList() {
  const [medias, setMedias] = useState<Media[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingMedia, setEditingMedia] = useState<Media | null>(null);

  // query params
  const [sortBy, setSortBy] = useState("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);
  const [totalPages, setTotalPages] = useState(1);

  // ✅ react-hook-form setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MediaForm>({
    resolver: zodResolver(mediaSchema),
  });

  useEffect(() => {
    fetchMedias();
  }, [sortBy, sortOrder, search, page, limit]);

  const fetchMedias = async () => {
    setLoading(true);
    try {
      const res = await api.get<ApiResponse>("/medias", {
        params: { sortBy, sortOrder, search, page, limit },
      });
      setMedias(res.data.medias);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      console.error("❌ Failed to fetch medias:", err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ CRUD operations
  const onSubmit = async (data: MediaForm) => {
    try {
      if (editingMedia) {
        await api.put(`/medias/${editingMedia.id}`, data);
      } else {
        await api.post("/medias", data);
      }
      reset();
      setEditingMedia(null);
      fetchMedias();
    } catch (err) {
      console.error("❌ Failed to save media:", err);
    }
  };

  const handleEdit = (media: Media) => {
    setEditingMedia(media);
    reset(media);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this media?")) return;
    try {
      await api.delete(`/medias/${id}`);
      fetchMedias();
    } catch (err) {
      console.error("❌ Failed to delete media:", err);
    }
  };

  return (
    <div className="space-y-6 text-gray-800">
      {/* Form Section */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="border p-4 rounded shadow space-y-3 bg-gray-50"
      >
        <h2 className="text-lg font-semibold">
          {editingMedia ? "Edit Media" : "Add Media"}
        </h2>

        <div>
          <label className="block">Activity ID</label>
          <input
            type="number"
            {...register("activity_id", { valueAsNumber: true })}
            className="border p-2 w-full rounded"
          />
          {errors.activity_id && (
            <p className="text-red-500 text-sm">
              {errors.activity_id.message}
            </p>
          )}
        </div>

        <div>
          <label className="block">Type</label>
          <select {...register("type")} className="border p-2 w-full rounded">
            <option value="">Select type</option>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
          {errors.type && (
            <p className="text-red-500 text-sm">{errors.type.message}</p>
          )}
        </div>

        <div>
          <label className="block">URL</label>
          <input
            type="text"
            {...register("url")}
            className="border p-2 w-full rounded"
          />
          {errors.url && (
            <p className="text-red-500 text-sm">{errors.url.message}</p>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {editingMedia ? "Update" : "Create"}
          </button>
          {editingMedia && (
            <button
              type="button"
              onClick={() => {
                reset();
                setEditingMedia(null);
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Top Controls */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border p-2 rounded"
          >
            <option value="">Sort By</option>
            {["id", "activity_id", "type"].map((field) => (
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
          placeholder="Search medias..."
        />
      </div>

      {/* Media Cards */}
      {loading ? (
        <p>Loading...</p>
      ) : medias.length === 0 ? (
        <p>No medias found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {medias.map((media) => (
            <div
              key={media.id}
              className="border rounded-lg shadow overflow-hidden"
            >
              {media.type === "image" ? (
                <img
                  src={media.url}
                  alt={`Media ${media.id}`}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <video
                  src={media.url}
                  controls
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-3 text-sm space-y-1">
                <p>
                  <strong>ID:</strong> {media.id}
                </p>
                <p>
                  <strong>Activity ID:</strong> {media.activity_id}
                </p>
                {media.Activity && (
                  <>
                    <p>
                      <strong>Title:</strong> {media.Activity.title}
                    </p>
                    <p>
                      <strong>Description:</strong>{" "}
                      {media.Activity.description}
                    </p>
                  </>
                )}
                <p>
                  <strong>Type:</strong> {media.type}
                </p>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleEdit(media)}
                    className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(media.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
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
          <option value={6}>6 / page</option>
          <option value={12}>12 / page</option>
          <option value={24}>24 / page</option>
        </select>
      </div>
    </div>
  );
}
