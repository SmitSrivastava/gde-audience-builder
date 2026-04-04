
export interface SubAudience {
  id: string;
  name: string;
  size: string;
  sizeNum: number;
  activationPlatforms: string[];
  status: 'Active' | 'Processing';
  created: string;
  attributes: string[];
  // Store query rules for edit persistence
  queryRules?: { field: string; operator: string; value: string; logic: 'AND' | 'OR' }[];
}

export interface CohortCategory {
  id: string;
  title: string;
  subtitle: string;
  subAudiences: SubAudience[];
}

const calcTotal = (subs: SubAudience[]) => {
  const raw = subs.reduce((sum, s) => sum + s.sizeNum, 0);
  const deduped = Math.round(raw * 0.55);
  return `${Math.round(deduped / 1000000)}M`;
};

const ottMaturitySubs: SubAudience[] = [
  { id: 'single-ott', name: 'Single OTT Users', size: '~28M', sizeNum: 28000000, activationPlatforms: ['Meta', 'Google', 'DV360'], status: 'Active', created: '2026-03-15', attributes: ['OTT Apps Installed', 'OTT Engagement Level', 'Device Type'] },
  { id: 'multi-ott', name: 'Multi-OTT Power Users', size: '~42M', sizeNum: 42000000, activationPlatforms: ['Meta', 'Google', 'DV360', 'YouTube'], status: 'Active', created: '2026-03-14', attributes: ['OTT Apps Installed', 'OTT Engagement Level', 'Preferred OTT Platform', 'Device Type'] },
  { id: 'ott-trial', name: 'OTT Trial Users', size: '~18M', sizeNum: 18000000, activationPlatforms: ['Meta', 'Google'], status: 'Active', created: '2026-03-12', attributes: ['OTT Apps Installed', 'OTT Engagement Level', 'Preferred OTT Platform', 'Device Type'] },
  { id: 'cord-cutters', name: 'Cord Cutters', size: '~22M', sizeNum: 22000000, activationPlatforms: ['Meta', 'DV360', 'YouTube'], status: 'Active', created: '2026-03-10', attributes: ['OTT Engagement Level', 'Preferred OTT Platform', 'Device Type', 'Household Type'] },
];

const premiumOttSubs: SubAudience[] = [
  { id: 'premium-metro', name: 'Premium OTT Users (Metro + High Income)', size: '~24M', sizeNum: 24000000, activationPlatforms: ['Meta', 'Google', 'DV360'], status: 'Active', created: '2026-03-15', attributes: ['Income Level', 'City', 'OTT Apps Installed', 'Device Type'] },
  { id: 'emerging-premium', name: 'Emerging Premium OTT Users', size: '~31M', sizeNum: 31000000, activationPlatforms: ['Meta', 'Google', 'YouTube'], status: 'Active', created: '2026-03-13', attributes: ['Income Level', 'City', 'OTT Apps Installed', 'Device Type', 'Tier'] },
  { id: 'elite-multi-ott', name: 'Elite Multi-OTT Users', size: '~19M', sizeNum: 19000000, activationPlatforms: ['Meta', 'DV360'], status: 'Active', created: '2026-03-11', attributes: ['Income Level', 'OTT Apps Installed', 'OTT Engagement Level', 'Device Type'] },
];

const viewingAffinitySubs: SubAudience[] = [
  { id: 'drama-enthusiasts', name: 'Drama Enthusiasts', size: '~46M', sizeNum: 46000000, activationPlatforms: ['Meta', 'Google', 'DV360', 'YouTube'], status: 'Active', created: '2026-03-15', attributes: ['Genre Affinity', 'OTT Engagement Level', 'Preferred OTT Platform'] },
  { id: 'biz-content', name: 'Business & Corporate Drama Viewers', size: '~18M', sizeNum: 18000000, activationPlatforms: ['Meta', 'Google', 'DV360'], status: 'Active', created: '2026-03-14', attributes: ['Genre Affinity', 'Income Level', 'City', 'OTT Apps Installed', 'Profession'] },
  { id: 'family-drama', name: 'Family Drama Viewers', size: '~22M', sizeNum: 22000000, activationPlatforms: ['Meta', 'YouTube'], status: 'Active', created: '2026-03-12', attributes: ['Genre Affinity', 'Household Type', 'Family Structure', 'OTT Engagement Level'] },
  { id: 'sports-ott', name: 'Sports + OTT Hybrid Viewers', size: '~35M', sizeNum: 35000000, activationPlatforms: ['Meta', 'Google', 'DV360', 'YouTube'], status: 'Active', created: '2026-03-10', attributes: ['Genre Affinity', 'OTT Engagement Level', 'Preferred OTT Platform', 'Device Type'] },
];

