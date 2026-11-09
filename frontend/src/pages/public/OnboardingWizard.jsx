import { useState, useEffect } from "react";
import { Link } from "react-router";
import organizationService from "../../services/organizationService";
import { useAuth } from "../../context/AuthContext";
import { formatCurrency } from "../../utils/formatters";
import {
  Globe,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  Palette,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  BedDouble,
  MapPin,
  RefreshCw,
  QrCode,
  Copy,
} from "lucide-react";

const OnboardingWizard = () => {
  const { user, login } = useAuth();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [provisioningDone, setProvisioningDone] = useState(false);
  const [provisioningResult, setProvisioningResult] = useState(null);
  const [copied, setCopied] = useState(false);

  // Slug check states
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState(null);
  const [slugMessage, setSlugMessage] = useState("");

  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Identity
    name: "",
    slug: "",
    tagline: "",
    description: "",

    // Step 2: Brand Studio
    primaryColor: "#14171F",
    accentColor: "#8B6B4C",
    backgroundColor: "#FBF9F5",
    fontFamily: "serif",
    logoUrl: "",
    heroBanner:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1800&q=80",
    bannerHeadline: "",
    bannerSubheadline: "",

    // Step 3: Flagship Property
    hotelName: "",
    city: "",
    address: "",
    starRating: 5,
    roomType: "Executive Suite",
    pricePerNight: 5500,
    maxOccupancy: 2,
    roomNumbers: "101, 102, 103",

    // Step 4: Owner & Settlement
    fullName: user?.name || "",
    email: user?.email || "",
    password: "",
    phone: "",
    upiVpa: "",
    merchantName: "",
  });

  // Auto-generate slug from brand name
  const handleNameChange = (e) => {
    const name = e.target.value;
    const generatedSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");

    setFormData((prev) => ({
      ...prev,
      name,
      slug: prev.slug === "" || prev.slug === prev.name.toLowerCase().replace(/\s+/g, "-") ? generatedSlug : prev.slug,
      bannerHeadline: prev.bannerHeadline === "" ? `Welcome to ${name}` : prev.bannerHeadline,
      merchantName: prev.merchantName === "" ? name : prev.merchantName,
    }));
  };

  // Debounced slug check
  useEffect(() => {
    if (!formData.slug || formData.slug.length < 3) {
      setSlugAvailable(null);
      setSlugMessage("");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSlugChecking(true);
        const res = await organizationService.checkSlugAvailability(formData.slug);
        const data = res.data || res;
        setSlugAvailable(data.available);
        setSlugMessage(data.reason || (data.available ? "Subdomain available" : "Not available"));
      } catch {
        setSlugAvailable(false);
        setSlugMessage("Error checking availability");
      } finally {
        setSlugChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData.slug]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle final submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      const payload = {
        organization: {
          name: formData.name,
          slug: formData.slug,
          tagline: formData.tagline || `Distinctive Stays by ${formData.name}`,
          description: formData.description,
          branding: {
            primaryColor: formData.primaryColor,
            accentColor: formData.accentColor,
            backgroundColor: formData.backgroundColor,
            fontFamily: formData.fontFamily,
            logo: formData.logoUrl,
            heroBanner: formData.heroBanner,
            bannerHeadline: formData.bannerHeadline || `Welcome to ${formData.name}`,
            bannerSubheadline: formData.bannerSubheadline || "Extraordinary hospitality crafted with bespoke care.",
          },
          paymentSettings: {
            vpa: formData.upiVpa || `${formData.slug}@upi`,
            merchantName: formData.merchantName || formData.name,
            currency: "INR",
          },
        },
        flagshipHotel: {
          name: formData.hotelName || `${formData.name} Flagship`,
          city: formData.city || "Mumbai",
          address: formData.address || `${formData.city || "City Center"}, Main Ave`,
          starRating: Number(formData.starRating) || 5,
          startingPrice: Number(formData.pricePerNight) || 5000,
          rooms: [
            {
              type: formData.roomType || "Deluxe Suite",
              pricePerNight: Number(formData.pricePerNight) || 5000,
              maxOccupancy: Number(formData.maxOccupancy) || 2,
              roomNumbers: formData.roomNumbers
                ? formData.roomNumbers.split(",").map((s) => s.trim()).filter(Boolean)
                : ["101", "102"],
              amenities: ["King Bed", "Balcony", "Rain Shower", "Mini Bar", "AC", "WiFi"],
            },
          ],
        },
      };

      // Include owner if not already logged in
      if (!user) {
        payload.owner = {
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
        };
      }

      const res = await organizationService.onboardOrganization(payload);
      const resultData = res.data || res;

      setProvisioningResult(resultData);
      setProvisioningDone(true);

      // Auto sign-in if token returned
      if (resultData.token && !user) {
        localStorage.setItem("accessToken", resultData.token);
        if (login) {
          login({ name: formData.fullName, email: formData.email, role: "admin" }, resultData.token);
        }
      }
    } catch (err) {
      console.error("Onboarding failed:", err);
      setError(err.message || "Failed to provision brand website. Please check your fields.");
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ------------------- SUCCESS SCREEN ------------------- //
  if (provisioningDone && provisioningResult) {
    const hostedPath = provisioningResult.urls?.hostedPath || `/portal/${formData.slug}`;
    const fullHostedUrl = `${window.location.origin}${hostedPath}`;

    return (
      <div className="max-w-3xl mx-auto py-16 px-4 sm:px-6">
        <div className="bg-white rounded-3xl border border-stone-200/90 shadow-xl p-8 sm:p-12 text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto shadow-xs">
            <CheckCircle2 size={36} />
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800">
              <Sparkles size={13} />
              <span>Multi-Tenant Provisioning Complete</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal">
              {formData.name} is Live!
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto leading-relaxed">
              Your sovereign branded website has been generated and activated. It is powered live by the SmartStay SaaS engine and connected to your flagship property.
            </p>
          </div>

          {/* Generated URL Card */}
          <div className="bg-stone-50 rounded-2xl p-6 border border-stone-200/80 text-left space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider text-stone-500">
                Live Hosted Website URL
              </span>
              <button
                onClick={() => copyToClipboard(fullHostedUrl)}
                className="text-xs font-mono text-stone-600 hover:text-stone-900 flex items-center gap-1 transition-colors"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                <span>{copied ? "Copied" : "Copy URL"}</span>
              </button>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-stone-200 font-mono text-xs text-stone-900 flex items-center justify-between break-all">
              <span>{fullHostedUrl}</span>
              <Link
                to={hostedPath}
                target="_blank"
                className="text-stone-700 hover:text-stone-900 shrink-0 ml-2"
              >
                <ExternalLink size={15} />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono pt-2 text-stone-600">
              <div className="p-3 bg-white rounded-xl border border-stone-100">
                <span className="text-stone-400 block text-[10px] uppercase">Cloud Subdomain</span>
                <span className="font-medium text-stone-900">{formData.slug}.smartstay.com</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-stone-100">
                <span className="text-stone-400 block text-[10px] uppercase">YouPI VPA</span>
                <span className="font-medium text-stone-900">{formData.upiVpa || `${formData.slug}@upi`}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              to={hostedPath}
              className="w-full sm:w-auto px-6 py-3.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
            >
              <Globe size={15} />
              <span>Visit Your Live Website</span>
              <ArrowRight size={14} />
            </Link>

            <Link
              to="/admin/organization"
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-xl text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <Building2 size={15} />
              <span>Manage in Admin Studio</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ------------------- WIZARD FORM ------------------- //
  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Wizard Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-100 border border-stone-200 text-xs font-mono uppercase tracking-wider text-stone-700">
          <Sparkles size={13} className="text-amber-600" />
          <span>SaaS Automated Provisioning Engine</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 font-normal">
          Onboard Your Hospitality Brand
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-light">
          Set up your organization, customize your visual theme, and automatically launch your own dedicated booking website powered by SmartStay.
        </p>
      </div>

      {/* Steps indicator */}
      <div className="max-w-3xl mx-auto flex items-center justify-between text-xs font-mono">
        {[
          { num: 1, label: "Brand Identity" },
          { num: 2, label: "Visual Studio" },
          { num: 3, label: "Flagship Hotel" },
          { num: 4, label: "Settlement & Owner" },
        ].map((s) => (
          <button
            key={s.num}
            onClick={() => s.num < step && setStep(s.num)}
            className={`flex items-center gap-2 pb-2 border-b-2 transition-colors ${
              step === s.num
                ? "border-stone-900 text-stone-900 font-bold"
                : step > s.num
                  ? "border-emerald-600 text-emerald-700 cursor-pointer"
                  : "border-stone-200 text-stone-400 cursor-default"
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] ${
                step > s.num
                  ? "bg-emerald-600 text-white"
                  : step === s.num
                    ? "bg-stone-900 text-white"
                    : "bg-stone-200 text-stone-500"
              }`}
            >
              {step > s.num ? <Check size={12} /> : s.num}
            </span>
            <span className="hidden sm:inline">{s.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="max-w-3xl mx-auto p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2.5">
          <AlertCircle size={16} className="shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Card with Form & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Inputs (Left) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          {/* STEP 1: Brand & Domain */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="space-y-1 pb-3 border-b border-stone-100">
                <h3 className="font-serif text-xl text-stone-900 font-semibold">1. Brand & Subdomain</h3>
                <p className="text-xs text-stone-500">Choose your brand name and your custom SmartStay subdomain.</p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1.5">
                  Organization / Brand Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Heritage Havelis, Zostel Stays"
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1.5">
                  Subdomain Slug *
                </label>
                <div className="flex items-center rounded-xl border border-stone-200 bg-stone-50 overflow-hidden focus-within:ring-1 focus-within:ring-stone-900">
                  <span className="px-3 text-xs font-mono text-stone-400 bg-stone-100 border-r border-stone-200 select-none">
                    https://
                  </span>
                  <input
                    type="text"
                    name="slug"
                    required
                    placeholder="mybrand"
                    value={formData.slug}
                    onChange={handleChange}
                    className="flex-1 px-3 py-2.5 text-xs font-mono bg-transparent focus:outline-none text-stone-900 lowercase"
                  />
                  <span className="px-3 text-xs font-mono text-stone-500 bg-stone-100 border-l border-stone-200 select-none">
                    .smartstay.com
                  </span>
                </div>

                {/* Real-time status */}
                <div className="flex items-center gap-1.5 mt-1.5 text-[11px] font-mono">
                  {slugChecking ? (
                    <span className="text-stone-400 flex items-center gap-1">
                      <RefreshCw size={11} className="animate-spin" />
                      Checking availability...
                    </span>
                  ) : slugAvailable === true ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <CheckCircle2 size={12} />
                      Subdomain is available! Hosted URL: /portal/{formData.slug}
                    </span>
                  ) : slugAvailable === false ? (
                    <span className="text-red-600 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {slugMessage || "Subdomain is taken or invalid"}
                    </span>
                  ) : null}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1.5">
                  Brand Tagline
                </label>
                <input
                  type="text"
                  name="tagline"
                  placeholder="e.g. Royal Palaces of Rajasthan"
                  value={formData.tagline}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1.5">
                  Brand Description / Story
                </label>
                <textarea
                  name="description"
                  rows={3}
                  placeholder="Describe your hospitality collection, heritage, or aesthetic philosophy..."
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  disabled={!formData.name || !formData.slug || slugAvailable === false}
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-stone-800 disabled:opacity-50 flex items-center gap-2 transition-all"
                >
                  <span>Proceed to Brand Studio</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Brand Styling Studio */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="space-y-1 pb-3 border-b border-stone-100">
                <h3 className="font-serif text-xl text-stone-900 font-semibold">2. Visual Brand Studio</h3>
                <p className="text-xs text-stone-500">Customize the colors, typography, and banner for your hosted website.</p>
              </div>

              {/* Color pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 mb-1.5">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-2 p-1.5 border border-stone-200 rounded-xl bg-stone-50">
                    <input
                      type="color"
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                    />
                    <input
                      type="text"
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="w-full text-xs font-mono uppercase bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 mb-1.5">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-2 p-1.5 border border-stone-200 rounded-xl bg-stone-50">
                    <input
                      type="color"
                      name="accentColor"
                      value={formData.accentColor}
                      onChange={handleChange}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                    />
                    <input
                      type="text"
                      name="accentColor"
                      value={formData.accentColor}
                      onChange={handleChange}
                      className="w-full text-xs font-mono uppercase bg-transparent focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 mb-1.5">
                    Background Color
                  </label>
                  <div className="flex items-center gap-2 p-1.5 border border-stone-200 rounded-xl bg-stone-50">
                    <input
                      type="color"
                      name="backgroundColor"
                      value={formData.backgroundColor}
                      onChange={handleChange}
                      className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                    />
                    <input
                      type="text"
                      name="backgroundColor"
                      value={formData.backgroundColor}
                      onChange={handleChange}
                      className="w-full text-xs font-mono uppercase bg-transparent focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Typography */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 mb-1.5">
                  Brand Typography Personality
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "serif", label: "Editorial Serif", sample: "Playfair / Newsreader" },
                    { id: "sans", label: "Clean Sans", sample: "Inter / Plus Jakarta" },
                    { id: "mono", label: "Modern Mono", sample: "JetBrains / Space" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, fontFamily: t.id }))}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        formData.fontFamily === t.id
                          ? "border-stone-900 bg-stone-50 font-medium"
                          : "border-stone-200 text-stone-600 hover:border-stone-300"
                      }`}
                    >
                      <span className="block text-xs font-semibold text-stone-900">{t.label}</span>
                      <span className="text-[10px] text-stone-500 font-mono">{t.sample}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Banner Imagery */}
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 mb-1.5">
                  Hero Cover Photography URL
                </label>
                <input
                  type="url"
                  name="heroBanner"
                  value={formData.heroBanner}
                  onChange={handleChange}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-mono uppercase text-stone-600 hover:bg-stone-50 flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-stone-800 flex items-center gap-2"
                >
                  <span>Set Up Flagship Hotel</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Flagship Hotel & Rooms */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="space-y-1 pb-3 border-b border-stone-100">
                <h3 className="font-serif text-xl text-stone-900 font-semibold">3. Flagship Property & Rooms</h3>
                <p className="text-xs text-stone-500">Seed your first hotel and room inventory for your hosted site.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 mb-1.5">
                    Flagship Hotel Name *
                  </label>
                  <input
                    type="text"
                    name="hotelName"
                    required
                    placeholder="e.g. Palace Resort & Spa"
                    value={formData.hotelName}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 mb-1.5">
                    City / Location *
                  </label>
                  <input
                    type="text"
                    name="city"
                    required
                    placeholder="e.g. Jaipur, Udaipur, Goa"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-stone-600 mb-1.5">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="e.g. 12 Royal Palace Road, Amber Area"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>

              {/* Room Tier */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-stone-800">
                  <BedDouble size={14} />
                  <span>Initial Room Tier & Key Numbers</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-stone-500 mb-1">Room Tier</label>
                    <input
                      type="text"
                      name="roomType"
                      value={formData.roomType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-stone-200 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-stone-500 mb-1">Price / Night (₹)</label>
                    <input
                      type="number"
                      name="pricePerNight"
                      value={formData.pricePerNight}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-stone-200 text-xs font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-stone-500 mb-1">Max Guests</label>
                    <input
                      type="number"
                      name="maxOccupancy"
                      value={formData.maxOccupancy}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-stone-200 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-stone-500 mb-1">
                    Room Numbers (Comma-separated keys)
                  </label>
                  <input
                    type="text"
                    name="roomNumbers"
                    value={formData.roomNumbers}
                    onChange={handleChange}
                    placeholder="101, 102, 103"
                    className="w-full px-3 py-2 bg-white rounded-lg border border-stone-200 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-mono uppercase text-stone-600 hover:bg-stone-50 flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-stone-800 flex items-center gap-2"
                >
                  <span>Settlement & Launch</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Owner & Settlement */}
          {step === 4 && (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-300">
              <div className="space-y-1 pb-3 border-b border-stone-100">
                <h3 className="font-serif text-xl text-stone-900 font-semibold">4. Settlement & Credentials</h3>
                <p className="text-xs text-stone-500">Configure your direct YouPI UPI settlement and owner access.</p>
              </div>

              {/* YouPI Settlement */}
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono text-amber-900 font-semibold uppercase">
                  <QrCode size={14} />
                  <span>Sovereign YouPI-PG Direct Settlement</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-stone-600 mb-1">
                      Corporate UPI VPA (ID)
                    </label>
                    <input
                      type="text"
                      name="upiVpa"
                      placeholder={`${formData.slug || "brand"}@upi`}
                      value={formData.upiVpa}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-amber-200 text-xs font-mono text-stone-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono uppercase text-stone-600 mb-1">
                      Merchant Business Name
                    </label>
                    <input
                      type="text"
                      name="merchantName"
                      placeholder={formData.name || "Brand Name"}
                      value={formData.merchantName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-amber-200 text-xs text-stone-900"
                    />
                  </div>
                </div>
              </div>

              {/* Owner account if guest */}
              {!user && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-mono uppercase tracking-wider text-stone-700 block">
                    Create Organization Owner Account
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-stone-500 mb-1">Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-stone-500 mb-1">Work Email *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-stone-500 mb-1">Password *</label>
                      <input
                        type="password"
                        name="password"
                        required
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono uppercase text-stone-500 mb-1">Contact Phone</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-stone-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 border border-stone-200 rounded-xl text-xs font-mono uppercase text-stone-600 hover:bg-stone-50 flex items-center gap-1.5"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-stone-900 text-white rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-stone-800 disabled:opacity-50 flex items-center gap-2 shadow-sm transition-all"
                >
                  {submitting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Provisioning Brand Website...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} className="text-amber-400" />
                      <span>Launch Brand Website Now</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Live Interactive Brand Preview Card (Right) */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-mono uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Palette size={13} />
              <span>Live Website Preview</span>
            </span>
            <span className="text-[10px] font-mono text-stone-400">
              Updates in real time
            </span>
          </div>

          {/* Mini Device Mockup */}
          <div className="bg-stone-900 p-2.5 rounded-2xl shadow-xl">
            <div className="flex items-center gap-1.5 px-3 py-1.5 mb-2 bg-stone-800 rounded-xl text-[10px] font-mono text-stone-400">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              <span className="w-2 h-2 rounded-full bg-yellow-500 inline-block" />
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              <span className="ml-2 text-stone-300 truncate">
                https://{formData.slug || "mybrand"}.smartstay.com
              </span>
            </div>

            {/* Simulated Website Body */}
            <div
              className="rounded-xl overflow-hidden text-stone-900 text-left transition-colors duration-300"
              style={{ backgroundColor: formData.backgroundColor }}
            >
              {/* Mini Brand Header */}
              <div className="px-4 py-3 bg-white/95 border-b border-stone-200/70 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-md flex items-center justify-center text-white font-bold text-[10px]"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    {(formData.name || "SS").substring(0, 2).toUpperCase()}
                  </div>
                  <span
                    className={`text-xs font-semibold ${
                      formData.fontFamily === "sans" ? "font-sans" : "font-serif"
                    }`}
                  >
                    {formData.name || "Brand Name"}
                  </span>
                </div>
                <div
                  className="px-2 py-1 rounded text-[9px] font-mono text-white"
                  style={{ backgroundColor: formData.primaryColor }}
                >
                  Reserve
                </div>
              </div>

              {/* Mini Hero */}
              <div
                className="relative px-4 py-8 text-center text-white bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.75)), url('${formData.heroBanner}')`,
                }}
              >
                <span
                  className="text-[9px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/20 inline-block mb-1.5"
                  style={{ color: formData.accentColor }}
                >
                  Official Hosted Site
                </span>
                <h4
                  className={`text-sm sm:text-base font-semibold leading-tight ${
                    formData.fontFamily === "sans" ? "font-sans" : "font-serif"
                  }`}
                >
                  {formData.bannerHeadline || `Welcome to ${formData.name || "Our Stays"}`}
                </h4>
                <p className="text-[10px] text-stone-200 max-w-xs mx-auto mt-1 line-clamp-1 font-light">
                  {formData.tagline || "Bespoke hospitality and premier residences"}
                </p>
              </div>

              {/* Mini Property Card */}
              <div className="p-3.5 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 block">
                  Featured Property
                </span>
                <div className="bg-white p-3 rounded-xl border border-stone-200/80 shadow-xs space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h5 className="text-xs font-semibold text-stone-900">
                        {formData.hotelName || "Flagship Resort & Spa"}
                      </h5>
                      <span className="text-[10px] text-stone-500 flex items-center gap-1">
                        <MapPin size={9} />
                        <span>{formData.city || "Jaipur"}</span>
                      </span>
                    </div>
                    <span className="text-xs font-bold font-sans text-stone-900">
                      {formatCurrency(formData.pricePerNight || 5500)}
                    </span>
                  </div>
                  <div
                    className="w-full py-1.5 rounded-lg text-center text-[10px] font-mono uppercase text-white font-medium"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    Book Direct
                  </div>
                </div>

                <div className="text-center pt-1 text-[9px] font-mono text-stone-400">
                  Powered by SmartStay SaaS Multi-Tenant Engine
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
