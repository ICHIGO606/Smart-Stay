import dotenv from "dotenv";
import mongoose from "mongoose";
import { Organization } from "./src/models/organization.models.js";
import { User } from "./src/models/user.models.js";
import { Hotel } from "./src/models/hotel.models.js";
import { Room } from "./src/models/room.models.js";

dotenv.config({ path: "./.env" });

async function seedOrganization() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URL);
    console.log("Connected successfully to DB!");

    const slug = "aura-haven";

    // Clean up if existing aura-haven organization exists
    const existingOrg = await Organization.findOne({ slug });
    if (existingOrg) {
      console.log(`Found existing '${slug}', cleaning up previous test data...`);
      const hotels = await Hotel.find({ organizationId: existingOrg._id });
      for (const h of hotels) {
        await Room.deleteMany({ hotelId: h._id });
      }
      await Hotel.deleteMany({ organizationId: existingOrg._id });
      await User.deleteMany({ email: "founder@aurahaven.com" });
      await Organization.deleteOne({ _id: existingOrg._id });
      console.log("Previous data cleaned up.");
    }

    // 1. Create or Find Founder Admin User
    let owner = await User.findOne({ email: "founder@aurahaven.com" });
    if (!owner) {
      owner = await User.create({
        fullName: "Devraj Singhania",
        email: "founder@aurahaven.com",
        username: "aurahaven_admin",
        password: "AuraHaven@2026",
        role: "admin",
        phone: "+91 98765 43210",
        age: 36,
        gender: "Male",
        address: {
          street: "Pichola Promenade",
          city: "Udaipur",
          state: "Rajasthan",
          country: "India",
          zipCode: "313001",
        },
      });
      console.log(`Created owner admin user: ${owner.email} (${owner._id})`);
    } else {
      owner.role = "admin";
      await owner.save();
    }

    // 2. Create Organization
    const organization = await Organization.create({
      name: "Aura Haven Resorts",
      slug: slug,
      subdomain: slug,
      customDomain: "stays.aurahaven.com",
      tagline: "Bespoke Sanctuary & Heritage Living",
      description:
        "Aura Haven is a private collection of luxury sanctuaries and heritage retreats crafted for discerning travelers seeking serenity, architectural elegance, and authentic hospitality.",
      ownerId: owner._id,
      branding: {
        logo: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=200&q=80",
        favicon: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=64&q=80",
        primaryColor: "#0F2922",
        accentColor: "#C89D5C",
        backgroundColor: "#F8F6F1",
        textColor: "#19201D",
        fontFamily: "serif",
        heroBanner: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1920&q=80",
        bannerHeadline: "Escape to Aura Haven Sanctuary",
        bannerSubheadline:
          "Handcrafted private pool suites, cliffside terraces, and Michelin-inspired dining across India's most breathtaking landscapes.",
      },
      theme: {
        template: "boutique-editorial",
        showMarketplaceBadge: true,
      },
      contact: {
        email: "concierge@aurahaven.com",
        phone: "+91 98765 43210",
        address: "Lake Pichola Promenade, Udaipur, Rajasthan 313001",
        website: "https://aurahaven.com",
        socials: {
          instagram: "aurahavenresorts",
          twitter: "aurahaven",
        },
      },
      paymentSettings: {
        vpa: "aurahaven@upi",
        merchantName: "Aura Haven Luxury Resorts Ltd",
        currency: "INR",
      },
      status: "active",
      hotels: [],
    });

    owner.organizationId = organization._id;
    await owner.save();
    console.log(`Created organization: ${organization.name} [slug: ${organization.slug}] (${organization._id})`);

    // 3. Create Flagship Hotel 1: Aura Haven Palace & Spa (Udaipur)
    const hotel1 = await Hotel.create({
      name: "Aura Haven Palace & Spa",
      city: "Udaipur",
      address: "Lakefront Promenade, Lake Pichola, Udaipur, Rajasthan",
      description:
        "Perched along the historic shores of Lake Pichola, Aura Haven Palace offers royal marble suites, private plunge pools, and uninterrupted sunset views over the water.",
      starRating: 5,
      amenities: [
        "Private Plunge Pool",
        "Lakeview Dining",
        "Ayurvedic Spa",
        "Complimentary High Tea",
        "Butler Service",
        "WiFi",
        "Airport Chauffeur",
      ],
      images: [
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80",
      ],
      adminId: owner._id,
      organizationId: organization._id,
      currency: "INR",
      rooms: [],
    });

    const room1_1 = await Room.create({
      type: "Heritage Courtyard Villa",
      pricePerNight: 12500,
      maxOccupancy: 3,
      hotelId: hotel1._id,
      roomNumbers: [201, 202, 203],
      amenities: ["King Bed", "Private Garden", "Rain Shower", "Free WiFi", "AC"],
      operationalStatus: "Available",
      statusHistory: [{ status: "Available", updatedAt: new Date(), notes: "Initial provision" }],
    });

    const room1_2 = await Room.create({
      type: "Royal Lakeview Suite",
      pricePerNight: 18500,
      maxOccupancy: 2,
      hotelId: hotel1._id,
      roomNumbers: [101, 102],
      amenities: ["King Bed", "Lakeview Balcony", "Private Jacuzzi", "Butler Service", "Mini Bar"],
      operationalStatus: "Available",
      statusHistory: [{ status: "Available", updatedAt: new Date(), notes: "Initial provision" }],
    });

    const room1_3 = await Room.create({
      type: "Presidential Sanctuary Pavilion",
      pricePerNight: 32000,
      maxOccupancy: 4,
      hotelId: hotel1._id,
      roomNumbers: [301],
      amenities: ["2 King Bedrooms", "Infinity Plunge Pool", "Private Chef Kitchen", "Chauffeur Service"],
      operationalStatus: "Available",
      statusHistory: [{ status: "Available", updatedAt: new Date(), notes: "Initial provision" }],
    });

    hotel1.rooms = [room1_1._id, room1_2._id, room1_3._id];
    await hotel1.save();
    console.log(`Created hotel 1: ${hotel1.name} with 3 room tiers.`);

    // 4. Create Flagship Hotel 2: Aura Haven Forest Retreat (Wayanad)
    const hotel2 = await Hotel.create({
      name: "Aura Haven Forest Retreat",
      city: "Wayanad",
      address: "Cloud Forest Ridge, Lakkidi, Wayanad, Kerala",
      description:
        "Nestled beneath the mist-laden Western Ghats, this eco-luxury forest retreat blends elevated treehouse villas with tranquil tea estate walks.",
      starRating: 5,
      amenities: [
        "Infinity Forest Pool",
        "Organic Dining",
        "Mist Walking Trails",
        "Yoga Pavilion",
        "Fireplace Lounges",
        "WiFi",
      ],
      images: [
        "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80",
      ],
      adminId: owner._id,
      organizationId: organization._id,
      currency: "INR",
      rooms: [],
    });

    const room2_1 = await Room.create({
      type: "Mist Ridge Cottage",
      pricePerNight: 9800,
      maxOccupancy: 2,
      hotelId: hotel2._id,
      roomNumbers: [401, 402, 403],
      amenities: ["Queen Bed", "Fireplace", "Mountain View Terrace", "Free WiFi"],
      operationalStatus: "Available",
      statusHistory: [{ status: "Available", updatedAt: new Date(), notes: "Initial provision" }],
    });

    const room2_2 = await Room.create({
      type: "Canopy Treehouse Villa",
      pricePerNight: 14000,
      maxOccupancy: 2,
      hotelId: hotel2._id,
      roomNumbers: [501, 502],
      amenities: ["King Bed", "Panoramic Deck", "Glass Wall Shower", "Forest View"],
      operationalStatus: "Available",
      statusHistory: [{ status: "Available", updatedAt: new Date(), notes: "Initial provision" }],
    });

    hotel2.rooms = [room2_1._id, room2_2._id];
    await hotel2.save();
    console.log(`Created hotel 2: ${hotel2.name} with 2 room tiers.`);

    // Link hotels to organization
    organization.hotels = [hotel1._id, hotel2._id];
    await organization.save();

    console.log("\n=======================================================");
    console.log("🎉 SUCCESS: Organization Provisioned!");
    console.log("=======================================================");
    console.log("Organization Name :", organization.name);
    console.log("Slug / Subdomain  :", organization.slug);
    console.log("Hosted Web Portal :", `http://localhost:3000/portal/${organization.slug}`);
    console.log("Direct Hotels URL :", `http://localhost:3000/portal/${organization.slug}/hotels`);
    console.log("Admin Console     :", `http://localhost:3000/admin/organization`);
    console.log("Marketplace Orgs  :", `http://localhost:3000/orgs`);
    console.log("\nAdmin Owner Credentials:");
    console.log("Email             :", owner.email);
    console.log("Username          :", owner.username);
    console.log("Password          :", "AuraHaven@2026");
    console.log("UPI Settlement VPA:", organization.paymentSettings.vpa);
    console.log("=======================================================\n");

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error("Error creating organization:", err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedOrganization();
