import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, ArrowLeft, Database, Layers, Fingerprint, UploadCloud, Users2, Percent,
  Megaphone, BarChart3, ShieldAlert, ChevronRight, ChevronDown, Filter, Building2,
} from 'lucide-react';

/* ============================ Data model ============================ */

type Platform = 'Google Ads' | 'DV360' | 'Meta';

type Instance = {
  platform: Platform;
  audienceId: string;
  account: string;
  pushed: number;
  matched: number;
  rate: number;
  usageStatus: 'Used' | 'Not Used';
  campaigns: number;
  impressions: number;
};

type Cohort = {
  id: string;
  dataset: string;
  cohort: string;
  category: string;
  approvedIds: number;
  status: 'Active' | 'Matched';
  refresh: string;
  expiry: string;
  allowedPlatforms: string;
  allowedAccounts: string;
  usageRights: string;
  governance: 'Clear' | 'Under Review' | 'Pending Refresh' | 'Expired';
  lastChecked: string;
  instances: Instance[];
};

const cohorts: Cohort[] = [
  {
    id: 'C1', dataset: 'Instamart Grocery Behaviour', cohort: 'High-Intent Grocery Buyers', category: 'Q-Commerce',
    approvedIds: 8.5, status: 'Active', refresh: '08 Aug 2026', expiry: '08 Nov 2026',
    allowedPlatforms: 'Google Ads, DV360, Meta', allowedAccounts: 'Approved Advertiser A, C',
    usageRights: 'Targeting, Suppression, Lookalike Seed', governance: 'Clear', lastChecked: '13 Aug 2026, 09:45 IST',
    instances: [
      { platform: 'Google Ads', audienceId: 'GA-AUD-10421', account: 'Approved Google Account A', pushed: 8.5, matched: 2.1, rate: 25, usageStatus: 'Used', campaigns: 1, impressions: 8.4 },
      { platform: 'DV360', audienceId: 'DV-AUD-77812', account: 'Approved DV360 Advertiser A', pushed: 8.5, matched: 2.3, rate: 27, usageStatus: 'Used', campaigns: 2, impressions: 24.8 },
      { platform: 'Meta', audienceId: 'META-AUD-55210', account: 'Approved Meta Ad Account B', pushed: 8.5, matched: 1.2, rate: 14, usageStatus: 'Used', campaigns: 1, impressions: 8.6 },
    ],
  },
  {
    id: 'C2', dataset: 'Instamart High-Value Buyers', cohort: 'Premium Basket Shoppers', category: 'Commerce Value',
    approvedIds: 6.2, status: 'Active', refresh: '06 Aug 2026', expiry: '06 Nov 2026',
    allowedPlatforms: 'DV360, Meta', allowedAccounts: 'Approved Advertiser A, B',
    usageRights: 'Targeting, Lookalike Seed', governance: 'Clear', lastChecked: '13 Aug 2026, 09:45 IST',
    instances: [
      { platform: 'DV360', audienceId: 'DV-AUD-33110', account: 'Approved DV360 Advertiser A', pushed: 6.2, matched: 2.4, rate: 39, usageStatus: 'Used', campaigns: 2, impressions: 11.2 },
      { platform: 'Meta', audienceId: 'META-AUD-33412', account: 'Approved Meta Ad Account B', pushed: 6.2, matched: 1.5, rate: 24, usageStatus: 'Used', campaigns: 1, impressions: 11.4 },
    ],
  },
  {
    id: 'C3', dataset: 'Instamart Grocery Behaviour', cohort: 'Frequent Instamart Users', category: 'Frequency',
    approvedIds: 11.8, status: 'Active', refresh: '08 Aug 2026', expiry: '08 Nov 2026',
    allowedPlatforms: 'Google Ads, DV360', allowedAccounts: 'Approved Advertiser A, C',
    usageRights: 'Targeting, Retargeting', governance: 'Under Review', lastChecked: '13 Aug 2026, 09:45 IST',
    instances: [
      { platform: 'Google Ads', audienceId: 'GA-AUD-20219', account: 'Approved Google Account C', pushed: 11.8, matched: 3.9, rate: 33, usageStatus: 'Used', campaigns: 2, impressions: 18.9 },
      { platform: 'DV360', audienceId: 'DV-AUD-20990', account: 'Approved DV360 Advertiser A', pushed: 11.8, matched: 3.5, rate: 30, usageStatus: 'Used', campaigns: 1, impressions: 12.3 },
    ],
  },
  {
    id: 'C4', dataset: 'Swiggy Food Ordering Signals', cohort: 'Snacks & Beverage Buyers', category: 'Category Buyers',
    approvedIds: 7.1, status: 'Active', refresh: '09 Aug 2026', expiry: '09 Nov 2026',
    allowedPlatforms: 'Google Ads, Meta', allowedAccounts: 'Approved Advertiser A, B',
    usageRights: 'Targeting, Suppression', governance: 'Clear', lastChecked: '13 Aug 2026, 09:45 IST',
    instances: [
      { platform: 'Google Ads', audienceId: 'GA-AUD-31877', account: 'Approved Google Account A', pushed: 7.1, matched: 2.2, rate: 31, usageStatus: 'Used', campaigns: 1, impressions: 4.5 },
      { platform: 'Meta', audienceId: 'META-AUD-44021', account: 'Approved Meta Ad Account A', pushed: 7.1, matched: 1.8, rate: 25, usageStatus: 'Used', campaigns: 1, impressions: 9.6 },
    ],
  },
  {
    id: 'C5', dataset: 'Instamart High-Value Buyers', cohort: 'Monthly High Spenders', category: 'High Value',
    approvedIds: 4.8, status: 'Matched', refresh: '06 Aug 2026', expiry: '06 Nov 2026',
    allowedPlatforms: 'DV360', allowedAccounts: 'Approved Advertiser A',
    usageRights: 'Targeting', governance: 'Clear', lastChecked: '13 Aug 2026, 09:45 IST',
    instances: [
      { platform: 'DV360', audienceId: 'DV-AUD-66190', account: 'Approved DV360 Advertiser A', pushed: 4.8, matched: 2.7, rate: 56, usageStatus: 'Used', campaigns: 1, impressions: 13.7 },
    ],
  },
  {
    id: 'C6', dataset: 'Instamart Grocery Behaviour', cohort: 'Lapsed Grocery Buyers', category: 'Reactivation',
    approvedIds: 5.5, status: 'Active', refresh: '02 Aug 2026', expiry: '02 Nov 2026',
    allowedPlatforms: 'Google Ads, Meta', allowedAccounts: 'Approved Advertiser C, D',
    usageRights: 'Targeting, Retargeting', governance: 'Pending Refresh', lastChecked: '13 Aug 2026, 09:45 IST',
    instances: [
      { platform: 'Google Ads', audienceId: 'GA-AUD-51120', account: 'Approved Google Account C', pushed: 5.5, matched: 1.7, rate: 31, usageStatus: 'Used', campaigns: 1, impressions: 12.0 },
      { platform: 'Meta', audienceId: 'META-AUD-90176', account: 'Approved Meta Ad Account D', pushed: 5.5, matched: 1.5, rate: 27, usageStatus: 'Used', campaigns: 1, impressions: 7.2 },
    ],
  },
];

type CampaignRow = {
  dataset: string; cohort: string; platform: Platform; audienceId: string; account: string;
  object: string; usageType: string; status: 'Live' | 'Completed'; impressions: number;
  flightStart: string; flightEnd: string; lastDelivery: string; inScope: 'Yes' | 'No';
};

