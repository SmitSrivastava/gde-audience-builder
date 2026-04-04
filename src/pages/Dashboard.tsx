
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Database, Sparkles, Target, Activity, ArrowRight } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  const insights = [
    'India OTT market in growth stage',
    'Never Members average 1.6 OTT subscriptions',
    'Members average 4.2 OTT subscriptions'
  ];

  const stats = [
    { label: 'Active Audience Cohorts', value: '18', badge: 'N' },
    { label: 'Connected Data Partners', value: '12', badge: 'N' },
    { label: 'Enriched Audience Sets', value: '9', badge: 'N' },
    { label: 'Activated Cohorts', value: '6', badge: 'N' },
    { label: 'Estimated Reachable Profiles', value: '42.8M', badge: 'N' }
  ];

  const cohortCategories = [
    {
      title: 'OTT Maturity Cohorts',
      subtitle: 'Identify users based on subscription behavior and OTT adoption stage',
      chips: ['Single OTT Users', 'Multi-OTT Power Users', 'OTT Trial Users', 'Cord Cutters'],
      size: '35M', conversion: 'High', enrichmentReady: true,
    },
    {
      title: 'Affluence & Spending Capacity',
      subtitle: 'Segment users by purchasing power and spending patterns across platforms',
      chips: ['Premium Spenders', 'Mid-Tier Buyers', 'Value Seekers'],
      size: '28M', conversion: 'High', enrichmentReady: true,
    },
    {
      title: 'Viewing Affinity Intelligence',
      subtitle: 'Map content preferences and genre affinities for precision targeting',
      chips: ['Drama Enthusiasts', 'Sports Fanatics', 'Documentary Watchers', 'K-Content Fans'],
      size: '42M', conversion: 'Medium', enrichmentReady: true,
    },
    {
      title: 'Platform Behavior & Attention Source',
      subtitle: 'Understand cross-platform engagement and attention allocation patterns',
      chips: ['Mobile-First Viewers', 'CTV Dominant', 'Multi-Screen Users'],
      size: '31M', conversion: 'Medium', enrichmentReady: false,
    },
    {
      title: 'Life Stage & Household Context',
      subtitle: 'Target based on household composition, life events, and family dynamics',
      chips: ['Young Professionals', 'New Parents', 'Empty Nesters', 'Student Households'],
      size: '22M', conversion: 'High', enrichmentReady: true,
    }
  ];

  const recentActivities = [
    { text: 'Urban Premium OTT Viewers enriched with affluence signals', time: '2 mins ago' },
    { text: 'Business Drama Audience activated on Meta', time: '12 mins ago' },
    { text: 'Family Business Cohort synced to DV360', time: '1 hour ago' },
    { text: 'Multi-OTT Power Users segment refreshed', time: '3 hours ago' }
  ];

  const quickActions = [
    { title: 'Build from Cohort', description: 'Start from a pre-built audience template', icon: Users, action: () => navigate('/segmentation') },
    { title: 'Enrich Audience', description: 'Enhance client data with audience insights', icon: Sparkles, action: () => navigate('/enrichment') },
    { title: 'Activate to Platform', description: 'Deploy audiences to ad platforms', icon: Target, action: () => navigate('/activation') },
    { title: 'Explore Audience Intelligence', description: 'Deep-dive into cohort analytics', icon: Database, action: () => navigate('/segmentation') },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="hero-gradient rounded-2xl p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[hsl(0_85%_50%/0.08)] rounded-full blur-[100px]"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-[hsl(0_85%_30%/0.06)] rounded-full blur-[80px]"></div>
        <div className="relative z-10">
          <h1 className="text-5xl font-extrabold text-foreground mb-4 tracking-tight">
            Welcome to WPP Data Exchange
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
            Powering Netflix's next phase of growth through precision audience intelligence, enrichment, and activation across India's evolving OTT landscape
          </p>
        </div>

        {/* Insight Chips */}
        <div className="relative z-10 flex flex-wrap gap-3 mt-8">
          {insights.map((insight, i) => (
            <span key={i} className="pill-chip">{insight}</span>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="relative bg-card rounded-xl p-5 neon-border neon-border-hover card-hover cursor-default">
            {stat.badge && (
              <span className="absolute top-3 right-3 netflix-badge">{stat.badge}</span>
            )}
            <div className="text-4xl font-extrabold text-foreground mb-1">{stat.value}</div>
            <div className="text-xs text-muted-foreground font-medium">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Featured Cohorts */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Featured Ready-to-Use Cohorts</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {cohortCategories.map((cat, index) => (
            <div
              key={index}
              className="bg-card rounded-xl p-6 neon-border neon-border-hover card-hover flex flex-col justify-between"
            >
              <div>
                <h3 className="text-xl font-bold text-foreground mb-1">{cat.title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{cat.subtitle}</p>
                <div className="flex flex-wrap gap-2 mb-5">
                  {cat.chips.map((chip, ci) => (
                    <button
                      key={ci}
                      onClick={() => navigate('/segmentation/create')}
                      className="pill-chip text-xs cursor-pointer"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metadata Strip */}
              <div className="border-t border-border pt-4 flex items-center justify-between">
                <div className="flex gap-5 text-xs text-muted-foreground">
                  <span>~<strong className="text-foreground">{cat.size}</strong> Reach</span>
                  <span>Conversion: <strong className={cat.conversion === 'High' ? 'text-primary' : 'text-foreground'}>{cat.conversion}</strong></span>
                  <span>Enrichment: <strong className={cat.enrichmentReady ? 'text-primary' : 'text-muted-foreground'}>{cat.enrichmentReady ? 'Ready' : 'Pending'}</strong></span>
                </div>
                <button
                  onClick={() => navigate('/segmentation/create')}
                  className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Explore Cohorts <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-card rounded-xl neon-border">
          <div className="p-5 border-b border-border flex items-center gap-3">
            <Activity className="text-primary" size={20} />
            <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
          </div>
          <div className="p-5 space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <p className="text-sm text-foreground">{activity.text}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-card rounded-xl neon-border">
          <div className="p-5 border-b border-border flex items-center gap-3">
            <Target className="text-primary" size={20} />
            <h3 className="text-lg font-semibold text-foreground">Quick Actions</h3>
          </div>
          <div className="p-5 space-y-3">
            {quickActions.map((action, index) => (
              <button key={index} onClick={action.action} className="w-full group">
                <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-all duration-200 text-left">
                  <div className="w-10 h-10 bg-primary/15 border border-primary/30 rounded-lg flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                    <action.icon size={18} className="text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-foreground text-sm group-hover:text-primary transition-colors">{action.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{action.description}</div>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