const platformBehaviorSubs: SubAudience[] = [
  { id: 'mobile-first', name: 'Mobile-first OTT Users', size: '~52M', sizeNum: 52000000, activationPlatforms: ['Meta', 'Google', 'YouTube'], status: 'Active', created: '2026-03-15', attributes: ['Device Type', 'OTT Engagement Level', 'Preferred OTT Platform'] },
  { id: 'ctv-dominant', name: 'CTV Dominant Users', size: '~26M', sizeNum: 26000000, activationPlatforms: ['DV360', 'YouTube'], status: 'Active', created: '2026-03-13', attributes: ['Device Type', 'Household Type', 'OTT Engagement Level'] },
  { id: 'multi-screen', name: 'Multi-screen Users', size: '~38M', sizeNum: 38000000, activationPlatforms: ['Meta', 'Google', 'DV360'], status: 'Active', created: '2026-03-11', attributes: ['Device Type', 'Device Tier', 'OTT Engagement Level', 'Preferred OTT Platform'] },
];

const lifeStageSubs: SubAudience[] = [
  { id: 'young-pros', name: 'Young Professionals', size: '~41M', sizeNum: 41000000, activationPlatforms: ['Meta', 'Google', 'YouTube'], status: 'Active', created: '2026-03-15', attributes: ['Age', 'City', 'Income Level', 'Profession'] },
  { id: 'family-hh', name: 'Family Households', size: '~55M', sizeNum: 55000000, activationPlatforms: ['Meta', 'Google', 'DV360', 'YouTube'], status: 'Active', created: '2026-03-14', attributes: ['Household Type', 'Family Structure', 'OTT Engagement Level', 'Device Type'] },
  { id: 'biz-family', name: 'Business Family Households', size: '~14M', sizeNum: 14000000, activationPlatforms: ['Meta', 'DV360'], status: 'Active', created: '2026-03-12', attributes: ['Income Level', 'Profession', 'Household Type', 'Family Structure'] },
  { id: 'students', name: 'Students', size: '~48M', sizeNum: 48000000, activationPlatforms: ['Meta', 'YouTube'], status: 'Active', created: '2026-03-10', attributes: ['Age', 'City', 'Device Type', 'OTT Engagement Level'] },
];

export const cohortCategories: CohortCategory[] = [
  { id: 'ott-maturity', title: 'OTT Maturity Cohorts', subtitle: 'Identify users based on subscription behavior and OTT adoption stage', subAudiences: ottMaturitySubs },
  { id: 'premium-ott', title: 'Premium OTT Users', subtitle: 'Segment users by affluence signals and premium OTT consumption patterns', subAudiences: premiumOttSubs },
  { id: 'viewing-affinity', title: 'Viewing Affinity Intelligence', subtitle: 'Map content preferences and genre affinities for precision targeting', subAudiences: viewingAffinitySubs },
  { id: 'platform-behavior', title: 'Platform Behavior & Attention Source', subtitle: 'Understand cross-platform engagement and attention allocation patterns', subAudiences: platformBehaviorSubs },
  { id: 'life-stage', title: 'Life Stage & Household Context', subtitle: 'Target based on household composition, life events, and family dynamics', subAudiences: lifeStageSubs },
];

// Add computed totalSize
cohortCategories.forEach(cat => {
  (cat as any).totalSize = calcTotal(cat.subAudiences);
});

export const allAudiences: SubAudience[] = cohortCategories.flatMap(c => c.subAudiences);

export const demoAudienceIds = [
  'single-ott', 'multi-ott', 'ott-trial', 'cord-cutters',
  'premium-metro', 'emerging-premium', 'elite-multi-ott',
  'drama-enthusiasts', 'biz-content', 'family-drama'
];

export const ALL_PARTNERS = [
  'Telco Data Provider', 'OTT App Analytics', 'Device Intelligence Corp',
  'Financial Proxy Signals', 'Content Affinity Engine', 'Engagement Depth Platform',
  'Professional Data Partner', 'Geo Intelligence Partner',
  'Aggregators', 'Fintech', 'Quick Commerce'
];