const campaignRows: CampaignRow[] = [
  { dataset: 'Instamart Grocery Behaviour', cohort: 'High-Intent Grocery Buyers', platform: 'DV360', audienceId: 'DV-AUD-77812', account: 'Approved Advertiser A', object: 'Line Item 01', usageType: 'Targeting', status: 'Live', impressions: 14.2, flightStart: '01 Jul 2026', flightEnd: '30 Sep 2026', lastDelivery: '13 Aug 2026', inScope: 'Yes' },
  { dataset: 'Instamart Grocery Behaviour', cohort: 'High-Intent Grocery Buyers', platform: 'DV360', audienceId: 'DV-AUD-77812', account: 'Approved Advertiser A', object: 'Line Item 02', usageType: 'Targeting', status: 'Live', impressions: 10.6, flightStart: '01 Jul 2026', flightEnd: '30 Sep 2026', lastDelivery: '13 Aug 2026', inScope: 'Yes' },
  { dataset: 'Instamart Grocery Behaviour', cohort: 'High-Intent Grocery Buyers', platform: 'Google Ads', audienceId: 'GA-AUD-10421', account: 'Approved Advertiser C', object: 'Campaign 03', usageType: 'Targeting', status: 'Live', impressions: 8.4, flightStart: '10 Jul 2026', flightEnd: '30 Sep 2026', lastDelivery: '13 Aug 2026', inScope: 'Yes' },
  { dataset: 'Instamart Grocery Behaviour', cohort: 'High-Intent Grocery Buyers', platform: 'Meta', audienceId: 'META-AUD-55210', account: 'Approved Advertiser B', object: 'Ad Set 08', usageType: 'Targeting', status: 'Live', impressions: 8.6, flightStart: '05 Jul 2026', flightEnd: '30 Sep 2026', lastDelivery: '12 Aug 2026', inScope: 'Yes' },
  { dataset: 'Instamart High-Value Buyers', cohort: 'Premium Basket Shoppers', platform: 'Meta', audienceId: 'META-AUD-33412', account: 'Approved Advertiser B', object: 'Ad Set 04', usageType: 'Lookalike Seed', status: 'Completed', impressions: 11.4, flightStart: '05 Jun 2026', flightEnd: '31 Jul 2026', lastDelivery: '01 Aug 2026', inScope: 'Yes' },
  { dataset: 'Instamart High-Value Buyers', cohort: 'Premium Basket Shoppers', platform: 'DV360', audienceId: 'DV-AUD-33110', account: 'Approved Advertiser A', object: 'Line Item 09', usageType: 'Targeting', status: 'Live', impressions: 11.2, flightStart: '01 Jul 2026', flightEnd: '30 Sep 2026', lastDelivery: '13 Aug 2026', inScope: 'Yes' },
  { dataset: 'Instamart Grocery Behaviour', cohort: 'Frequent Instamart Users', platform: 'Google Ads', audienceId: 'GA-AUD-20219', account: 'Approved Advertiser C', object: 'Campaign 05', usageType: 'Targeting', status: 'Live', impressions: 18.9, flightStart: '15 Jul 2026', flightEnd: '15 Sep 2026', lastDelivery: '13 Aug 2026', inScope: 'Yes' },
  { dataset: 'Instamart Grocery Behaviour', cohort: 'Frequent Instamart Users', platform: 'DV360', audienceId: 'DV-AUD-20990', account: 'Approved Advertiser A', object: 'Line Item 10', usageType: 'Targeting', status: 'Live', impressions: 12.3, flightStart: '15 Jul 2026', flightEnd: '15 Sep 2026', lastDelivery: '13 Aug 2026', inScope: 'Yes' },
  { dataset: 'Swiggy Food Ordering Signals', cohort: 'Snacks & Beverage Buyers', platform: 'Meta', audienceId: 'META-AUD-44021', account: 'Approved Advertiser A', object: 'Ad Set 06', usageType: 'Suppression', status: 'Live', impressions: 9.6, flightStart: '20 Jul 2026', flightEnd: '30 Sep 2026', lastDelivery: '12 Aug 2026', inScope: 'Yes' },
  { dataset: 'Swiggy Food Ordering Signals', cohort: 'Snacks & Beverage Buyers', platform: 'Google Ads', audienceId: 'GA-AUD-31877', account: 'Approved Advertiser A', object: 'Campaign 11', usageType: 'Targeting', status: 'Live', impressions: 4.5, flightStart: '20 Jul 2026', flightEnd: '30 Sep 2026', lastDelivery: '12 Aug 2026', inScope: 'Yes' },
  { dataset: 'Instamart High-Value Buyers', cohort: 'Monthly High Spenders', platform: 'DV360', audienceId: 'DV-AUD-66190', account: 'Approved Advertiser A', object: 'Line Item 12', usageType: 'Targeting', status: 'Live', impressions: 13.7, flightStart: '01 Aug 2026', flightEnd: '30 Sep 2026', lastDelivery: '13 Aug 2026', inScope: 'Yes' },
  { dataset: 'Instamart Grocery Behaviour', cohort: 'Lapsed Grocery Buyers', platform: 'Meta', audienceId: 'META-AUD-90176', account: 'Approved Advertiser D', object: 'Ad Set 07', usageType: 'Retargeting', status: 'Completed', impressions: 7.2, flightStart: '01 Jun 2026', flightEnd: '25 Jul 2026', lastDelivery: '26 Jul 2026', inScope: 'No' },
  { dataset: 'Instamart Grocery Behaviour', cohort: 'Lapsed Grocery Buyers', platform: 'Google Ads', audienceId: 'GA-AUD-51120', account: 'Approved Advertiser C', object: 'Campaign 13', usageType: 'Retargeting', status: 'Completed', impressions: 12.0, flightStart: '01 Jun 2026', flightEnd: '25 Jul 2026', lastDelivery: '26 Jul 2026', inScope: 'Yes' },
];

type Alert = {
  alert: string; dataset: string; cohort: string; platform: Platform; audienceId: string;
  severity: 'Low' | 'Medium' | 'High'; status: string; account: string; detected: string;
  why: string; rule: string; action: string; owner: string; notes: string;
};

const alerts: Alert[] = [
  {
    alert: 'Audience marked as shared', dataset: 'Instamart Grocery Behaviour', cohort: 'Frequent Instamart Users',
    platform: 'Google Ads', audienceId: 'GA-AUD-20219', severity: 'Medium', status: 'Under Review',
    account: 'Approved Google Account C', detected: '11 Aug 2026',
    why: 'The audience list is flagged as shared across linked accounts in the platform account structure.',
    rule: 'Account permission map – approved account list for this cohort.',
    action: 'Confirm the linked accounts are within the approved account permission map.',
    owner: 'Governance Ops – WPP',
    notes: 'Sharing status is treated as a review flag, not automatic misuse. Usage is monitored across approved platform accounts where WPP has API/reporting access. If the audience appears outside approved accounts or approved use cases, it will be escalated for review.',
  },
  {
    alert: 'Refresh overdue', dataset: 'Instamart Grocery Behaviour', cohort: 'Lapsed Grocery Buyers',
    platform: 'Meta', audienceId: 'META-AUD-90176', severity: 'Low', status: 'Pending Refresh',
    account: 'Approved Meta Ad Account D', detected: '09 Aug 2026',
    why: 'The platform audience instance has not been refreshed within the agreed refresh cadence.',
    rule: 'Contract refresh cadence – 30 days per platform audience instance.',
    action: 'Re-push the cohort to the platform audience instance to restore match freshness.',
    owner: 'Partner Data Ops – Swiggy/Instamart',
    notes: 'Delivery continues on the last matched list until refreshed. No breach recorded.',
  },
];

/* ==================== Brand mapping (derived from account_permission_map) ==================== */

type BrandInstance = {
  platform: Platform; audienceId: string; account: string;
  pushed: number; matched: number; rate: number;
  usageStatus: 'Used' | 'Not Used'; campaigns: number; impressions: number;
};

type BrandUsageRow = {
  dataset: string; cohort: string; category: string;
  approvedIds: number; platformsPushed: Platform[];
  matched: number; matchRate: number; campaigns: number; impressions: number;
  status: 'Active' | 'Matched' | 'Completed';
  instances: BrandInstance[];
};

type Brand = {
  name: string;
  accounts: string[];
  datasets: number;
  cohorts: number;
  platforms: Platform[];
  matched: number;
  campaigns: number;
  impressions: number;
  status: 'Active' | 'Completed';
  /** cohort + platform pairs this brand is approved on — used to filter the dashboard */
  pairs: { cohort: string; platform: Platform }[];
  usage: BrandUsageRow[];
};

