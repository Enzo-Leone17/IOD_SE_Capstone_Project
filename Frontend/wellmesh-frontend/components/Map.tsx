"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import api from "@/lib/axios"; // your axios instance
import FullPageLoader from "@/components/FullPageLoader";
import { getCachedCoord, setCachedCoord } from "@/lib/coordCache";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

type Event = {
  id: number;
  title: string;
  address: string;
};

export default function EventMap({ event }: { event: Event }) {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mapContainer.current) return;

    const initMap = async () => {
      try {
        let center: [number, number] = [103.82, 1.35]; // default SG

        const cached = getCachedCoord(event.address);
        if (cached) {
          center = cached;
        } else {
          const res = await api.get(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
              event.address
            )}.json`,
            { params: { access_token: mapboxgl.accessToken } }
          );
          if (res.data.features?.length > 0) {
            center = res.data.features[0].center as [number, number];
            setCachedCoord(event.address, center);
          }
        }

        // Create map
        map.current = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center,
          zoom: 13,
        });

        // Add marker
        new mapboxgl.Marker()
          .setLngLat(center)
          .setPopup(new mapboxgl.Popup().setText(event.title))
          .addTo(map.current);

        // Remove loader once map finishes loading
        map.current.on("load", () => {
          setLoading(false);
        });
      } catch (err) {
        console.error("❌ Failed to initialize map:", err);
        setLoading(false);
      }
    };

    initMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [event]);

  return (
    <>
      {loading && <FullPageLoader />}
      <div className="w-full h-full" ref={mapContainer} />
    </>
  );
}
