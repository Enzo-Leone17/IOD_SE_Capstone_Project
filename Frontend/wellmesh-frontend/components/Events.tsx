"use client";

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { AxiosError } from "axios";
import EventMap from "./Map";
import SearchBox from "./SearchBox";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// ✅ Zod validation schema for Events
const eventSchema = z.object({
  host_user_id: z
    .number()
    .min(1, "Host user ID must be at least 1")
    .optional()
    .nullable(),
  location_id: z
    .number()
    .min(1, "Location ID must be at least 1")
    .optional()
    .nullable(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  date: z.string().nonempty("Date is required"),
  budget: z.number().min(0, "Budget must be >= 0"),
  max_capacity: z.number().min(1, "Capacity must be at least 1"),
  additional_fee: z
    .number()
    .min(0, "Additional fee must be >= 0")
    .optional()
    .nullable(),
});

type EventForm = z.infer<typeof eventSchema>;

type Media = { id: number; url: string; type: "image" | "video" };
type Activity = {
  id: number;
  title: string;
  description: string;
  Media: Media[];
};
type Event = {
  id: number;
  host_user_id: number | null;
  location_id: number | null;
  title: string;
  description: string;
  date: string;
  budget: number;
  available_pax: number;
  max_capacity: number;
  additional_fee: number | null;
  host: { username: string; email: string };
  Activities: Activity[];
  Location: { name: string; address: string; url: string };
};

export default function Events() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [viewingEvent, setViewingEvent] = useState(false);
  const [showMap, setShowMap] = useState<Record<number, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [toRegister, setToRegister] = useState(false);
  const [editMode, setEditMode] = useState(false); // ✅ toggle edit mode

  // query states
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [totalPages, setTotalPages] = useState(1);

  // ✅ react-hook-form
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EventForm>({
    resolver: zodResolver(eventSchema),
  });

  // ✅ Prefill form when selecting event
  useEffect(() => {
    if (selectedEvent) {
      reset({
        host_user_id: selectedEvent.host_user_id,
        location_id: selectedEvent.location_id,
        title: selectedEvent.title,
        description: selectedEvent.description,
        date: new Date(selectedEvent.date).toISOString().slice(0, 16), // format for datetime-local
        budget: selectedEvent.budget,
        max_capacity: selectedEvent.max_capacity,
        additional_fee: selectedEvent.additional_fee,
      });
    }
  }, [selectedEvent, reset]);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await api.get("/events", {
          params: { page, limit, sortBy, sortOrder, search },
        });
        const eventsData: Event[] = res.data.events || [];
        setEvents(eventsData);
        const initialShowMap: Record<number, boolean> = {};
        eventsData.forEach((event) => {
          initialShowMap[event.id] = false;
        });
        setShowMap(initialShowMap);
        setTotalPages(res.data.totalPages || 1);
      } catch (err) {
        if (err instanceof AxiosError) {
          if (err.response) {
            const { status, data } = err.response;
            if (status === 500) {
              setError(`${data.error}: ${data.details}`);
            } else {
              setError(data.error || "Something went wrong. Please try again.");
            }
          }
        }
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, [page, limit, sortBy, sortOrder, search]);

  // CRUD handlers
  const onSubmit = async (data: EventForm) => {
    try {
      if (selectedEvent) {
        // Update
        await api.put(`/events/update/${selectedEvent.id}`, data);
        setSuccess("Event updated successfully!");
        setTimeout(() => {
          setSuccess(null);
        }, 2000);
      } else {
        // Create
        await api.post("/events", data);
        setSuccess("Event created successfully!");
        setTimeout(() => {
          setSuccess(null);
        }, 2000);
      }
      setEditMode(false);
      reset();
    } catch (err) {
      setError("Failed to save event");
      setTimeout(() => {
          setError(null);
        }, 2000);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.put(`/events/remove/${id}`);
      setSuccess("Event deleted successfully!");
      setTimeout(() => {
          setSuccess(null);
        }, 2000);
    } catch (err) {
      setError("Failed to delete event");
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

  const handleRegister = async (event_id: number | null) => {
    try {
      if (event_id) {
        const res = await api.post(`/users/${user?.id}/register_event`, {
          event_id,
        });
        if (res.status === 201) {
          setToRegister(false);
          setSuccess(res.data.message + "\n redirecting... ");
          setTimeout(() => {
            setSuccess(null);
          }, 2000);
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error(err);
        setToRegister(false);
        setError(err.message + "\n redirecting... ");
        setTimeout(() => {
          setError(null);
        }, 2000);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen text-blue-600 text-xl">
        Loading events...
      </div>
    );
  }

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

  // ✅ Show form in edit mode
  if (editMode && (user?.role === "admin" || user?.role === "manager")) {
    return (
      <div className="max-w-xl mx-auto mt-20 p-6 bg-white shadow rounded">
        <h2 className="text-2xl font-semibold text-blue-600 mb-4">
          {selectedEvent ? "Edit Event" : "Create Event"}
        </h2>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4 text-gray-800"
        >
          <div>
            <label className="block text-sm">Host ID</label>
            <input
              type="number"
              {...register("host_user_id", { valueAsNumber: true })}
              className="w-full border rounded p-2"
            />
            {errors.host_user_id && (
              <p className="text-red-600">{errors.host_user_id.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm">Location ID</label>
            <input
              type="number"
              {...register("location_id", { valueAsNumber: true })}
              className="w-full border rounded p-2"
            />
            {errors.location_id && (
              <p className="text-red-600">{errors.location_id.message}</p>
            )}
          </div>
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
            {errors.description && (
              <p className="text-red-600">{errors.description.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm">Date</label>
            <input
              type="datetime-local"
              {...register("date")}
              className="w-full border rounded p-2"
            />
            {errors.date && (
              <p className="text-red-600">{errors.date.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm">Budget</label>
            <input
              type="number"
              {...register("budget", { valueAsNumber: true })}
              className="w-full border rounded p-2"
            />
            {errors.budget && (
              <p className="text-red-600">{errors.budget.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm">Max Capacity</label>
            <input
              type="number"
              {...register("max_capacity", { valueAsNumber: true })}
              className="w-full border rounded p-2"
            />
            {errors.max_capacity && (
              <p className="text-red-600">{errors.max_capacity.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm">Additional Fee</label>
            <input
              type="number"
              {...register("additional_fee", { valueAsNumber: true })}
              className="w-full border rounded p-2"
            />
            {errors.additional_fee && (
              <p className="text-red-600">{errors.additional_fee.message}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              {selectedEvent ? "Update" : "Create"}
            </button>
            {selectedEvent && (
              <button
                type="button"
                onClick={() => handleDelete(selectedEvent.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setEditMode(false);
                reset();
              }}
              className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Normal view
  return (
    <div className="max-w-6xl mx-auto mt-20 p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold mb-4 text-blue-600">All Events</h1>
        {/* ✅ Only admins/managers can see */}
        {(user?.role === "admin" || user?.role === "manager") && (
          <button
            onClick={() => {
              setEditMode(true);
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            + Edit Events
          </button>
        )}
      </div>

      {/* keep your existing event list + view details code here */}
      {toRegister && user?.role && user?.role !== "guest" && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-2xl font-semibold mb-4 text-black">
              Confirm to register for this event?
              <br />
              <br />
              {selectedEvent?.title}
            </h2>
            <div className="flex justify-between">
              <button
                onClick={() => handleRegister(selectedEvent?.id || null)}
                className="bg-green-600 hover:bg-green-800 text-white px-4 py-2 rounded-md"
              >
                Confirm
              </button>
              <button
                onClick={() => setToRegister(false)}
                className="bg-red-600 hover:bg-red-800 text-white px-4 py-2 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {selectedEvent && viewingEvent && user?.role && user?.role !== "guest" ? (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          {/* Event Title & Date */}
          <h2 className="text-2xl font-semibold text-blue-700">
            {selectedEvent.title}
          </h2>
          <p className="text-gray-600">
            {new Date(selectedEvent.date).toLocaleString()}
          </p>

          {/* Description */}
          <p className="mt-3 text-gray-700">{selectedEvent.description}</p>

          {/* Host */}
          <p className="mt-2 text-sm text-gray-500">
            Hosted by <strong>{selectedEvent.host.username}</strong> (
            {selectedEvent.host.email})
          </p>

          {/* Capacity */}
          <p className="mt-2 text-sm text-gray-600">
            Capacity:{" "}
            {selectedEvent.available_pax === 0 ? (
              <strong className="text-red-600">Fully Booked</strong>
            ) : (
              `${selectedEvent.available_pax}`
            )}
          </p>

          {/* Budget */}
          <p className="mt-1 text-sm text-gray-600">
            Budget: ${selectedEvent.budget}
          </p>

          {/* Additional fees */}
          {selectedEvent.additional_fee && (
            <p className="mt-1 text-sm text-gray-600">
              Additional fee: ${selectedEvent.additional_fee}
            </p>
          )}

          {/* Activities */}
          <div className="mt-4">
            <h3 className="text-lg font-medium text-yellow-600">Activities</h3>
            <div className="space-y-3 mt-2">
              {selectedEvent.Activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex flex-col gap-3 border p-2 rounded"
                >
                  <div>
                    <p className="font-semibold text-blue-600">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      {activity.description}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {activity.Media.map((media) =>
                      media.type === "image" ? (
                        <img
                          key={media.id}
                          src={media.url}
                          alt={activity.title}
                          className="w-20 h-20 md:w-40 md:h-40 object-cover rounded"
                        />
                      ) : media.type === "video" ? (
                        <video
                          key={media.id}
                          src={media.url}
                          controls
                          className="w-20 h-20 md:w-40 md:h-40 object-cover rounded"
                        />
                      ) : null
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Location */}
          <h3 className="text-lg font-medium text-yellow-600 mt-3">Location</h3>
          <p className="mt-1 text-sm text-gray-600">
            📍{" "}
            <a
              href={selectedEvent.Location.url}
              target="_blank"
              className="text-blue-600 underline"
            >
              {selectedEvent.Location.name}
            </a>{" "}
            - {selectedEvent.Location.address}
          </p>
          {showMap[selectedEvent.id] ? (
            <>
              <div className="h-32 mx-2 md:h-96 md:mx-4">
                <EventMap
                  event={{
                    id: selectedEvent.id,
                    address: selectedEvent.Location.address,
                    title: selectedEvent.title,
                  }}
                />
              </div>
              <button
                onClick={() => toggleMap(selectedEvent.id)}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                Close Map
              </button>
            </>
          ) : (
            <button
              onClick={() => toggleMap(selectedEvent.id)}
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Show Map
            </button>
          )}
          {/* Button Group, add register button */}
          <div className="flex gap-4 justify-end">
            {selectedEvent.available_pax > 0 && (
              <button
                className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                onClick={() => {
                  setToRegister(true);
                }}
              >
                Register
              </button>
            )}
            <button
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => {
                setSelectedEvent(null);
                setViewingEvent(false);
              }}
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 🔹 Controls Top */}
          <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded shadow text-blue-600">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border rounded p-2"
            >
              <option value="date">Date</option>
              <option value="title">Title</option>
              <option value="budget">Budget</option>
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
          </div>
          {/* 🔹 Events List */}
          {events.length === 0 ? (
            <p className="text-gray-600">No events available.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border rounded-lg shadow p-5 bg-white hover:shadow-lg transition"
                >
                  {/* Event Title & Date */}
                  <h2 className="text-2xl font-semibold text-blue-700">
                    <button
                      onClick={() => {
                        setSelectedEvent(event);
                        setViewingEvent(true);
                      }}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      {event.title}
                    </button>
                  </h2>
                  <p className="text-gray-600">
                    {new Date(event.date).toLocaleString()}
                  </p>

                  {/* Description */}
                  <p className="mt-3 text-gray-700">{event.description}</p>

                  {/* Host */}
                  <p className="mt-2 text-sm text-gray-500">
                    Hosted by <strong>{event.host.username}</strong> (
                    {event.host.email})
                  </p>

                  {/* Capacity */}
                  <p className="mt-2 text-sm text-gray-600">
                    Capacity:{" "}
                    {event.available_pax === 0 ? (
                      <strong className="text-red-600">Fully Booked</strong>
                    ) : (
                      `${event.available_pax}`
                    )}
                  </p>

                  {/* Budget */}
                  <p className="mt-1 text-sm text-gray-600">
                    Budget: ${event.budget}
                  </p>

                  {/* Additional fees */}
                  {event.additional_fee && (
                    <p className="mt-1 text-sm text-gray-600">
                      Additional fee: ${event.additional_fee}
                    </p>
                  )}

                  {/* Activities */}
                  <div className="mt-4">
                    <h3 className="text-lg font-medium text-yellow-600">
                      Activities
                    </h3>
                    <div className="space-y-3 mt-2">
                      {event.Activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="flex flex-col gap-3 border p-2 rounded"
                        >
                          <div>
                            <p className="font-semibold text-blue-600">
                              {activity.title}
                            </p>
                            <p className="text-sm text-gray-600">
                              {activity.description}
                            </p>
                          </div>
                          <div className="flex flex-wrap justify-center gap-2">
                            {activity.Media.map((media) =>
                              media.type === "image" ? (
                                <img
                                  key={media.id}
                                  src={media.url}
                                  alt={activity.title}
                                  className="w-20 h-20 md:w-40 md:h-40 object-cover rounded"
                                />
                              ) : media.type === "video" ? (
                                <video
                                  key={media.id}
                                  src={media.url}
                                  controls
                                  className="w-20 h-20 md:w-40 md:h-40 object-cover rounded"
                                />
                              ) : null
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Location */}
                  <h3 className="text-lg font-medium text-yellow-600 mt-3">
                    Location
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    📍{" "}
                    <a
                      href={event.Location.url}
                      target="_blank"
                      className="text-blue-600 underline"
                    >
                      {event.Location.name}
                    </a>{" "}
                    - {event.Location.address}
                  </p>
                  {showMap[event.id] ? (
                    <>
                      <div className="h-32 mx-2 md:h-96 md:mx-4">
                        <EventMap
                          event={{
                            id: event.id,
                            address: event.Location.address,
                            title: event.title,
                          }}
                        />
                      </div>
                      <button
                        onClick={() => toggleMap(event.id)}
                        className="text-blue-600 hover:text-blue-800 underline"
                      >
                        Close Map
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => toggleMap(event.id)}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Show Map
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 🔹 Controls Bottom */}
          <div className="flex items-center justify-between bg-white p-4 rounded shadow">
            {/* Pagination */}
            <div className="flex gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (num) => (
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
                )
              )}
            </div>

            {/* Limit */}
            <select
              value={limit}
              onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1);
              }}
              className="border rounded p-2 text-gray-600"
            >
              {[5, 10, 20].map((l) => (
                <option key={l} value={l}>
                  {l} per page
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}
