export interface NavItem {
  label: string;
  href: string;
  number: string;
}

export const siteConfig = {
  name: "Freska",
  tagline: "The Living Rhythm of Last-Mile Delivery",
  description: "A human-first delivery partner platform built for field ergonomics, intelligent dispatch, and daily earnings reconciliation.",
  url: "https://freska.delivery",
  partnerEmail: "partners@freska.delivery",
  supportEmail: "support@freska.delivery",
  
  // App download configuration slots (verified paths or waitlist trigger)
  downloads: {
    androidDirectApk: "/downloads/freska-rider-v1.0.apk",
    googlePlayStoreUrl: "https://play.google.com/store/apps/details?id=delivery.freska.partner",
    iosWaitlistUrl: "#download"
  },

  navItems: [
    { label: "Overview", href: "#hero", number: "01" },
    { label: "Philosophy", href: "#story", number: "02" },
    { label: "Platform", href: "#platform", number: "03" },
    { label: "The Four Chapters", href: "#chapters", number: "04" },
    { label: "Partner Access", href: "#download", number: "05" }
  ] as NavItem[]
};
