import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    subdomain: {
      type: String,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    customDomain: {
      type: String,
      lowercase: true,
      trim: true,
      sparse: true,
    },
    tagline: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    branding: {
      logo: {
        type: String,
        default: "",
      },
      favicon: {
        type: String,
        default: "",
      },
      primaryColor: {
        type: String,
        default: "#14171F",
      },
      accentColor: {
        type: String,
        default: "#8B6B4C",
      },
      backgroundColor: {
        type: String,
        default: "#FBF9F5",
      },
      textColor: {
        type: String,
        default: "#1C1917",
      },
      fontFamily: {
        type: String,
        enum: ["serif", "sans", "mono"],
        default: "serif",
      },
      heroBanner: {
        type: String,
        default:
          "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1800&q=80",
      },
      bannerHeadline: {
        type: String,
        default: "Curated Hospitality, Elevated Living",
      },
      bannerSubheadline: {
        type: String,
        default: "Experience authentic stays tailored with bespoke care and architectural grace.",
      },
    },
    theme: {
      template: {
        type: String,
        enum: ["boutique-editorial", "luxury-minimal", "modern-vibrant"],
        default: "boutique-editorial",
      },
      showMarketplaceBadge: {
        type: Boolean,
        default: true,
      },
    },
    contact: {
      email: {
        type: String,
        default: "",
      },
      phone: {
        type: String,
        default: "",
      },
      address: {
        type: String,
        default: "",
      },
      website: {
        type: String,
        default: "",
      },
      socials: {
        instagram: { type: String, default: "" },
        twitter: { type: String, default: "" },
        facebook: { type: String, default: "" },
      },
    },
    paymentSettings: {
      vpa: {
        type: String,
        default: "",
      },
      merchantName: {
        type: String,
        default: "",
      },
      currency: {
        type: String,
        default: "INR",
      },
    },
    status: {
      type: String,
      enum: ["active", "suspended", "pending_setup"],
      default: "active",
      index: true,
    },
    hotels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hotel",
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Virtual for hosted URLs
organizationSchema.virtual("hostedUrl").get(function () {
  return `/portal/${this.slug}`;
});

organizationSchema.virtual("subdomainUrl").get(function () {
  return `https://${this.subdomain || this.slug}.smartstay.com`;
});

export const Organization = mongoose.model("Organization", organizationSchema);

