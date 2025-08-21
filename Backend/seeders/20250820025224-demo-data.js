"use strict";
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // locations
    const locations = [
      {
        name: "HomeTeamNS Khatib",
        address: "2 Yishun Walk, Singapore 767944",
        booking_cost: 80,
        url: "https://www.hometeamns.sg/khatib",
        created_at: now,
        updated_at: now,
        is_deleted: false,
      },
      {
        name: "HomeTeamNS Bukit Batok",
        address: "2 Bukit Batok West Ave 7, Singapore 659003",
        booking_cost: 80,
        url: "https://www.hometeamns.sg/bukit-batok",
        created_at: now,
        updated_at: now,
        is_deleted: false,
      },
      {
        name: "HomeTeamNS Bedok Reservoir",
        address: "900 Bedok North Rd, Singapore 479994",
        booking_cost: 80,
        url: "https://www.hometeamns.sg/bedok-reservoir",
        created_at: now,
        updated_at: now,
        is_deleted: false,
      },
      {
        name: "Admiralty Park",
        address: "31 Riverside Road, Singapore 730000",
        booking_cost: 0,
        url: "https://www.nparks.gov.sg/visit/parks/park-detail/admiralty-park",
        created_at: now,
        updated_at: now,
        is_deleted: false,
      },
      {
        name: "East Coast Park",
        address: " E Coast Park Service Rd",
        booking_cost: 0,
        url: "https://www.nparks.gov.sg/visit/parks/park-detail/east-coast-park",
        created_at: now,
        updated_at: now,
        is_deleted: false,
      },
    ];

    // events
    const events = [
      {
      host_user_id: 4,
      location_id: 1,
      title: "HomeTeamNS Khatib",
      description: "Enjoy a multitude of activities at HomeTeamNS Khatib",
      date: new Date("2025-01-15 10:00:00"),
      budget: 350,
      available_pax: 0,
      max_capacity: 10,
    },
    {
      host_user_id: 16,
      location_id: 2,
      title: "HomeTeamNS Bukit Batok",
      description: "Enjoy a multitude of activities at HomeTeamNS Bukit Batok",
      date: new Date("2025-05-15 12:00:00"),
      budget: 500,
      available_pax: 0,
      max_capacity: 10,
    },
    {
      host_user_id: 20,
      location_id: 3,
      title: "Cycling at East Coast Park",
      description: "Time for some cycling and enjoy the scenery at East Coast Park",
      date: new Date("2025-09-15 13:00:00"),
      budget: 500,
      available_pax: 10,
      max_capacity: 10,
    },
  ];

    // registrations
    const registrations = Array.from({ length: 20 }, (_, i) => ({
      event_id: (i + 1) <= 10 ? 1 : 2,
      user_id: (i + 2) > 20 ? 2 : i + 2,
      status: "completed",
      created_at: now,
      updated_at: now,
      is_deleted: false,
    }));

    //activities
    const activities = [
      {
        title: "Rock climbing",
        description: "Challenge your climbing skills",
        category: "sports",
      },
      {
        title: "Futsal",
        description: "Get ready to show off your football skills. Team up with your friends and have a fun game of futsal.",
        category: "sports",
        additional_notes: "Advised to wear sport shoes.",
      },
      {
        title: "Cycling",
        description: "Relive the thrill of cycling with your team.",
        category: "sports",
        additional_notes: "Please bring your own bikes or contact host for arrangements.",
      },
    ]

    const event_activities = [
      {
        event_id: 1,
        activity_id: 1,
      },
      {
        event_id: 2,
        activity_id: 2,
      },
      {
        event_id: 3,
        activity_id: 3,
      },
    ]

    const medias = [
      {
        activity_id: 1,
        type: "image",
        url: "https://www.hometeamns.sg/frontline/wp-content/uploads/2020/09/north-cover.jpg",
      },
      {
        activity_id: 2,
        type: "image",
        url: "https://www.hometeamns.sg/frontline/wp-content/uploads/2022/02/Swimming-Pool-Taken-before-COVID-19_1600x900.jpg",
      },
      {
        activity_id: 3,
        type: "image",
        url: "https://www.nparks.gov.sg/images/default-source/parks-img/east-coast-park/east-coast-park-hero-garden.jpeg",
      },
    ]

    await queryInterface.bulkInsert("locations", locations);
    await queryInterface.bulkInsert("events", events);
    await queryInterface.bulkInsert("registrations", registrations);
    await queryInterface.bulkInsert("activities", activities);
    await queryInterface.bulkInsert("event_activities", event_activities);
    await queryInterface.bulkInsert("medias", medias);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete("medias", null, {});
    await queryInterface.bulkDelete("event_activities", null, {});
    await queryInterface.bulkDelete("activities", null, {});
    await queryInterface.bulkDelete("registrations", null, {});
    await queryInterface.bulkDelete("events", null, {});
    await queryInterface.bulkDelete("locations", null, {});
  },
};
