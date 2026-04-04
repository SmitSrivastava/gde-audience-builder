
export interface SubAudience {
  id: string;
  name: string;
  size: string;
  sizeNum: number;
  enrichmentStatus: 'Ready' | 'Available' | 'Pending';
  activationPlatforms: string[];
  status: 'Active' | 'Processing';
  created: string;
  enriched: boolean;
  signals: string[];
}

export interface CohortCategory {
  id: string;
  title: string;
  subtitle: string;
  totalSize: string;
  subAudiences: SubAudience[];
}

export const cohortCategories: CohortCategory[] = [
  {
    id: 'ott-maturity',
    title: 'OTT Maturity Cohorts',
    subtitle: 'Identify users based on subscription behavior and OTT adoption stage',
    totalSize: '110M',
    subAudiences: [
      { id: 'single-ott', name: 'Single OTT Users', size: '~28M', sizeNum: 28000000, enrichmentStatus: 'Ready', activationPlatforms: ['Meta', 'Google', 'DV360'], status: 'Active', created: '2024-03-15', enriched: true, signals: ['OTT subscription data', 'App usage', 'Device intelligence'] },
      { id: 'multi-ott', name: 'Multi-OTT Power Users', size: '~42M', sizeNum: 42000000, enrichmentStatus: 'Ready', activationPlatforms: ['Meta', 'Google', 'DV360', 'YouTube'], status: 'Active', created: '2024-03-14', enriched: true, signals: ['Multi-platform OTT data', 'Content affinity', 'Engagement depth'] },
      { id: 'ott-trial', name: 'OTT Trial Users', size: '~18M', sizeNum: 18000000, enrichmentStatus: 'Available', activationPlatforms: ['Meta', 'Google'], status: 'Active', created: '2024-03-12', enriched: false, signals: ['Trial behavior', 'Churn signals', 'Re-engagement potential'] },
      { id: 'cord-cutters', name: 'Cord Cutters', size: '~22M', sizeNum: 22000000, enrichmentStatus: 'Ready', activationPlatforms: ['Meta', 'DV360', 'YouTube'], status: 'Active', created: '2024-03-10', enriched: true, signals: ['TV viewership decline', 'OTT migration', 'Content preference shift'] },
    ]
  },
  {
    id: 'premium-ott',
    title: 'Premium OTT Users',
    subtitle: 'Segment users by affluence signals and premium OTT consumption patterns',
    totalSize: '74M',
    subAudiences: [
      { id: 'premium-metro', name: 'Premium OTT Users (Metro + High Income)', size: '~24M', sizeNum: 24000000, enrichmentStatus: 'Ready', activationPlatforms: ['Meta', 'Google', 'DV360'], status: 'Active', created: '2024-03-15', enriched: true, signals: ['Income proxy', 'Metro geo', 'Premium device', 'OTT spend'] },
      { id: 'emerging-premium', name: 'Emerging Premium OTT Users', size: '~31M', sizeNum: 31000000, enrichmentStatus: 'Ready', activationPlatforms: ['Meta', 'Google', 'YouTube'], status: 'Active', created: '2024-03-13', enriched: true, signals: ['Rising affluence', 'Tier-2 metro', 'OTT adoption curve'] },
      { id: 'affluent-multi', name: 'Affluent Multi-OTT Users', size: '~19M', sizeNum: 19000000, enrichmentStatus: 'Available', activationPlatforms: ['Meta', 'DV360'], status: 'Active', created: '2024-03-11', enriched: false, signals: ['High disposable income', 'Multi-subscription', 'Premium content affinity'] },
    ]
  },
  {
    id: 'viewing-affinity',
    title: 'Viewing Affinity Intelligence',
    subtitle: 'Map content preferences and genre affinities for precision targeting',
    totalSize: '121M',
    subAudiences: [
      { id: 'drama-enthusiasts', name: 'Drama Enthusiasts', size: '~46M', sizeNum: 46000000, enrichmentStatus: 'Ready', activationPlatforms: ['Meta', 'Google', 'DV360', 'YouTube'], status: 'Active', created: '2024-03-15', enriched: true, signals: ['Genre affinity', 'Watch time depth', 'Content completion rate'] },
      { id: 'biz-content', name: 'Business/Corporate Content Viewers', size: '~18M', sizeNum: 18000000, enrichmentStatus: 'Ready', activationPlatforms: ['Meta', 'Google', 'DV360'], status: 'Active', created: '2024-03-14', enriched: true, signals: ['Business content affinity', 'Professional profile', 'LinkedIn-like signals'] },
      { id: 'doc-viewers', name: 'Documentary Viewers', size: '~22M', sizeNum: 22000000, enrichmentStatus: 'Available', activationPlatforms: ['Meta', 'YouTube'], status: 'Active', created: '2024-03-12', enriched: false, signals: ['Documentary engagement', 'Knowledge seekers', 'Long-form affinity'] },
      { id: 'sports-ott', name: 'Sports + OTT Hybrid Viewers', size: '~35M', sizeNum: 35000000, enrichmentStatus: 'Ready', activationPlatforms: ['Meta', 'Google', 'DV360', 'YouTube'], status: 'Active', created: '2024-03-10', enriched: true, signals: ['Sports viewership', 'Live streaming', 'Multi-platform engagement'] },
    ]
  },
  {
    id: 'platform-behavior',
    title: 'Platform Behavior & Attention Source',
    subtitle: 'Understand cross-platform engagement and attention allocation patterns',
    totalSize: '116M',
    subAudiences: [
      { id: 'mobile-first', name: 'Mobile-first OTT Users', size: '~52M', sizeNum: 52000000, enrichmentStatus: 'Ready', activationPlatforms: ['Meta', 'Google', 'YouTube'], status: 'Active', created: '2024-03-15', enriched: true, signals: ['Mobile usage dominance', 'App engagement', 'Small screen preference'] },
      { id: 'ctv-dominant', name: 'CTV Dominant Users', size: '~26M', sizeNum: 26000000, enrichmentStatus: 'Available', activationPlatforms: ['DV360', 'YouTube'], status: 'Active', created: '2024-03-13', enriched: false, signals: ['CTV device data', 'Large screen preference', 'Household viewing'] },
      { id: 'multi-screen', name: 'Multi-screen Users', size: '~38M', sizeNum: 38000000, enrichmentStatus: 'Ready', activationPlatforms: ['Meta', 'Google', 'DV360'], status: 'Active', created: '2024-03-11', enriched: true, signals: ['Cross-device behavior', 'Session continuity', 'Device switching patterns'] },
    ]
  },
  {
    id: 'life-stage',
    title: 'Life Stage & Household Context',
    subtitle: 'Target based on household composition, life events, and family dynamics',
    totalSize: '158M',
    subAudiences: [
      { id: 'young-pros', name: 'Young Professionals', size: '~41M', sizeNum: 41000000, enrichmentStatus: 'Ready', activationPlatforms: ['Meta', 'Google', 'YouTube'], status: 'Active', created: '2024-03-15', enriched: true, signals: ['Age 22-30', 'Urban metro', 'Career-oriented content'] },
      { id: 'family-hh', name: 'Family Households', size: '~55M', sizeNum: 55000000, enrichmentStatus: 'Ready', activationPlatforms: ['Meta', 'Google', 'DV360', 'YouTube'], status: 'Active', created: '2024-03-14', enriched: true, signals: ['Family composition', 'Kids content consumption', 'Household size'] },
      { id: 'biz-family', name: 'Business Family Households', size: '~14M', sizeNum: 14000000, enrichmentStatus: 'Ready', activationPlatforms: ['Meta', 'DV360'], status: 'Active', created: '2024-03-12', enriched: true, signals: ['Business owners', 'High net worth', 'Family-centric viewing'] },
      { id: 'students', name: 'Students', size: '~48M', sizeNum: 48000000, enrichmentStatus: 'Available', activationPlatforms: ['Meta', 'YouTube'], status: 'Active', created: '2024-03-10', enriched: false, signals: ['Student demographics', 'Budget-conscious', 'Mobile-heavy usage'] },
    ]
  }
];

