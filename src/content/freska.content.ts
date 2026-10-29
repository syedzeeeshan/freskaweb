export interface PlatformFeature {
  id: string;
  title: string;
  tagline: string;
  description: string;
  metricLabel: string;
  metricDetail: string;
}

export interface RomanChapter {
  numeral: string;
  id: string;
  subtitle: string;
  title: string;
  description: string;
  verifiedDetails: string[];
}

export const freskaContent = {
  hero: {
    tag: "Freska Platform · Last-Mile Logistics",
    headline: "The Living Rhythm of Last-Mile Delivery.",
    subhead: "Where field endurance meets considerate engineering. Freska is a dedicated delivery platform designed to support riders with clear interfaces, upfront payout details, and reliable daily reconciliation.",
    primaryCta: "Download Partner App",
    secondaryCta: "Explore Platform",
    statusBadge: "Operational Architecture Active"
  },
  
  story: {
    tag: "Philosophy & Dignity",
    headline: "Engineered for the Field. Designed for Human Dignity.",
    lead: "Every delivery carries more than goods—it represents a dependable commitment between independent merchants and their local community.",
    narrative: [
      "Traditional delivery software frequently forces couriers to interpret dense screens under direct midday sunlight, decipher ambiguous payout structures, and struggle with complex end-of-day cash settlement.",
      "Freska approaches field logistics from first principles. By focusing on glanceable high-contrast interfaces, deliberate one-handed thumb interactions, and complete order clarity before assignment acceptance, we build tools that genuinely assist riders throughout their shift."
    ],
    principles: [
      {
        title: "Field-First Contrast",
        desc: "High-contrast typography and deliberate visual hierarchy optimized for readability on the road."
      },
      {
        title: "Upfront Transparency",
        desc: "Estimated distances, vendor coordinates, and calculated payout amounts clearly visible before acceptance."
      },
      {
        title: "Clean Ledger Balance",
        desc: "Systematic cash-on-delivery tracking designed to simplify daily collection and reconciliation."
      }
    ]
  },

  platform: {
    tag: "Platform Pillars",
    headline: "A Purpose-Built Platform for Professional Couriers.",
    subhead: "Six core capabilities forming a dependable daily workflow for riders and merchant partners.",
    features: [
      {
        id: "auth-kyc",
        title: "Direct Onboarding & Identity",
        tagline: "Secure OTP access with structured KYC review",
        description: "Mobile number verification paired with structured KYC document uploads, emergency contact registration, and validated payout profiles.",
        metricLabel: "Verification",
        metricDetail: "Structured Review"
      },
      {
        id: "availability",
        title: "Availability Management",
        tagline: "Clear online and offline availability toggles",
        description: "Riders retain direct control over shift status with immediate availability toggles, keeping active hours aligned with personal schedules.",
        metricLabel: "Shift Control",
        metricDetail: "Rider-Led"
      },
      {
        id: "dispatch",
        title: "Transparent Order Acceptance",
        tagline: "Complete delivery parameters presented upfront",
        description: "Every dispatch card displays vendor pickup locations, customer delivery areas, estimated distance, and expected payout before acceptance.",
        metricLabel: "Order Details",
        metricDetail: "Full Visibility"
      },
      {
        id: "navigation",
        title: "Turn-by-Turn Field Guidance",
        tagline: "Vendor-to-customer routing with special instructions",
        description: "Integrated map routing with vendor parking directions, delivery notes, and instant SOS emergency reporting accessible in transit.",
        metricLabel: "Navigation",
        metricDetail: "Turn-by-Turn"
      },
      {
        id: "cod",
        title: "Cash-on-Delivery Reconciliation",
        tagline: "Track collected cash and settlement status accurately",
        description: "Comprehensive recording of cash collected at customer doorsteps, automated reconciliation ledgers, and clear deposit status tracking.",
        metricLabel: "Reconciliation",
        metricDetail: "Ledger-Backed"
      },
      {
        id: "earnings",
        title: "Transparent Earnings History",
        tagline: "Daily totals, weekly summaries, and payout tracking",
        description: "Clear breakdown of completed deliveries, applicable shift incentives, and chronological payout histories directly within the rider profile.",
        metricLabel: "Payout History",
        metricDetail: "Itemized"
      }
    ] as PlatformFeature[]
  },

  chapters: {
    tag: "The Four Shift Chapters",
    headline: "The Core Sequence of Every Shift.",
    subhead: "A continuous progression from onboarding through delivery fulfillment and daily settlement.",
    items: [
      {
        numeral: "I",
        id: "chapter-onboarding",
        subtitle: "The Foundation",
        title: "Onboarding & Rider Identity",
        description: "Rider onboarding begins with verified mobile authentication, verified documentation review, emergency contact setup, and bank account registration.",
        verifiedDetails: [
          "Phone number OTP verification",
          "Structured KYC & identity profile",
          "Designated emergency contacts",
          "Verified payout bank details"
        ]
      },
      {
        numeral: "II",
        id: "chapter-route",
        subtitle: "The Movement",
        title: "Dispatch & Field Navigation",
        description: "Orders are presented with clear pickup locations, estimated transit distances, and calculated payout estimates before accepting.",
        verifiedDetails: [
          "Vendor pickup coordinates & package details",
          "Calculated distance & upfront payout",
          "Rider acceptance controls",
          "Turn-by-turn vendor-to-customer route"
        ]
      },
      {
        numeral: "III",
        id: "chapter-handover",
        subtitle: "The Exchange",
        title: "Delivery Handover & COD",
        description: "Completing each delivery follows clear verification steps, customer delivery instructions, and transparent cash collection for COD orders.",
        verifiedDetails: [
          "Arrival confirmation at vendor and customer",
          "Customer delivery note guidance",
          "Cash-on-delivery tracking & recording",
          "Immediate emergency SOS assistance"
        ]
      },
      {
        numeral: "IV",
        id: "chapter-earnings",
        subtitle: "The Settlement",
        title: "Earnings Visibility & Payouts",
        description: "Daily summaries show completed trips, applicable incentives, and clear reconciliation records for all collected funds.",
        verifiedDetails: [
          "Daily and weekly completed delivery metrics",
          "Itemized earnings and incentive records",
          "Cash deposit and handover status",
          "Chronological payout archive"
        ]
      }
    ] as RomanChapter[]
  },

  download: {
    tag: "Partner Access & Downloads",
    headline: "Equip Your Transit.",
    subhead: "Download the Freska Delivery Partner application to join an organized last-mile logistics network built for clarity and safety.",
    androidButton: "Download Android APK (Direct)",
    playStoreButton: "Google Play Store",
    partnerTitle: "Merchant & Fleet Partners",
    partnerDesc: "Are you a local merchant, grocery collective, or fleet operator seeking reliable last-mile delivery? Reach our partner operations team directly.",
    partnerEmail: "partners@freska.delivery",
    footerCopyright: "© 2026 Freska Technologies. All rights reserved.",
    footerLinks: [
      { label: "Privacy Policy", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Rider Safety Protocol", href: "#" },
      { label: "Support", href: "mailto:support@freska.delivery" }
    ]
  }
};
