export interface MockWebsite {
  id: string;
  name: string;
  category: 'ecommerce' | 'medical' | 'saas';
  domain: string;
  title: string;
  tagline: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroImage: string;
  accentColor: string;
  navItems: string[];
  features: {
    title: string;
    description: string;
    image?: string;
    price?: string;
  }[];
}

export const MOCK_WEBSITES: MockWebsite[] = [
  {
    id: 'site-ecommerce-aura',
    name: 'AURA Maison Haute Horlogerie',
    category: 'ecommerce',
    domain: 'aura-maison.com',
    title: 'AURA | Haute Horlogerie & Fine Jewelry',
    tagline: 'Timeless Swiss Craftsmanship & Bespoke Horology',
    heroHeadline: 'Excellence In Every Complication.',
    heroSubheadline: 'Handcrafted in Le Brassus. Engineered with flying tourbillons, hand-polished titanium, and meteorite dials for collectors of the extraordinary.',
    heroImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&auto=format&fit=crop&q=80',
    accentColor: '#6366f1',
    navItems: ['Masterpieces', 'Grand Complications', 'High Jewelry', 'Maison Salons', 'VIP Concierge'],
    features: [
      {
        title: 'Grand Complication Tourbillon',
        description: 'Manual winding caliber, 72-hour power reserve, hand-chamfered bridges, skeletonized sapphire crystal.',
        price: '$24,500 USD',
        image: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80',
      },
      {
        title: 'Royal Chronograph Titanium',
        description: 'Grade 5 aerospace titanium, flyback chronograph, ceramic bezel, waterproof to 100 meters.',
        price: '$14,200 USD',
        image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
      },
      {
        title: 'Diamond Pavé Eclipse Ring',
        description: '18K White Gold, 3.4 carats of VVS1 brilliant-cut diamonds, handcrafted in our Place Vendôme atelier.',
        price: '$9,800 USD',
        image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'site-clinic-apex',
    name: 'Apex Longevity & Aesthetics',
    category: 'medical',
    domain: 'apexlongevity.clinic',
    title: 'Apex Institute | Cellular Longevity & Aesthetic Medicine',
    tagline: 'Precision Epigenetics & Advanced Rejuvenation',
    heroHeadline: 'Redefining Human Healthspan & Aesthetics.',
    heroSubheadline: 'Pioneering biological age deceleration, whole-genome screening, and regenerative dermatology led by Harvard-trained physicians in Beverly Hills and Zurich.',
    heroImage: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&auto=format&fit=crop&q=80',
    accentColor: '#059669',
    navItems: ['Biomarker Diagnostics', 'Cellular Therapies', 'Aesthetics', 'Our Faculty', 'Private Consultations'],
    features: [
      {
        title: 'Multi-Omics Longevity Screen',
        description: 'Comprehensive whole-genome sequencing, epigenetic biological age computation, and cardiovascular risk stratification.',
        price: '$1,850 / Protocol',
        image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80',
      },
      {
        title: 'Hyperbaric Oxygenation & Cryo',
        description: 'High-pressure hyperbaric chambers stimulating telomerase expression, cellular repair, and mitochondrial bio-energetics.',
        price: '$450 / Session',
        image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600&auto=format&fit=crop&q=80',
      },
      {
        title: 'Picosecond Aesthetic Rejuvenation',
        description: 'Non-ablative fractional laser therapy stimulating deep collagen matrices with zero social downtime.',
        price: '$1,200 / Treatment',
        image: 'https://images.unsplash.com/photo-1512290900672-1f4864455018?w=600&auto=format&fit=crop&q=80',
      },
    ],
  },
  {
    id: 'site-saas-nexus',
    name: 'Nexus Cloud Infrastructure',
    category: 'saas',
    domain: 'nexuscloud.io',
    title: 'Nexus Cloud | Next-Gen Distributed Edge Platform',
    tagline: 'Zero-Latency Serverless & Real-Time Event Streams',
    heroHeadline: 'Ship Distributed Cloud Pipelines In Seconds.',
    heroSubheadline: 'Sub-millisecond global database replicas, automated Kubernetes scaling, and instant serverless compute with enterprise SOC2 Type II compliance built-in.',
    heroImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80',
    accentColor: '#8b5cf6',
    navItems: ['Architecture', 'Edge Compute', 'Pricing', 'Documentation', 'Enterprise'],
    features: [
      {
        title: 'Edge Serverless Functions',
        description: 'Deploy code across 300+ global edge locations with <5ms cold starts and automatic DDoS shield.',
        price: 'Included in Pro ($49/mo)',
        image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
      },
      {
        title: 'Zero-Egress Dedicated VPC Peering',
        description: 'Direct high-bandwidth tunnel connecting your AWS, GCP, or Azure clusters securely.',
        price: 'Enterprise Scale',
        image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
      },
      {
        title: 'Sub-Millisecond Vector Database',
        description: 'Ultra-fast semantic search and indexing for LLM context retrieval and AI embeddings.',
        price: '$0.0001 / 1K queries',
        image: 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=600&auto=format&fit=crop&q=80',
      },
    ],
  },
];
