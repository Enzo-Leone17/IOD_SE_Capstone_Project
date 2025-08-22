"use client";

import Image from "next/image";
import Navbar from "@/components/Navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* 🔹 Navbar */}
      <Navbar />

      {/* 🔹 Hero Section */}
      <section className="relative h-[80vh] flex items-center justify-center text-center text-white">
        <Image
          src="https://placehold.co/600x400"
          alt="Luxury Hotel"
          layout="fill"
          objectFit="cover"
          className="absolute inset-0 z-0"
        />
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
        <div className="relative z-10 max-w-2xl px-6">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Efficient Event Management
          </h1>
          <p className="text-lg md:text-xl mb-6">
            Discover events, deepen connections, and participate
            in recreational activities, all with WellMesh.
          </p>
          <a
            href="#program"
            className="bg-blue-600 hover:bg-blue-800 text-white px-6 py-3 rounded-lg shadow-lg transition"
          >
            Explore Our Program
          </a>
        </div>
      </section>

      {/* 🔹 Body Sections */}
      <main className="pt-24 space-y-20">
        {/* Section 1 - Program */}
        <section
          id="program"
          className="container mx-auto px-6 grid md:grid-cols-2 gap-10 items-center"
        >
          <div>
            <h2 className="text-3xl font-bold text-yellow-600 mb-3">
              JOIN IN OUR PROGRAM
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Manage your work-life balance by participating in healthy activities hosted
              by your department leaders.
            </p>
          </div>
          <Image
            src="https://cdn.pixabay.com/photo/2021/08/28/13/34/marathon-6580967_1280.jpg"
            alt="Marathon"
            width={600}
            height={400}
            className="rounded-lg shadow-lg"
          />
        </section>

        {/* Section 2 - Exclusives */}
        <section
          id="exclusives"
          className="container mx-auto px-6 grid md:grid-cols-2 gap-10 items-center"
        >
          <Image
            src="https://cdn.pixabay.com/photo/2018/03/10/12/00/teamwork-3213924_1280.jpg"
            alt="Department exclusives"
            width={600}
            height={400}
            className="rounded-lg shadow-lg"
          />
          <div>
            <h2 className="text-3xl font-bold text-yellow-600 mb-3">
              STAFF AND MANAGERS ONLY
            </h2>
            <p className="text-gray-600 leading-relaxed">
              As a Manager, you will gain exclusive access to our
              database of activities and manage events for your department.
              Staffs from department will gain access to register for the events.
            </p>
          </div>
        </section>

        {/* Section 3 - Permissions */}
        <section
          id="permissions"
          className="container mx-auto px-6 grid md:grid-cols-2 gap-10 items-center"
        >
          <div>
            <h2 className="text-3xl font-bold text-yellow-600 mb-3">
              PERMISSIONS FOR SERVICE
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Admin can create accounts for company members from which Managers can start
              planning and hosting events for their department staffs. 
            </p>
          </div>
          <Image
            src="https://cdn.pixabay.com/photo/2021/12/16/17/26/man-6874914_1280.jpg"
            alt="Admin priviledge"
            width={600}
            height={400}
            className="rounded-lg shadow-lg"
          />
        </section>
      </main>
    </div>
  );
}
