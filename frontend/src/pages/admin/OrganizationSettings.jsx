import { useState, useEffect } from "react";
import { Link } from "react-router";
import organizationService from "../../services/organizationService";
import {
  Building2,
  Globe,
  Palette,
  Sparkles,
  ExternalLink,
  Save,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  QrCode,
  MapPin,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

const OrganizationSettings = () => {
  const [organization, setOrganization] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("branding");

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    description: "",
    customDomain: "",
    primaryColor: "#14171F",
    accentColor: "#8B6B4C",
    backgroundColor: "#FBF9F5",
    textColor: "#1C1917",
    fontFamily: "serif",
    logo: "",
    heroBanner: "",
    bannerHeadline: "",
    bannerSubheadline: "",
    upiVpa: "",
    merchantName: "",
  });

  const fetchMyOrg = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await organizationService.getMyOrganization();
      const org = res.data || res;
      setOrganization(org);

      setFormData({
        name: org.name || "",
        tagline: org.tagline || "",
        description: org.description || "",
        customDomain: org.customDomain || "",
        primaryColor: org.branding?.primaryColor || "#14171F",
        accentColor: org.branding?.accentColor || "#8B6B4C",
        backgroundColor: org.branding?.backgroundColor || "#FBF9F5",
        textColor: org.branding?.textColor || "#1C1917",
        fontFamily: org.branding?.fontFamily || "serif",
        logo: org.branding?.logo || "",
        heroBanner: org.branding?.heroBanner || "",
        bannerHeadline: org.branding?.bannerHeadline || "",
        bannerSubheadline: org.branding?.bannerSubheadline || "",
        upiVpa: org.paymentSettings?.vpa || "",
        merchantName: org.paymentSettings?.merchantName || "",
      });
    } catch (err) {
      console.error("Error loading organization:", err);
      setError(err.message || "Failed to load organization settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrg();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!organization?._id) return;

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const payload = {
        name: formData.name,
        tagline: formData.tagline,
        description: formData.description,
        customDomain: formData.customDomain,
        branding: {
          primaryColor: formData.primaryColor,
          accentColor: formData.accentColor,
          backgroundColor: formData.backgroundColor,
          textColor: formData.textColor,
          fontFamily: formData.fontFamily,
          logo: formData.logo,
          heroBanner: formData.heroBanner,
          bannerHeadline: formData.bannerHeadline,
          bannerSubheadline: formData.bannerSubheadline,
        },
        paymentSettings: {
          vpa: formData.upiVpa,
          merchantName: formData.merchantName,
        },
      };

      const res = await organizationService.updateOrganization(organization._id, payload);
      setOrganization(res.data || res);
      setSuccess("Brand configuration and hosted website updated successfully!");
    } catch (err) {
      console.error("Update failed:", err);
      setError(err.message || "Failed to update organization");
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-4">
        <div className="w-8 h-8 border-2 border-stone-800 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="font-mono text-xs uppercase tracking-widest text-stone-500">
          Loading Organization Console...
        </p>
      </div>
    );
  }

  // Not yet onboarded as an organization
  if (!organization) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-16 h-16 bg-stone-100 rounded-3xl flex items-center justify-center mx-auto text-stone-700">
          <Building2 size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="font-serif text-3xl text-stone-900">No Hospitality Brand Connected</h2>
          <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
            Your admin account is not currently linked to a multi-tenant organization. You can onboard your brand in minutes to get your own hosted website.
          </p>
        </div>
        <div>
          <Link
            to="/onboard"
            className="inline-flex items-center gap-2 px-6 py-3 bg-stone-900 text-white rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-stone-800 transition-colors"
          >
            <Sparkles size={14} className="text-amber-400" />
            <span>Launch Brand Onboarding Wizard</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="font-serif text-2xl sm:text-3xl text-stone-900 font-semibold">
              {organization.name}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono uppercase tracking-wider font-semibold">
              Active SaaS Brand
            </span>
          </div>
          <p className="text-xs text-stone-500 font-mono">
            Subdomain: <strong className="text-stone-800">{organization.slug}.smartstay.com</strong> · Hosted Path: <strong className="text-stone-800">/portal/{organization.slug}</strong>
          </p>
        </div>

        <Link
          to={`/portal/${organization.slug}`}
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider text-white shadow-xs transition-transform active:scale-95 self-start sm:self-auto"
          style={{ backgroundColor: formData.primaryColor || "#14171F" }}
        >
          <Globe size={14} />
          <span>View Live Hosted Site</span>
          <ExternalLink size={13} />
        </Link>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center gap-2">
          <AlertCircle size={16} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 text-xs font-mono uppercase tracking-wider">
        {[
          { id: "branding", label: "Brand Studio & Colors" },
          { id: "domains", label: "Domains & DNS" },
          { id: "settlement", label: "YouPI Settlement" },
          { id: "portfolio", label: "Properties Portfolio" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 px-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-stone-900 text-stone-900 font-bold"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* TAB 1: Brand Studio */}
        {activeTab === "branding" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6">
              <div className="space-y-1 pb-3 border-b border-stone-100">
                <h3 className="font-serif text-xl text-stone-900 font-semibold">Visual Identity & Styling</h3>
                <p className="text-xs text-stone-500">Edit the color scheme, fonts, and banner for your hosted website.</p>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1.5">
                  Brand Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1.5">
                  Brand Tagline
                </label>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>

              {/* Color pickers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-stone-500 mb-1">Primary Color</label>
                  <div className="flex items-center gap-2 p-1.5 border border-stone-200 rounded-xl bg-stone-50">
                    <input
                      type="color"
                      name="primaryColor"
                      value={formData.primaryColor}
                      onChange={handleChange}
                      className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent p-0"
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
                  <label className="block text-[10px] font-mono uppercase text-stone-500 mb-1">Accent Color</label>
                  <div className="flex items-center gap-2 p-1.5 border border-stone-200 rounded-xl bg-stone-50">
                    <input
                      type="color"
                      name="accentColor"
                      value={formData.accentColor}
                      onChange={handleChange}
                      className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent p-0"
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
                  <label className="block text-[10px] font-mono uppercase text-stone-500 mb-1">Background</label>
                  <div className="flex items-center gap-2 p-1.5 border border-stone-200 rounded-xl bg-stone-50">
                    <input
                      type="color"
                      name="backgroundColor"
                      value={formData.backgroundColor}
                      onChange={handleChange}
                      className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent p-0"
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
                <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1.5">
                  Typography Persona
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "serif", label: "Editorial Serif" },
                    { id: "sans", label: "Clean Sans" },
                    { id: "mono", label: "Modern Mono" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, fontFamily: t.id }))}
                      className={`p-2.5 rounded-xl border text-center text-xs transition-all ${
                        formData.fontFamily === t.id
                          ? "border-stone-900 bg-stone-50 font-bold"
                          : "border-stone-200 text-stone-600 hover:border-stone-300"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1.5">
                  Hero Cover Photography URL
                </label>
                <input
                  type="url"
                  name="heroBanner"
                  value={formData.heroBanner}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1.5">
                  Brand Narrative / Story
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="lg:col-span-5 sticky top-24 space-y-3">
              <span className="text-xs font-mono uppercase tracking-wider text-stone-500 block">
                Live Preview
              </span>
              <div
                className="rounded-2xl overflow-hidden border border-stone-300 shadow-md p-4 text-left space-y-4"
                style={{ backgroundColor: formData.backgroundColor }}
              >
                <div className="flex items-center justify-between border-b pb-3 border-stone-200">
                  <span
                    className={`text-sm font-bold ${
                      formData.fontFamily === "sans" ? "font-sans" : "font-serif"
                    }`}
                  >
                    {formData.name}
                  </span>
                  <div
                    className="px-2.5 py-1 rounded text-[10px] font-mono text-white"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    Reserve Stay
                  </div>
                </div>

                <div
                  className="rounded-xl p-4 text-white bg-cover bg-center text-center space-y-1"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.75)), url('${formData.heroBanner}')`,
                  }}
                >
                  <h4 className="font-serif text-sm font-semibold">{formData.name}</h4>
                  <p className="text-[10px] text-stone-200 line-clamp-1">{formData.tagline}</p>
                </div>

                <div className="p-3 bg-white rounded-xl border border-stone-200/80 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-stone-900">Flagship Residence</span>
                    <span className="font-bold text-stone-900 font-sans">₹5,500/nt</span>
                  </div>
                  <div
                    className="w-full py-1.5 text-center text-white text-[10px] font-mono uppercase rounded-lg"
                    style={{ backgroundColor: formData.primaryColor }}
                  >
                    Direct Booking
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Domains & DNS */}
        {activeTab === "domains" && (
          <div className="max-w-2xl bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6">
            <div className="space-y-1 pb-3 border-b border-stone-100">
              <h3 className="font-serif text-xl text-stone-900 font-semibold">Domain & Routing Configuration</h3>
              <p className="text-xs text-stone-500">Configure your custom vanity domain or point an existing CNAME.</p>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-mono uppercase tracking-wider text-stone-600">
                Current Active Subdomain
              </label>
              <div className="flex items-center justify-between p-3.5 bg-stone-50 rounded-xl border border-stone-200 text-xs font-mono text-stone-900">
                <span>https://{organization.slug}.smartstay.com</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(`https://${organization.slug}.smartstay.com`)}
                  className="text-stone-500 hover:text-stone-900"
                >
                  {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-mono uppercase tracking-wider text-stone-600">
                Custom Domain (e.g. book.yourbrand.com)
              </label>
              <input
                type="text"
                name="customDomain"
                placeholder="book.mybrand.com"
                value={formData.customDomain}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-mono focus:ring-1 focus:ring-stone-900 focus:outline-none"
              />
            </div>

            {/* DNS Instructions */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
              <span className="font-mono text-[11px] font-bold text-stone-700 uppercase">
                DNS Configuration Instructions
              </span>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                To point your custom domain, add a <strong>CNAME</strong> record in your domain registrar (GoDaddy, Cloudflare, Namecheap):
              </p>
              <div className="p-2.5 bg-white rounded-lg border border-stone-200 font-mono text-[11px] text-stone-900">
                CNAME &nbsp; | &nbsp; book &nbsp; | &nbsp; sites.smartstay.com
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: YouPI Settlement */}
        {activeTab === "settlement" && (
          <div className="max-w-2xl bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6">
            <div className="space-y-1 pb-3 border-b border-stone-100">
              <h3 className="font-serif text-xl text-stone-900 font-semibold">Sovereign YouPI Settlement</h3>
              <p className="text-xs text-stone-500">Configure where guest booking payments are settled directly via UPI.</p>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1.5">
                Corporate UPI VPA (ID)
              </label>
              <input
                type="text"
                name="upiVpa"
                placeholder={`${organization.slug}@upi`}
                value={formData.upiVpa}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs font-mono focus:ring-1 focus:ring-stone-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-stone-600 mb-1.5">
                Merchant Business Name
              </label>
              <input
                type="text"
                name="merchantName"
                value={formData.merchantName}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs focus:ring-1 focus:ring-stone-900 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* TAB 4: Portfolio Properties */}
        {activeTab === "portfolio" && (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-serif text-xl text-stone-900 font-semibold">Linked Hotel Properties</h3>
                <p className="text-xs text-stone-500">Hotels published on your hosted website and the global marketplace.</p>
              </div>
              <Link
                to="/admin/hotels"
                className="px-3.5 py-2 bg-stone-900 text-white rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-stone-800 transition-colors"
              >
                + Add Property
              </Link>
            </div>

            {(!organization.hotels || organization.hotels.length === 0) ? (
              <p className="text-xs text-stone-500 py-6 text-center">No properties currently linked.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {organization.hotels.map((hotel) => (
                  <div
                    key={hotel._id}
                    className="p-4 rounded-2xl border border-stone-200 bg-stone-50 flex items-center justify-between"
                  >
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm text-stone-900">{hotel.name}</h4>
                      <p className="text-xs text-stone-500 flex items-center gap-1 font-mono">
                        <MapPin size={11} />
                        <span>{hotel.city}</span>
                        <span>·</span>
                        <span>{hotel.rooms?.length || 0} room tiers</span>
                      </p>
                    </div>

                    <Link
                      to={`/admin/hotels/${hotel._id}`}
                      className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono uppercase text-stone-700 hover:bg-stone-100 transition-colors"
                    >
                      Manage
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-stone-900 text-white rounded-xl text-xs font-mono uppercase tracking-wider hover:bg-stone-800 disabled:opacity-50 flex items-center gap-2 shadow-xs transition-all active:scale-95"
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Save Brand Configuration</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrganizationSettings;