// Map fields to relevant data partners
export const fieldToPartners: Record<string, string[]> = {
  'Income Level': ['Financial Proxy Signals', 'Fintech'],
  'City': ['Geo Intelligence Partner', 'Telco Data Provider'],
  'State': ['Geo Intelligence Partner', 'Telco Data Provider'],
  'Tier': ['Geo Intelligence Partner'],
  'OTT Apps Installed': ['OTT App Analytics'],
  'OTT Engagement Level': ['OTT App Analytics', 'Engagement Depth Platform'],
  'Preferred OTT Platform': ['OTT App Analytics', 'Content Affinity Engine'],
  'Genre Affinity': ['Content Affinity Engine', 'OTT App Analytics'],
  'Device Type': ['Device Intelligence Corp', 'Telco Data Provider'],
  'Device Tier': ['Device Intelligence Corp'],
  'Profession': ['Professional Data Partner', 'Aggregators', 'Fintech'],
  'Industry': ['Professional Data Partner'],
  'Age': ['Telco Data Provider', 'Aggregators'],
  'Gender': ['Telco Data Provider', 'Aggregators'],
  'Household Type': ['Aggregators', 'Geo Intelligence Partner'],
  'Family Structure': ['Aggregators'],
};

export const audienceQueryConfigs: Record<string, {
  dataPartners: string[];
  conditions: { field: string; operator: string; value: string; logic: 'AND' | 'OR' }[];
  sql: string;
}> = {
  'premium-metro': {
    dataPartners: ['Telco Data Provider', 'OTT App Analytics', 'Device Intelligence Corp', 'Financial Proxy Signals'],
    conditions: [
      { field: 'Income Level', operator: 'IN', value: 'Elite, Affluent', logic: 'AND' },
      { field: 'City', operator: 'IN', value: 'Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Pune', logic: 'AND' },
      { field: 'OTT Apps Installed', operator: '>', value: '1', logic: 'AND' },
      { field: 'Device Type', operator: 'IN', value: 'Premium Smartphone, CTV', logic: 'AND' },
    ],
    sql: `SELECT user_id, demographic_segment, ott_profile, device_info
FROM telco_data t
JOIN ott_analytics o ON t.device_id = o.device_id
JOIN device_intel d ON t.device_id = d.device_id
WHERE t.income_segment IN ('Elite', 'Affluent')
  AND t.city IN ('Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune')
  AND o.ott_apps_count > 1
  AND d.device_tier IN ('Premium Smartphone', 'CTV')`,
  },
  'multi-ott': {
    dataPartners: ['OTT App Analytics', 'Content Affinity Engine', 'Engagement Depth Platform'],
    conditions: [
      { field: 'OTT Apps Installed', operator: '>=', value: '3', logic: 'AND' },
      { field: 'OTT Engagement Level', operator: '>', value: 'High', logic: 'AND' },
      { field: 'Preferred OTT Platform', operator: 'IN', value: 'Netflix, Hotstar, Prime, Zee5', logic: 'AND' },
    ],
    sql: `SELECT user_id, ott_subscriptions, watch_behavior, content_preferences
FROM ott_analytics
WHERE ott_subscription_count >= 3
  AND monthly_watch_hours > 20
  AND content_diversity_score > 0.7`,
  },
  'biz-content': {
    dataPartners: ['OTT App Analytics', 'Professional Data Partner', 'Content Affinity Engine', 'Financial Proxy Signals'],
    conditions: [
      { field: 'Genre Affinity', operator: 'IN', value: 'Business Drama, Corporate Drama, Finance', logic: 'AND' },
      { field: 'Profession', operator: 'CONTAINS', value: 'Entrepreneurs, Consultants, Finance Professionals, MBA Graduates, Family Business Owners', logic: 'AND' },
      { field: 'Age', operator: 'BETWEEN', value: '25-45', logic: 'AND' },
      { field: 'Income Level', operator: 'IN', value: 'Top 30%', logic: 'AND' },
      { field: 'City', operator: 'IN', value: 'Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Pune', logic: 'AND' },
    ],
    sql: `SELECT user_id, professional_profile, content_affinity, device_info
FROM ott_analytics o
JOIN professional_data p ON o.user_id = p.user_id
WHERE o.primary_genre IN ('Business Drama', 'Corporate Drama', 'Finance')
  AND p.profession IN ('Entrepreneur', 'Consultant', 'Finance Professional', 'MBA')
  AND p.age BETWEEN 25 AND 45
  AND p.affluence_percentile <= 30
  AND p.city_tier = 'Metro'`,
  }
};

export const defaultQueryConfig = {
  dataPartners: ['Telco Data Provider', 'OTT App Analytics', 'Device Intelligence Corp'],
  conditions: [
    { field: 'City', operator: 'IN', value: 'Metro, Tier-1', logic: 'AND' as const },
    { field: 'OTT Engagement Level', operator: '=', value: 'Active', logic: 'AND' as const },
  ],
  sql: `SELECT user_id, demographic_segment, ott_profile
FROM audience_data
WHERE city_tier IN ('Metro', 'Tier-1')
  AND ott_active = true`,
};