// Flatten all sub-audiences for use in segmentation/enrichment/activation tables
export const allAudiences: SubAudience[] = cohortCategories.flatMap(c => c.subAudiences);

// Pre-built query configs for each audience
export const audienceQueryConfigs: Record<string, {
  dataPartners: string[];
  conditions: { field: string; operator: string; value: string }[];
  sql: string;
  insights: {
    why: string;
    estimatedSize: string;
    affluenceIndex: string;
    ottEngagement: string;
    conversionPotential: string;
    signals: string[];
    platforms: string[];
  };
}> = {
  'premium-metro': {
    dataPartners: ['Telco Data Provider', 'OTT App Analytics', 'Device Intelligence Corp', 'Financial Proxy Signals'],
    conditions: [
      { field: 'income_level', operator: 'IN', value: 'Elite, Affluent' },
      { field: 'city', operator: 'IN', value: 'Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Pune' },
      { field: 'ott_apps_installed', operator: '>', value: '1' },
      { field: 'device_type', operator: 'IN', value: 'Premium Smartphone, CTV' },
    ],
    sql: `SELECT user_id, demographic_segment, ott_profile, device_info\nFROM telco_data t\nJOIN ott_analytics o ON t.device_id = o.device_id\nJOIN device_intel d ON t.device_id = d.device_id\nWHERE t.income_segment IN ('Elite', 'Affluent')\n  AND t.city IN ('Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune')\n  AND o.ott_apps_count > 1\n  AND d.device_tier IN ('Premium Smartphone', 'CTV')`,
    insights: {
      why: 'Premium OTT users in metros represent the highest-value acquisition cohort for Netflix India — high disposable income, multi-OTT behavior, and premium device ownership indicate strong conversion potential.',
      estimatedSize: '~24M',
      affluenceIndex: 'High',
      ottEngagement: 'High',
      conversionPotential: 'Very High',
      signals: ['Telco income proxy', 'OTT app usage', 'Device intelligence', 'Geo-metro signals'],
      platforms: ['Meta Ads', 'Google Ads', 'DV360', 'YouTube']
    }
  },
  'multi-ott': {
    dataPartners: ['OTT App Analytics', 'Content Affinity Engine', 'Engagement Depth Platform'],
    conditions: [
      { field: 'ott_subscriptions', operator: '>=', value: '3' },
      { field: 'monthly_watch_hours', operator: '>', value: '20' },
      { field: 'content_diversity_score', operator: '>', value: '0.7' },
    ],
    sql: `SELECT user_id, ott_subscriptions, watch_behavior, content_preferences\nFROM ott_analytics\nWHERE ott_subscription_count >= 3\n  AND monthly_watch_hours > 20\n  AND content_diversity_score > 0.7`,
    insights: {
      why: 'Multi-OTT power users are content-hungry viewers who subscribe to 3+ platforms. They represent the most engaged OTT audience in India and are prime targets for Netflix premium tier conversion.',
      estimatedSize: '~42M',
      affluenceIndex: 'Medium-High',
      ottEngagement: 'Very High',
      conversionPotential: 'High',
      signals: ['Multi-platform subscription data', 'Watch hour depth', 'Content diversity index'],
      platforms: ['Meta Ads', 'Google Ads', 'DV360', 'YouTube']
    }
  },
  'biz-content': {
    dataPartners: ['OTT App Analytics', 'Professional Profile Engine', 'Content Affinity Platform'],
    conditions: [
      { field: 'content_genre', operator: 'IN', value: 'Business, Corporate Drama, Finance' },
      { field: 'profession', operator: 'IN', value: 'Entrepreneurs, Consultants, Finance, MBA, Business Family' },
      { field: 'age', operator: 'BETWEEN', value: '25-45' },
      { field: 'affluence_tier', operator: 'IN', value: 'Top 30%' },
      { field: 'geo', operator: 'IN', value: 'Metro cities' },
    ],
    sql: `SELECT user_id, professional_profile, content_affinity, device_info\nFROM ott_analytics o\nJOIN professional_data p ON o.user_id = p.user_id\nWHERE o.primary_genre IN ('Business', 'Corporate Drama', 'Finance')\n  AND p.profession IN ('Entrepreneur', 'Consultant', 'Finance Professional', 'MBA')\n  AND p.age BETWEEN 25 AND 45\n  AND p.affluence_percentile <= 30\n  AND p.city_tier = 'Metro'`,
    insights: {
      why: 'Business content viewers map directly to Netflix originals like "Bad Boy Billionaires" and "The Big Bull". These high-affluence professionals are ideal for premium tier acquisition with business drama content hooks.',
      estimatedSize: '~18M',
      affluenceIndex: 'Very High',
      ottEngagement: 'High',
      conversionPotential: 'Very High',
      signals: ['Business content affinity', 'Professional demographics', 'Affluence signals', 'Metro geo-targeting'],
      platforms: ['Meta Ads', 'Google Ads', 'DV360']
    }
  }
};

// Default config for audiences without specific configs
export const defaultQueryConfig = {
  dataPartners: ['Telco Data Provider', 'OTT App Analytics', 'Device Intelligence Corp'],
  conditions: [
    { field: 'city_tier', operator: 'IN', value: 'Metro, Tier-1' },
    { field: 'ott_active', operator: '=', value: 'true' },
  ],
  sql: `SELECT user_id, demographic_segment, ott_profile\nFROM audience_data\nWHERE city_tier IN ('Metro', 'Tier-1')\n  AND ott_active = true`,
  insights: {
    why: 'This audience segment captures a high-value cohort in India\'s rapidly growing OTT market, ideal for Netflix subscriber acquisition and engagement campaigns.',
    estimatedSize: '~15M',
    affluenceIndex: 'Medium-High',
    ottEngagement: 'High',
    conversionPotential: 'High',
    signals: ['OTT subscription data', 'Device intelligence', 'Geo-demographic signals'],
    platforms: ['Meta Ads', 'Google Ads', 'DV360', 'YouTube']
  }
};