const brands: Brand[] = [
  {
    name: 'Coca-Cola',
    accounts: ['Coca-Cola Approved DV360 Advertiser A', 'Coca-Cola Approved Google Account B', 'Coca-Cola Approved Meta Account C'],
    datasets: 2, cohorts: 4, platforms: ['Google Ads', 'DV360', 'Meta'],
    matched: 8.7, campaigns: 5, impressions: 46.2, status: 'Active',
    pairs: [
      { cohort: 'High-Intent Grocery Buyers', platform: 'DV360' },
      { cohort: 'High-Intent Grocery Buyers', platform: 'Google Ads' },
      { cohort: 'Snacks & Beverage Buyers', platform: 'Meta' },
      { cohort: 'Snacks & Beverage Buyers', platform: 'DV360' },
      { cohort: 'Premium Basket Shoppers', platform: 'Meta' },
    ],
    usage: [
      {
        dataset: 'Instamart Grocery Behaviour', cohort: 'High-Intent Grocery Buyers', category: 'Q-Commerce',
        approvedIds: 8.5, platformsPushed: ['Google Ads', 'DV360'], matched: 3.8, matchRate: 45, campaigns: 3, impressions: 24.8, status: 'Active',
        instances: [
          { platform: 'Google Ads', audienceId: 'GA-AUD-10421', account: 'Coca-Cola Approved Google Account B', pushed: 8.5, matched: 1.5, rate: 18, usageStatus: 'Used', campaigns: 1, impressions: 6.2 },
          { platform: 'DV360', audienceId: 'DV-AUD-77812', account: 'Coca-Cola Approved DV360 Advertiser A', pushed: 8.5, matched: 2.3, rate: 27, usageStatus: 'Used', campaigns: 2, impressions: 18.6 },
        ],
      },
      {
        dataset: 'Swiggy Food Ordering Signals', cohort: 'Snacks & Beverage Buyers', category: 'Category Buyers',
        approvedIds: 7.1, platformsPushed: ['DV360', 'Meta'], matched: 2.7, matchRate: 38, campaigns: 2, impressions: 13.1, status: 'Active',
        instances: [
          { platform: 'DV360', audienceId: 'DV-AUD-44021', account: 'Coca-Cola Approved DV360 Advertiser A', pushed: 7.1, matched: 1.5, rate: 21, usageStatus: 'Used', campaigns: 1, impressions: 9.6 },
          { platform: 'Meta', audienceId: 'META-AUD-55210', account: 'Coca-Cola Approved Meta Account C', pushed: 7.1, matched: 1.2, rate: 17, usageStatus: 'Used', campaigns: 1, impressions: 3.5 },
        ],
      },
      {
        dataset: 'Instamart High-Value Buyers', cohort: 'Premium Basket Shoppers', category: 'Commerce Value',
        approvedIds: 6.2, platformsPushed: ['Meta'], matched: 1.2, matchRate: 19, campaigns: 1, impressions: 8.3, status: 'Active',
        instances: [
          { platform: 'Meta', audienceId: 'META-AUD-33412', account: 'Coca-Cola Approved Meta Account C', pushed: 6.2, matched: 1.2, rate: 19, usageStatus: 'Used', campaigns: 1, impressions: 8.3 },
        ],
      },
    ],
  },
  {
    name: 'Britannia',
    accounts: ['Britannia Approved DV360 Advertiser A', 'Britannia Approved Meta Account B'],
    datasets: 3, cohorts: 5, platforms: ['DV360', 'Meta'],
    matched: 9.4, campaigns: 6, impressions: 51.8, status: 'Active',
    pairs: [
      { cohort: 'Frequent Instamart Users', platform: 'DV360' },
      { cohort: 'Frequent Instamart Users', platform: 'Meta' },
      { cohort: 'Snacks & Beverage Buyers', platform: 'DV360' },
      { cohort: 'Premium Basket Shoppers', platform: 'Meta' },
      { cohort: 'Lapsed Grocery Buyers', platform: 'Meta' },
    ],
    usage: [
      {
        dataset: 'Instamart Grocery Behaviour', cohort: 'Frequent Instamart Users', category: 'Frequency',
        approvedIds: 11.8, platformsPushed: ['DV360', 'Meta'], matched: 4.2, matchRate: 36, campaigns: 3, impressions: 21.5, status: 'Active',
        instances: [
          { platform: 'DV360', audienceId: 'DV-AUD-88219', account: 'Britannia Approved DV360 Advertiser A', pushed: 11.8, matched: 2.5, rate: 21, usageStatus: 'Used', campaigns: 2, impressions: 15.4 },
          { platform: 'Meta', audienceId: 'META-AUD-77102', account: 'Britannia Approved Meta Account B', pushed: 11.8, matched: 1.7, rate: 14, usageStatus: 'Used', campaigns: 1, impressions: 6.1 },
        ],
      },
      {
        dataset: 'Swiggy Food Ordering Signals', cohort: 'Snacks & Beverage Buyers', category: 'Category Buyers',
        approvedIds: 7.1, platformsPushed: ['DV360'], matched: 1.8, matchRate: 25, campaigns: 1, impressions: 9.6, status: 'Active',
        instances: [
          { platform: 'DV360', audienceId: 'DV-AUD-44021', account: 'Britannia Approved DV360 Advertiser A', pushed: 7.1, matched: 1.8, rate: 25, usageStatus: 'Used', campaigns: 1, impressions: 9.6 },
        ],
      },
      {
        dataset: 'Instamart High-Value Buyers', cohort: 'Premium Basket Shoppers', category: 'Commerce Value',
        approvedIds: 6.2, platformsPushed: ['Meta'], matched: 2.1, matchRate: 34, campaigns: 2, impressions: 13.8, status: 'Active',
        instances: [
          { platform: 'Meta', audienceId: 'META-AUD-33412', account: 'Britannia Approved Meta Account B', pushed: 6.2, matched: 2.1, rate: 34, usageStatus: 'Used', campaigns: 2, impressions: 13.8 },
        ],
      },
      {
        dataset: 'Instamart Grocery Behaviour', cohort: 'Lapsed Grocery Buyers', category: 'Reactivation',
        approvedIds: 5.5, platformsPushed: ['Meta'], matched: 1.3, matchRate: 24, campaigns: 1, impressions: 6.9, status: 'Active',
        instances: [
          { platform: 'Meta', audienceId: 'META-AUD-90176', account: 'Britannia Approved Meta Account B', pushed: 5.5, matched: 1.3, rate: 24, usageStatus: 'Used', campaigns: 1, impressions: 6.9 },
        ],
      },
    ],
  },
  {
    name: 'HUL',
    accounts: ['HUL Approved DV360 Advertiser A', 'HUL Approved Google Account C'],
    datasets: 1, cohorts: 2, platforms: ['Google Ads', 'DV360'],
    matched: 4.1, campaigns: 3, impressions: 18.5, status: 'Active',
    pairs: [
      { cohort: 'Frequent Instamart Users', platform: 'Google Ads' },
      { cohort: 'High-Intent Grocery Buyers', platform: 'DV360' },
    ],
    usage: [
      {
        dataset: 'Instamart Grocery Behaviour', cohort: 'Frequent Instamart Users', category: 'Frequency',
        approvedIds: 11.8, platformsPushed: ['Google Ads'], matched: 2.4, matchRate: 20, campaigns: 2, impressions: 11.3, status: 'Active',
        instances: [
          { platform: 'Google Ads', audienceId: 'GA-AUD-20219', account: 'HUL Approved Google Account C', pushed: 11.8, matched: 2.4, rate: 20, usageStatus: 'Used', campaigns: 2, impressions: 11.3 },
        ],
      },
      {
        dataset: 'Instamart Grocery Behaviour', cohort: 'High-Intent Grocery Buyers', category: 'Q-Commerce',
        approvedIds: 8.5, platformsPushed: ['DV360'], matched: 1.7, matchRate: 20, campaigns: 1, impressions: 7.2, status: 'Active',
        instances: [
          { platform: 'DV360', audienceId: 'DV-AUD-77812', account: 'HUL Approved DV360 Advertiser A', pushed: 8.5, matched: 1.7, rate: 20, usageStatus: 'Used', campaigns: 1, impressions: 7.2 },
        ],
      },
    ],
  },
  {
    name: 'Mondelez',
    accounts: ['Mondelez Approved Meta Account B', 'Mondelez Approved DV360 Advertiser B'],
    datasets: 1, cohorts: 2, platforms: ['Meta', 'DV360'],
    matched: 3.8, campaigns: 2, impressions: 13.6, status: 'Completed',
    pairs: [
      { cohort: 'Lapsed Grocery Buyers', platform: 'Meta' },
      { cohort: 'Premium Basket Shoppers', platform: 'DV360' },
    ],
    usage: [
      {
        dataset: 'Instamart Grocery Behaviour', cohort: 'Lapsed Grocery Buyers', category: 'Reactivation',
        approvedIds: 5.5, platformsPushed: ['Meta'], matched: 1.5, matchRate: 27, campaigns: 1, impressions: 7.2, status: 'Completed',
        instances: [
          { platform: 'Meta', audienceId: 'META-AUD-90176', account: 'Mondelez Approved Meta Account B', pushed: 5.5, matched: 1.5, rate: 27, usageStatus: 'Used', campaigns: 1, impressions: 7.2 },
        ],
      },
      {
        dataset: 'Instamart High-Value Buyers', cohort: 'Premium Basket Shoppers', category: 'Commerce Value',
        approvedIds: 6.2, platformsPushed: ['DV360'], matched: 2.3, matchRate: 37, campaigns: 1, impressions: 6.4, status: 'Completed',
        instances: [
          { platform: 'DV360', audienceId: 'DV-AUD-33110', account: 'Mondelez Approved DV360 Advertiser B', pushed: 6.2, matched: 2.3, rate: 37, usageStatus: 'Used', campaigns: 1, impressions: 6.4 },
        ],
      },
    ],
  },
  {
    name: 'Nestlé',
    accounts: ['Nestlé Approved Google Account A', 'Nestlé Approved Meta Account B'],
    datasets: 2, cohorts: 3, platforms: ['Google Ads', 'Meta'],
    matched: 5.8, campaigns: 4, impressions: 12.5, status: 'Active',
    pairs: [
      { cohort: 'Snacks & Beverage Buyers', platform: 'Google Ads' },
      { cohort: 'Snacks & Beverage Buyers', platform: 'Meta' },
      { cohort: 'Lapsed Grocery Buyers', platform: 'Google Ads' },
    ],
    usage: [
      {
        dataset: 'Swiggy Food Ordering Signals', cohort: 'Snacks & Beverage Buyers', category: 'Category Buyers',
        approvedIds: 7.1, platformsPushed: ['Google Ads', 'Meta'], matched: 4.0, matchRate: 56, campaigns: 3, impressions: 8.4, status: 'Active',
        instances: [
          { platform: 'Google Ads', audienceId: 'GA-AUD-31877', account: 'Nestlé Approved Google Account A', pushed: 7.1, matched: 2.2, rate: 31, usageStatus: 'Used', campaigns: 2, impressions: 4.5 },
          { platform: 'Meta', audienceId: 'META-AUD-44021', account: 'Nestlé Approved Meta Account B', pushed: 7.1, matched: 1.8, rate: 25, usageStatus: 'Used', campaigns: 1, impressions: 3.9 },
        ],
      },
      {
        dataset: 'Instamart Grocery Behaviour', cohort: 'Lapsed Grocery Buyers', category: 'Reactivation',
        approvedIds: 5.5, platformsPushed: ['Google Ads'], matched: 1.8, matchRate: 33, campaigns: 1, impressions: 4.1, status: 'Active',
        instances: [
          { platform: 'Google Ads', audienceId: 'GA-AUD-51120', account: 'Nestlé Approved Google Account A', pushed: 5.5, matched: 1.8, rate: 33, usageStatus: 'Used', campaigns: 1, impressions: 4.1 },
        ],
      },
    ],
  },
];


