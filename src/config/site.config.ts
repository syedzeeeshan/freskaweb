export interface NavItem {
  label: string;
  href: string;
  number: string;
}

export const siteConfig = {
  name: "Freska",
  tagline: "The Living Rhythm of Fresh Meat & Seafood Delivery",
  description: "An immersive farm-to-door fresh meat and seafood delivery platform engineered with 0°C–4°C cold chain logistics, transparent rider dispatch, and daily earnings reconciliation.",
  url: "https://freska.delivery",
  partnerEmail: "partners@freska.delivery",
  supportEmail: "support@freska.delivery",
  
  downloads: {
    androidDirectApk: "/downloads/freska-rider-v1.0.apk",
    googlePlayStoreUrl: "https://play.google.com/store/apps/details?id=delivery.freska.partner",
    iosWaitlistUrl: "#download"
  },

  navItems: [
    { label: "Overview", href: "#hero", number: "01" },
    { label: "Philosophy & Dignity", href: "#story", number: "02" },
    { label: "Platform Architecture", href: "#platform", number: "03" },
    { label: "The Shift Chapters", href: "#chapters", number: "04" },
    { label: "Partner App Access", href: "#download", number: "05" }
  ] as NavItem[]
};