/* ============================ Helpers ============================ */

const m = (v: number) => `${v.toFixed(1)}M`;
const PLATFORMS: Platform[] = ['Google Ads', 'DV360', 'Meta'];

const platformChip = (p: Platform) => {
  const map: Record<Platform, string> = {
    'Google Ads': 'bg-blue-50 text-blue-700 border-blue-200',
    'DV360': 'bg-violet-50 text-violet-700 border-violet-200',
    'Meta': 'bg-sky-50 text-sky-700 border-sky-200',
  };
  return map[p];
};

const statusChip = (s: string) => {
  const map: Record<string, string> = {
    Active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Live: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Used: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    Matched: 'bg-amber-50 text-amber-700 border-amber-200',
    Completed: 'bg-slate-100 text-slate-600 border-slate-200',
    'Not Used': 'bg-slate-100 text-slate-600 border-slate-200',
    Clear: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    'Under Review': 'bg-orange-50 text-orange-700 border-orange-200',
    'Pending Refresh': 'bg-amber-50 text-amber-700 border-amber-200',
    Expired: 'bg-rose-50 text-rose-700 border-rose-200',
    Medium: 'bg-orange-50 text-orange-700 border-orange-200',
    Low: 'bg-slate-100 text-slate-600 border-slate-200',
    High: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  return map[s] ?? 'bg-slate-100 text-slate-600 border-slate-200';
};

const Chip: React.FC<{ label: string; className?: string }> = ({ label, className }) => (
  <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${className ?? statusChip(label)}`}>{label}</span>
);

const Select: React.FC<{ label: string; value: string; options: string[]; onChange: (v: string) => void }> = ({ label, value, options, onChange }) => (
  <label className="flex flex-col gap-1">
    <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 min-w-[150px] rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-800 shadow-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
    >
      {options.map((o) => <option key={o}>{o}</option>)}
    </select>
  </label>
);

const Section: React.FC<{ id?: string; title: string; subtitle?: string; icon: React.ElementType; children: React.ReactNode; right?: React.ReactNode }> =
  ({ id, title, subtitle, icon: Icon, children, right }) => (
  <section id={id} className="rounded-2xl border border-slate-200 bg-white shadow-sm">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600"><Icon className="h-4.5 w-4.5" size={18} /></span>
        <div>
          <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {right}
    </header>
    <div className="p-5">{children}</div>
  </section>
);

/* ============================ Drawer ============================ */

type DrawerState =
  | { type: 'cohort'; cohort: Cohort }
  | { type: 'campaign'; row: CampaignRow }
  | { type: 'governance'; alert: Alert }
  | { type: 'brand'; brand: Brand }
  | { type: 'kpi'; title: string; rows: { label: string; value: string }[]; note?: string }
  | null;

const Row: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2.5 last:border-0">
    <span className="text-xs font-medium text-slate-500">{label}</span>
    <span className="text-right text-sm font-medium text-slate-900">{value}</span>
  </div>
);

/* ============================ Page ============================ */

const SwiggyPartnerDashboard: React.FC = () => {
  const navigate = useNavigate();

  const [dateRange, setDateRange] = useState('Last 90 days');
  const [dataset, setDataset] = useState('All');
  const [cohortFilter, setCohortFilter] = useState('All');
  const [platform, setPlatform] = useState('All');
  const [usage, setUsage] = useState('All');
  const [governance, setGovernance] = useState('All');
  const [brandFilter, setBrandFilter] = useState<string>('All');

  const [expanded, setExpanded] = useState<string | null>('C1');
  const [drawer, setDrawer] = useState<DrawerState>(null);

  const datasetOptions = ['All', ...Array.from(new Set(cohorts.map((c) => c.dataset)))];
  const cohortOptions = ['All', ...cohorts.map((c) => c.cohort)];

  const activeBrand = useMemo(() => brands.find((b) => b.name === brandFilter) ?? null, [brandFilter]);
  const brandPair = (cohort: string, p: Platform) =>
    !activeBrand || activeBrand.pairs.some((x) => x.cohort === cohort && x.platform === p);
  const brandCohortNames = useMemo(
    () => (activeBrand ? new Set(activeBrand.pairs.map((p) => p.cohort)) : null),
    [activeBrand],
  );

  /* -------- filtering -------- */
  const filteredCohorts = useMemo(() => {
    return cohorts
      .filter((c) => dataset === 'All' || c.dataset === dataset)
      .filter((c) => cohortFilter === 'All' || c.cohort === cohortFilter)
      .filter((c) => governance === 'All' || c.governance === governance)
      .filter((c) => !brandCohortNames || brandCohortNames.has(c.cohort))
      .map((c) => ({
        ...c,
        instances: c.instances
          .filter((i) => platform === 'All' || i.platform === platform)
          .filter((i) => brandPair(c.cohort, i.platform)),
      }))
      .filter((c) => c.instances.length > 0)
      .filter((c) => {
        if (usage === 'All') return true;
        if (usage === 'Used') return c.instances.some((i) => i.usageStatus === 'Used');
        if (usage === 'Not Used') return c.instances.some((i) => i.usageStatus === 'Not Used');
        if (usage === 'Matched') return c.instances.some((i) => i.matched > 0);
        if (usage === 'Pushed') return c.instances.some((i) => i.pushed > 0);
        return true;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset, cohortFilter, platform, usage, governance, activeBrand]);

  const filteredCampaigns = useMemo(
    () => campaignRows
      .filter((r) => dataset === 'All' || r.dataset === dataset)
      .filter((r) => cohortFilter === 'All' || r.cohort === cohortFilter)
      .filter((r) => platform === 'All' || r.platform === platform)
      .filter((r) => brandPair(r.cohort, r.platform))
      .filter((r) => filteredCohorts.some((c) => c.cohort === r.cohort)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataset, cohortFilter, platform, filteredCohorts, activeBrand],
  );

  const filteredAlerts = useMemo(
    () => alerts
      .filter((a) => dataset === 'All' || a.dataset === dataset)
      .filter((a) => cohortFilter === 'All' || a.cohort === cohortFilter)
      .filter((a) => platform === 'All' || a.platform === platform)
      .filter((a) => governance === 'All' || a.status === governance)
      .filter((a) => brandPair(a.cohort, a.platform)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dataset, cohortFilter, platform, governance, activeBrand],
  );

  const filteredBrands = useMemo(
    () => brands
      .filter((b) => brandFilter === 'All' || b.name === brandFilter)
      .filter((b) => platform === 'All' || b.platforms.includes(platform as Platform))
      .filter((b) => cohortFilter === 'All' || b.pairs.some((p) => p.cohort === cohortFilter)),
    [brandFilter, platform, cohortFilter],
  );

  const agg = (c: Cohort) => {
    const matched = c.instances.reduce((s, i) => s + i.matched, 0);
    const camps = c.instances.reduce((s, i) => s + i.campaigns, 0);
    const imps = c.instances.reduce((s, i) => s + i.impressions, 0);
    const rate = c.instances.length ? Math.round(c.instances.reduce((s, i) => s + i.rate, 0) / c.instances.length) : 0;
    return { matched, camps, imps, rate };
  };

  const kpis = useMemo(() => {
    const allInst = filteredCohorts.flatMap((c) => c.instances);
    const matched = allInst.reduce((s, i) => s + i.matched, 0);
    const pushedIds = filteredCohorts.reduce((s, c) => s + c.approvedIds, 0);
    const pushedTotal = allInst.reduce((s, i) => s + i.pushed, 0);
    const avgRate = allInst.length ? Math.round((matched / pushedTotal) * 100) : 0;
    return [
      { key: 'datasets', label: 'Datasets Integrated', value: String(new Set(filteredCohorts.map((c) => c.dataset)).size), icon: Database },
      { key: 'cohorts', label: 'Cohorts Created', value: String(filteredCohorts.length), icon: Layers },
      { key: 'ids', label: 'Approved IDs', value: m(pushedIds), icon: Fingerprint },
      { key: 'pushes', label: 'Platform Audience Pushes', value: String(allInst.length), icon: UploadCloud },
      { key: 'matched', label: 'Platform Matched Size', value: m(matched), icon: Users2 },
      { key: 'rate', label: 'Avg. Platform Match Rate', value: `${avgRate}%`, icon: Percent },
      { key: 'campaigns', label: 'Campaigns / Line Items', value: String(filteredCampaigns.length), icon: Megaphone },
      { key: 'impressions', label: 'Impressions Served', value: m(filteredCampaigns.reduce((s, r) => s + r.impressions, 0)), icon: BarChart3 },
      { key: 'alerts', label: 'Open Governance Alerts', value: String(filteredAlerts.length), icon: ShieldAlert },
    ];
  }, [filteredCohorts, filteredCampaigns, filteredAlerts]);

  const platformTotals = useMemo(() => {
    return PLATFORMS.filter((p) => platform === 'All' || platform === p).map((p) => {
      const inst = filteredCohorts.flatMap((c) => c.instances).filter((i) => i.platform === p);
      const camps = filteredCampaigns.filter((r) => r.platform === p);
      return {
        platform: p,
        instances: inst.length,
        available: filteredCohorts.filter((c) => c.allowedPlatforms.includes(p)).length,
        used: new Set(camps.map((r) => r.cohort)).size,
        campaigns: camps.length,
        matched: inst.reduce((s, i) => s + i.matched, 0),
        impressions: camps.reduce((s, r) => s + r.impressions, 0),
        status: inst.length ? 'Active' : 'Not Used',
      };
    });
  }, [filteredCohorts, filteredCampaigns, platform]);

  const maxImp = Math.max(1, ...platformTotals.map((p) => p.impressions));

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const openKpi = (key: string) => {
    if (key === 'alerts') { scrollTo('governance'); return; }
    if (key === 'campaigns' || key === 'impressions') { scrollTo('campaigns'); return; }
    if (key === 'pushes' || key === 'matched' || key === 'rate') { scrollTo('platforms'); return; }
    scrollTo('cohorts');
  };

  const activeChips = [
    dataset !== 'All' && { label: `Dataset: ${dataset}`, clear: () => setDataset('All') },
    cohortFilter !== 'All' && { label: `Cohort: ${cohortFilter}`, clear: () => setCohortFilter('All') },
    platform !== 'All' && { label: `Platform: ${platform}`, clear: () => setPlatform('All') },
    usage !== 'All' && { label: `Usage: ${usage}`, clear: () => setUsage('All') },
    governance !== 'All' && { label: `Governance: ${governance}`, clear: () => setGovernance('All') },
    brandFilter !== 'All' && { label: `Brand: ${brandFilter}`, clear: () => setBrandFilter('All') },
  ].filter(Boolean) as { label: string; clear: () => void }[];

  return (
    <div className="min-h-screen bg-[#F7F8FA] text-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1500px] px-6 py-5">
          <button onClick={() => navigate('/')} className="mb-3 inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-orange-600">
            <ArrowLeft size={14} /> Back to WPP Data Exchange
          </button>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Swiggy<span className="text-orange-500">/</span>Instamart Data Partner Usage Dashboard
              </h1>
              <p className="mt-1 max-w-3xl text-sm text-slate-500">
                Track approved Swiggy/Instamart datasets and cohorts from onboarding to platform push, platform-level match scale,
                approved campaign usage and impressions served.
              </p>
            </div>
            <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
              WPP Data Exchange · Partner View
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1500px] space-y-6 px-6 py-6">
        {/* Filters */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-end gap-3">
            <Select label="Date Range" value={dateRange} options={['Last 30 days', 'Last 90 days', 'Quarter to date', 'Year to date']} onChange={setDateRange} />
            <Select label="Dataset" value={dataset} options={datasetOptions} onChange={setDataset} />
            <Select label="Cohort" value={cohortFilter} options={cohortOptions} onChange={setCohortFilter} />
            <Select label="Platform" value={platform} options={['All', ...PLATFORMS]} onChange={setPlatform} />
            <Select label="Usage Status" value={usage} options={['All', 'Pushed', 'Matched', 'Used', 'Not Used']} onChange={setUsage} />
            <Select label="Governance Status" value={governance} options={['All', 'Clear', 'Under Review', 'Pending Refresh', 'Expired']} onChange={setGovernance} />
          </div>
          {activeChips.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              <Filter size={13} className="text-slate-400" />
              {activeChips.map((c) => (
                <button key={c.label} onClick={c.clear} className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700 hover:bg-orange-100">
                  {c.label} <X size={11} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {kpis.map((k) => (
            <button
              key={k.key}
              onClick={() => openKpi(k.key)}
              className="group rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md"
            >
              <div className="flex items-center gap-2 text-slate-400 group-hover:text-orange-500">
                <k.icon size={15} />
                <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{k.label}</span>
              </div>
              <div className="mt-2 text-2xl font-bold tracking-tight text-slate-900">{k.value}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[60fr_40fr]">
        {/* Section 1 */}
        <Section id="cohorts" title="Dataset → Cohort Summary" subtitle="One row per dataset + cohort. Expand to see platform audience instances." icon={Layers}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="w-8 py-2.5" />
                  <th className="py-2.5 pr-3 font-semibold">Dataset</th>
                  <th className="py-2.5 pr-3 font-semibold">Cohort</th>
                  <th className="py-2.5 pr-3 font-semibold">Category</th>
                  <th className="py-2.5 pr-3 font-semibold">Approved IDs</th>
                  <th className="py-2.5 pr-3 font-semibold">Platforms Pushed</th>
                  <th className="py-2.5 pr-3 font-semibold">Platform Matched Size</th>
                  <th className="py-2.5 pr-3 font-semibold">Avg. Match Rate</th>
                  <th className="py-2.5 pr-3 font-semibold">Campaigns / Line Items</th>
                  <th className="py-2.5 pr-3 font-semibold">Impressions Served</th>
                  <th className="py-2.5 pr-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCohorts.map((c) => {
                  const a = agg(c);
                  const open = expanded === c.id;
                  return (
                    <React.Fragment key={c.id}>
                      <tr
                        onClick={() => { setExpanded(open ? null : c.id); setDrawer({ type: 'cohort', cohort: c }); }}
                        className={`cursor-pointer border-b border-slate-100 transition hover:bg-orange-50/50 ${open ? 'bg-orange-50/40' : ''}`}
                      >
                        <td className="py-3 pl-1 text-slate-400">{open ? <ChevronDown size={15} /> : <ChevronRight size={15} />}</td>
                        <td className="py-3 pr-3 text-slate-600">{c.dataset}</td>
                        <td className="py-3 pr-3 font-semibold text-slate-900">{c.cohort}</td>
                        <td className="py-3 pr-3 text-slate-600">{c.category}</td>
                        <td className="py-3 pr-3 font-medium">{m(c.approvedIds)}</td>
                        <td className="py-3 pr-3">
                          <div className="flex flex-wrap gap-1">
                            {c.instances.map((i) => <Chip key={i.platform} label={i.platform} className={platformChip(i.platform)} />)}
                          </div>
                        </td>
                        <td className="py-3 pr-3 font-semibold text-slate-900">{m(a.matched)}</td>
                        <td className="py-3 pr-3">{a.rate}%</td>
                        <td className="py-3 pr-3">{a.camps}</td>
                        <td className="py-3 pr-3 font-medium">{m(a.imps)}</td>
                        <td className="py-3 pr-3"><Chip label={c.status} /></td>
                      </tr>
                      {open && (
                        <tr className="border-b border-slate-100 bg-slate-50/70">
                          <td />
                          <td colSpan={10} className="px-2 py-4">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              Platform audience instances · dataset + cohort + platform + destination account
                            </p>
                            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-[11px] uppercase tracking-wide text-slate-500">
                                    <th className="px-3 py-2 font-semibold">Platform</th>
                                    <th className="px-3 py-2 font-semibold">Platform Audience ID</th>
                                    <th className="px-3 py-2 font-semibold">Destination Account</th>
                                    <th className="px-3 py-2 font-semibold">Pushed IDs</th>
                                    <th className="px-3 py-2 font-semibold">Matched Size</th>
                                    <th className="px-3 py-2 font-semibold">Match Rate</th>
                                    <th className="px-3 py-2 font-semibold">Usage Status</th>
                                    <th className="px-3 py-2 font-semibold">Campaigns / Line Items</th>
                                    <th className="px-3 py-2 font-semibold">Impressions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {c.instances.map((i) => (
                                    <tr key={i.audienceId} className="border-b border-slate-100 last:border-0 hover:bg-orange-50/40">
                                      <td className="px-3 py-2.5"><Chip label={i.platform} className={platformChip(i.platform)} /></td>
                                      <td className="px-3 py-2.5 font-mono text-xs text-slate-700">{i.audienceId}</td>
                                      <td className="px-3 py-2.5 text-slate-600">{i.account}</td>
                                      <td className="px-3 py-2.5">{m(i.pushed)}</td>
                                      <td className="px-3 py-2.5 font-semibold">{m(i.matched)}</td>
                                      <td className="px-3 py-2.5">{i.rate}%</td>
                                      <td className="px-3 py-2.5"><Chip label={i.usageStatus} /></td>
                                      <td className="px-3 py-2.5">{i.campaigns}</td>
                                      <td className="px-3 py-2.5">{m(i.impressions)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Section 2 */}
        <Section id="platforms" title="Platform Usage & Delivery" subtitle="Click a platform row to filter the whole dashboard." icon={UploadCloud}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="py-2.5 pr-3 font-semibold">Platform</th>
                  <th className="py-2.5 pr-3 font-semibold">Platform Audience Instances</th>
                  <th className="py-2.5 pr-3 font-semibold">Cohorts Available</th>
                  <th className="py-2.5 pr-3 font-semibold">Cohorts Used</th>
                  <th className="py-2.5 pr-3 font-semibold">Campaigns / Line Items</th>
                  <th className="py-2.5 pr-3 font-semibold">Platform Matched Size</th>
                  <th className="py-2.5 pr-3 font-semibold">Impressions Served</th>
                  <th className="py-2.5 pr-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {platformTotals.map((p) => (
                  <tr key={p.platform} onClick={() => setPlatform(p.platform)} className="cursor-pointer border-b border-slate-100 transition hover:bg-orange-50/50">
                    <td className="py-3 pr-3"><Chip label={p.platform} className={platformChip(p.platform)} /></td>
                    <td className="py-3 pr-3 font-semibold">{p.instances}</td>
                    <td className="py-3 pr-3">{p.available}</td>
                    <td className="py-3 pr-3">{p.used}</td>
                    <td className="py-3 pr-3">{p.campaigns}</td>
                    <td className="py-3 pr-3 font-semibold">{m(p.matched)}</td>
                    <td className="py-3 pr-3">{m(p.impressions)}</td>
                    <td className="py-3 pr-3"><Chip label={p.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Impressions Served by Platform</p>
            <div className="space-y-3">
              {platformTotals.map((p) => (
                <div key={p.platform} className="flex items-center gap-3">
                  <span className="w-24 text-xs font-medium text-slate-600">{p.platform}</span>
                  <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all" style={{ width: `${(p.impressions / maxImp) * 100}%` }} />
                  </div>
                  <span className="w-16 text-right text-xs font-semibold text-slate-800">{m(p.impressions)}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>
        </div>

        {/* Section 3 — Brand-Wise Usage (inline expandable) */}
        <Section
          id="brands"
          title="Brand-Wise Usage"
          subtitle="Expand a brand to view linked datasets, cohorts and platform audience usage."
          icon={Building2}
          right={activeBrand ? (
            <button onClick={() => setBrandFilter('All')} className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700 hover:bg-orange-100">
              Brand: {activeBrand.name} <X size={11} />
            </button>
          ) : undefined}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="py-2.5 pr-3 font-semibold">Brand</th>
                  <th className="py-2.5 pr-3 font-semibold">Datasets Used</th>
                  <th className="py-2.5 pr-3 font-semibold">Cohorts Used</th>
                  <th className="py-2.5 pr-3 font-semibold">Platforms Used</th>
                  <th className="py-2.5 pr-3 font-semibold">Platform Matched Size</th>
                  <th className="py-2.5 pr-3 font-semibold">Campaigns / Line Items</th>
                  <th className="py-2.5 pr-3 font-semibold">Impressions Served</th>
                  <th className="py-2.5 pr-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBrands.map((b) => {
                  const open = expandedBrand === b.name;
                  return (
                    <React.Fragment key={b.name}>
                      <tr
                        onClick={() => { setExpandedBrand(open ? null : b.name); setBrandFilter(open ? 'All' : b.name); }}
                        className={`cursor-pointer border-b border-slate-100 transition hover:bg-orange-50/50 ${brandFilter === b.name ? 'bg-orange-50/60' : ''}`}
                      >
                        <td className="py-3 pr-3 font-semibold text-slate-900">
                          <span className="inline-flex items-center gap-2">
                            {open ? <ChevronDown size={14} className="text-orange-500" /> : <ChevronRight size={14} className="text-slate-400" />}
                            {b.name}
                          </span>
                        </td>
                        <td className="py-3 pr-3">{b.datasets}</td>
                        <td className="py-3 pr-3">{b.cohorts}</td>
                        <td className="py-3 pr-3">
                          <div className="flex flex-wrap gap-1">
                            {b.platforms.map((p) => <Chip key={p} label={p} className={platformChip(p)} />)}
                          </div>
                        </td>
                        <td className="py-3 pr-3 font-semibold text-slate-900">{m(b.matched)}</td>
                        <td className="py-3 pr-3">{b.campaigns}</td>
                        <td className="py-3 pr-3 font-medium">{m(b.impressions)}</td>
                        <td className="py-3 pr-3"><Chip label={b.status} /></td>
                      </tr>

                      {open && (
                        <tr className="border-b border-slate-100 bg-slate-50/70">
                          <td colSpan={8} className="px-3 py-4">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Dataset → cohort usage for {b.name}</p>
                            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                              <table className="w-full min-w-[980px] text-xs">
                                <thead>
                                  <tr className="border-b border-slate-200 bg-slate-50 text-left uppercase tracking-wide text-slate-500">
                                    <th className="px-3 py-2 font-semibold">Dataset</th>
                                    <th className="px-3 py-2 font-semibold">Cohort</th>
                                    <th className="px-3 py-2 font-semibold">Category</th>
                                    <th className="px-3 py-2 font-semibold">Approved IDs</th>
                                    <th className="px-3 py-2 font-semibold">Platforms Pushed</th>
                                    <th className="px-3 py-2 font-semibold">Platform Matched Size</th>
                                    <th className="px-3 py-2 font-semibold">Avg. Match Rate</th>
                                    <th className="px-3 py-2 font-semibold">Campaigns / Line Items</th>
                                    <th className="px-3 py-2 font-semibold">Impressions Served</th>
                                    <th className="px-3 py-2 font-semibold">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {b.usage.map((u) => {
                                    const key = `${b.name}|${u.dataset}|${u.cohort}`;
                                    const uOpen = expandedBrandCohort === key;
                                    return (
                                      <React.Fragment key={key}>
                                        <tr
                                          onClick={() => setExpandedBrandCohort(uOpen ? null : key)}
                                          className={`cursor-pointer border-b border-slate-100 transition hover:bg-orange-50/50 ${uOpen ? 'bg-orange-50/50' : ''}`}
                                        >
                                          <td className="px-3 py-2 text-slate-600">
                                            <span className="inline-flex items-center gap-2">
                                              {uOpen ? <ChevronDown size={12} className="text-orange-500" /> : <ChevronRight size={12} className="text-slate-400" />}
                                              {u.dataset}
                                            </span>
                                          </td>
                                          <td className="px-3 py-2 font-medium text-slate-900">{u.cohort}</td>
                                          <td className="px-3 py-2 text-slate-600">{u.category}</td>
                                          <td className="px-3 py-2">{m(u.approvedIds)}</td>
                                          <td className="px-3 py-2">
                                            <div className="flex flex-wrap gap-1">
                                              {u.platformsPushed.map((p) => <Chip key={p} label={p} className={platformChip(p)} />)}
                                            </div>
                                          </td>
                                          <td className="px-3 py-2 font-semibold text-slate-900">{m(u.matched)}</td>
                                          <td className="px-3 py-2">{u.matchRate}%</td>
                                          <td className="px-3 py-2">{u.campaigns}</td>
                                          <td className="px-3 py-2 font-medium">{m(u.impressions)}</td>
                                          <td className="px-3 py-2"><Chip label={u.status} /></td>
                                        </tr>

                                        {uOpen && (
                                          <tr className="border-b border-slate-100 bg-slate-50/80">
                                            <td colSpan={10} className="px-3 py-3">
                                              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Platform audience instances</p>
                                              <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
                                                <table className="w-full min-w-[900px] text-xs">
                                                  <thead>
                                                    <tr className="border-b border-slate-200 bg-slate-50 text-left uppercase tracking-wide text-slate-500">
                                                      <th className="px-3 py-2 font-semibold">Platform</th>
                                                      <th className="px-3 py-2 font-semibold">Platform Audience ID</th>
                                                      <th className="px-3 py-2 font-semibold">Destination Account</th>
                                                      <th className="px-3 py-2 font-semibold">Pushed IDs</th>
                                                      <th className="px-3 py-2 font-semibold">Matched Size</th>
                                                      <th className="px-3 py-2 font-semibold">Match Rate</th>
                                                      <th className="px-3 py-2 font-semibold">Usage Status</th>
                                                      <th className="px-3 py-2 font-semibold">Campaigns / Line Items</th>
                                                      <th className="px-3 py-2 font-semibold">Impressions</th>
                                                    </tr>
                                                  </thead>
                                                  <tbody>
                                                    {u.instances.map((i) => (
                                                      <tr key={i.audienceId} className="border-b border-slate-100 last:border-0">
                                                        <td className="px-3 py-2"><Chip label={i.platform} className={platformChip(i.platform)} /></td>
                                                        <td className="px-3 py-2 font-mono text-[11px] text-slate-700">{i.audienceId}</td>
                                                        <td className="px-3 py-2 text-slate-600">{i.account}</td>
                                                        <td className="px-3 py-2">{m(i.pushed)}</td>
                                                        <td className="px-3 py-2 font-semibold">{m(i.matched)}</td>
                                                        <td className="px-3 py-2">{i.rate}%</td>
                                                        <td className="px-3 py-2"><Chip label={i.usageStatus} /></td>
                                                        <td className="px-3 py-2">{i.campaigns}</td>
                                                        <td className="px-3 py-2">{m(i.impressions)}</td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            </td>
                                          </tr>
                                        )}
                                      </React.Fragment>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {filteredBrands.length === 0 && (
                  <tr><td colSpan={8} className="py-6 text-center text-sm text-slate-500">No approved brand usage for the current filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-slate-500">
            Brand mapping is derived from the approved account permission map. Only approved brand and account / advertiser labels are shown.
          </p>
        </Section>


        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[65fr_35fr]">
        {/* Section 4 — campaigns */}
        <Section id="campaigns" title="Campaign / Line Item Usage" subtitle="Every usage row is linked to a dataset, cohort and platform audience ID." icon={Megaphone}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="py-2.5 pr-3 font-semibold">Dataset</th>
                  <th className="py-2.5 pr-3 font-semibold">Cohort</th>
                  <th className="py-2.5 pr-3 font-semibold">Platform</th>
                  <th className="py-2.5 pr-3 font-semibold">Platform Audience ID</th>
                  <th className="py-2.5 pr-3 font-semibold">Account / Advertiser</th>
                  <th className="py-2.5 pr-3 font-semibold">Campaign / Ad Set / Line Item</th>
                  <th className="py-2.5 pr-3 font-semibold">Usage Type</th>
                  <th className="py-2.5 pr-3 font-semibold">Campaign Status</th>
                  <th className="py-2.5 pr-3 font-semibold">Impressions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCampaigns.map((r, idx) => (
                  <tr key={idx} onClick={() => setDrawer({ type: 'campaign', row: r })} className="cursor-pointer border-b border-slate-100 transition hover:bg-orange-50/50">
                    <td className="py-3 pr-3 text-slate-600">{r.dataset}</td>
                    <td className="py-3 pr-3 font-medium text-slate-900">{r.cohort}</td>
                    <td className="py-3 pr-3"><Chip label={r.platform} className={platformChip(r.platform)} /></td>
                    <td className="py-3 pr-3 font-mono text-xs text-slate-700">{r.audienceId}</td>
                    <td className="py-3 pr-3 text-slate-600">{r.account}</td>
                    <td className="py-3 pr-3">{r.object}</td>
                    <td className="py-3 pr-3">{r.usageType}</td>
                    <td className="py-3 pr-3"><Chip label={r.status} /></td>
                    <td className="py-3 pr-3 font-semibold">{m(r.impressions)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* Section 5 — governance */}
        <Section id="governance" title="Governance Alerts" subtitle="Review flags linked to dataset, cohort, platform and platform audience ID." icon={ShieldAlert}>
          {filteredAlerts.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-500">No open governance alerts for the current filters.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-[11px] uppercase tracking-wide text-slate-500">
                    <th className="py-2.5 pr-3 font-semibold">Alert</th>
                    <th className="py-2.5 pr-3 font-semibold">Dataset</th>
                    <th className="py-2.5 pr-3 font-semibold">Cohort</th>
                    <th className="py-2.5 pr-3 font-semibold">Platform</th>
                    <th className="py-2.5 pr-3 font-semibold">Platform Audience ID</th>
                    <th className="py-2.5 pr-3 font-semibold">Severity</th>
                    <th className="py-2.5 pr-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAlerts.map((a) => (
                    <tr key={a.audienceId + a.alert} onClick={() => setDrawer({ type: 'governance', alert: a })} className="cursor-pointer border-b border-slate-100 transition hover:bg-orange-50/50">
                      <td className="py-3 pr-3 font-medium text-slate-900">{a.alert}</td>
                      <td className="py-3 pr-3 text-slate-600">{a.dataset}</td>
                      <td className="py-3 pr-3 text-slate-600">{a.cohort}</td>
                      <td className="py-3 pr-3"><Chip label={a.platform} className={platformChip(a.platform)} /></td>
                      <td className="py-3 pr-3 font-mono text-xs text-slate-700">{a.audienceId}</td>
                      <td className="py-3 pr-3"><Chip label={a.severity} /></td>
                      <td className="py-3 pr-3"><Chip label={a.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
        </div>

        {/* Footer */}
        <footer className="rounded-2xl border border-slate-200 bg-white p-5 text-xs leading-relaxed text-slate-500">
          <p className="font-semibold text-slate-700">Last refreshed: 13 Aug 2026, 10:30 AM IST</p>
          <p className="mt-2">
            <span className="font-semibold text-slate-700">Visibility note: </span>
            Reporting is limited to approved platforms and accounts where WPP has API/reporting access. The dashboard does not expose raw
            user data or user-level records. Audience sharing or cross-account usage is treated as a review flag and governed as per agreed
            contract and approved use cases.
          </p>
        </footer>
      </div>

      {/* Drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-[2px]" onClick={() => setDrawer(null)} />
          <aside className="relative h-full w-full max-w-md overflow-y-auto border-l border-slate-200 bg-white shadow-2xl">
            <div className="sticky top-0 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-orange-600">
                  {drawer.type === 'cohort' ? 'Cohort Detail' : drawer.type === 'campaign' ? 'Usage Detail' : drawer.type === 'governance' ? 'Governance Review' : 'Detail'}
                </p>
                <h3 className="text-base font-semibold text-slate-900">
                  {drawer.type === 'cohort' ? drawer.cohort.cohort : drawer.type === 'campaign' ? drawer.row.object : drawer.type === 'governance' ? drawer.alert.alert : drawer.title}
                </h3>
              </div>
              <button onClick={() => setDrawer(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={16} /></button>
            </div>

            <div className="px-5 py-4">
              {drawer.type === 'cohort' && (
                <>
                  <Row label="Dataset" value={drawer.cohort.dataset} />
                  <Row label="Cohort" value={drawer.cohort.cohort} />
                  <Row label="Category" value={drawer.cohort.category} />
                  <Row label="Approved IDs" value={m(drawer.cohort.approvedIds)} />
                  <Row label="Refresh date" value={drawer.cohort.refresh} />
                  <Row label="Expiry date" value={drawer.cohort.expiry} />
                  <Row label="Allowed platforms" value={drawer.cohort.allowedPlatforms} />
                  <Row label="Allowed accounts" value={drawer.cohort.allowedAccounts} />
                  <Row label="Usage rights" value={drawer.cohort.usageRights} />
                  <Row label="Governance status" value={<Chip label={drawer.cohort.governance} />} />
                  <Row label="Last checked" value={drawer.cohort.lastChecked} />

                  <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Platform audience instances</p>
                  <div className="mt-2 space-y-2">
                    {drawer.cohort.instances.map((i) => (
                      <div key={i.audienceId} className="rounded-xl border border-slate-200 p-3">
                        <div className="flex items-center justify-between">
                          <Chip label={i.platform} className={platformChip(i.platform)} />
                          <span className="font-mono text-[11px] text-slate-500">{i.audienceId}</span>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                          <div><p className="text-[10px] uppercase text-slate-400">Matched</p><p className="text-sm font-semibold">{m(i.matched)}</p></div>
                          <div><p className="text-[10px] uppercase text-slate-400">Rate</p><p className="text-sm font-semibold">{i.rate}%</p></div>
                          <div><p className="text-[10px] uppercase text-slate-400">Impressions</p><p className="text-sm font-semibold">{m(i.impressions)}</p></div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-2">
                    <button onClick={() => { setDrawer(null); scrollTo('platforms'); }} className="rounded-lg bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600">View Platform Match</button>
                    <button onClick={() => { setCohortFilter(drawer.cohort.cohort); setDrawer(null); scrollTo('campaigns'); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">View Campaign Usage</button>
                    <button onClick={() => { setDrawer(null); scrollTo('governance'); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">View Governance Review</button>
                  </div>
                </>
              )}

              {drawer.type === 'campaign' && (
                <>
                  <Row label="Dataset" value={drawer.row.dataset} />
                  <Row label="Cohort" value={drawer.row.cohort} />
                  <Row label="Platform" value={<Chip label={drawer.row.platform} className={platformChip(drawer.row.platform)} />} />
                  <Row label="Platform audience ID" value={<span className="font-mono text-xs">{drawer.row.audienceId}</span>} />
                  <Row label="Approved account" value={drawer.row.account} />
                  <Row label="Campaign / line item" value={drawer.row.object} />
                  <Row label="Usage type" value={drawer.row.usageType} />
                  <Row label="Targeting or suppression" value={drawer.row.usageType === 'Suppression' ? 'Suppression' : 'Targeting'} />
                  <Row label="Flight start" value={drawer.row.flightStart} />
                  <Row label="Flight end" value={drawer.row.flightEnd} />
                  <Row label="Campaign status" value={<Chip label={drawer.row.status} />} />
                  <Row label="Impressions served" value={m(drawer.row.impressions)} />
                  <Row label="Last delivery refresh" value={drawer.row.lastDelivery} />
                  <Row label="Within approved scope" value={<Chip label={drawer.row.inScope === 'Yes' ? 'Clear' : 'Under Review'} />} />
                  <p className="mt-4 rounded-lg bg-slate-50 p-3 text-[11px] text-slate-500">
                    Spend, clicks, conversions and revenue are hidden by default. Impressions served is the primary delivery metric.
                  </p>
                </>
              )}

              {drawer.type === 'governance' && (
                <>
                  <Row label="Alert type" value={drawer.alert.alert} />
                  <Row label="Dataset" value={drawer.alert.dataset} />
                  <Row label="Cohort" value={drawer.alert.cohort} />
                  <Row label="Platform" value={<Chip label={drawer.alert.platform} className={platformChip(drawer.alert.platform)} />} />
                  <Row label="Platform audience ID" value={<span className="font-mono text-xs">{drawer.alert.audienceId}</span>} />
                  <Row label="Approved account" value={drawer.alert.account} />
                  <Row label="Severity" value={<Chip label={drawer.alert.severity} />} />
                  <Row label="Detection date" value={drawer.alert.detected} />
                  <Row label="Why it was flagged" value={drawer.alert.why} />
                  <Row label="Contract rule checked" value={drawer.alert.rule} />
                  <Row label="Required action" value={drawer.alert.action} />
                  <Row label="Owner" value={drawer.alert.owner} />
                  <Row label="Current status" value={<Chip label={drawer.alert.status} />} />
                  <p className="mt-4 rounded-lg border border-orange-100 bg-orange-50 p-3 text-[11px] leading-relaxed text-orange-800">
                    {drawer.alert.notes}
                  </p>
                </>
              )}


            </div>
          </aside>
        </div>
      )}
    </div>
  );
};

export default SwiggyPartnerDashboard;
