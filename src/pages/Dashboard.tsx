
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Sparkles, Target, Activity, ArrowRight, ChevronDown, ChevronUp, Database } from 'lucide-react';
import { cohortCategories } from '@/data/audiences';
import { useSavedAudiences } from '@/contexts/SavedAudiencesContext';
import netflixLogo from '@/assets/netflix-logo.png';


const Dashboard = () => {
  const navigate = useNavigate();
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const { savedAudiences } = useSavedAudiences();

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const insights = [
    'India OTT penetration growing rapidly',
    'Multi-OTT consumption rising across metros',
    'Premium audiences driving subscription growth'
  ];

  const stats = [
    { label: 'Active Audience Cohorts', value: '18', badge: 'N' },
    { label: 'Connected Data Partners', value: '12', badge: 'N' },
    { label: 'Enriched Audience Sets', value: '9', badge: 'N' },
    { label: 'Activated Cohorts', value: '6', badge: 'N' },
    { label: 'Estimated Reachable Profiles', value: '42.8M', badge: 'N' }
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
        <div className="absolute top-1/2 right-12 -translate-y-1/2 opacity-[0.06]">
          <img src={netflixLogo} alt="" className="h-48 object-contain" aria-hidden="true" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <img src={netflixLogo} alt="Netflix" className="h-10 object-contain" />
          </div>
          <h1 className="text-4xl font-extrabold text-foreground mb-3 tracking-tight">
            Welcome to WPP Data Exchange
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
            Powering Netflix's next phase of growth through precision audience intelligence, enrichment, and activation across India's evolving OTT landscape
          </p>
        </div>
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
        <div className="space-y-4">
          {cohortCategories.map((cat) => {
            const isExpanded = expandedCategories.includes(cat.id);
            const totalSize = (cat as any).totalSize;
            return (
              <div key={cat.id} className="bg-card rounded-xl neon-border neon-border-hover card-hover overflow-hidden">
                <button
                  onClick={() => toggleCategory(cat.id)}
                  className="w-full flex items-center justify-between p-6 text-left hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground">{cat.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{cat.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-2xl font-extrabold text-primary">{totalSize}</div>
                      <div className="text-xs text-muted-foreground">total users</div>
                    </div>
                    {isExpanded ? <ChevronUp className="text-muted-foreground" size={20} /> : <ChevronDown className="text-muted-foreground" size={20} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border">
                    {cat.subAudiences.map((sub) => (
                      <div key={sub.id} className="flex items-center justify-between px-6 py-4 border-b border-border/50 last:border-b-0 hover:bg-secondary/20 transition-colors">
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => navigate(`/segmentation/create?audience=${sub.id}`)}
                            className="text-foreground font-medium hover:text-primary transition-colors text-left"
                          >
                            {sub.name}
                          </button>
                          <div className="text-xs text-muted-foreground mt-0.5">Attributes: {sub.attributes.join(', ')}</div>
                          <div className="flex items-center gap-3 mt-1.5">
                            <div className="flex items-center gap-1">
                              {sub.activationPlatforms.map(p => (
                                <span key={p} className="text-xs" title={p}>{platformIcons[p] || '📡'}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <div className="text-lg font-bold text-foreground">{sub.size}</div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/enrichment/audiences/${sub.id}`)}
                              className="px-3 py-1.5 bg-primary/15 text-primary text-xs font-medium rounded-lg border border-primary/30 hover:bg-primary/25 transition-colors"
                            >
                              Enrich
                            </button>
                            <button
                              onClick={() => navigate(`/activation/audiences/${sub.id}`)}
                              className="px-3 py-1.5 bg-secondary text-foreground text-xs font-medium rounded-lg border border-border hover:bg-secondary/80 transition-colors"
                            >
                              Activate
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {savedAudiences.length > 0 && (
            <div className="bg-card rounded-xl neon-border overflow-hidden">
              <div className="p-6">
                <h3 className="text-xl font-bold text-foreground">Custom Audiences</h3>
                <p className="text-sm text-muted-foreground mt-1">Audiences created during this session</p>
              </div>
              <div className="border-t border-border">
                {savedAudiences.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between px-6 py-4 border-b border-border/50 last:border-b-0 hover:bg-secondary/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <button onClick={() => navigate(`/segmentation/create?audience=${sub.id}`)} className="text-foreground font-medium hover:text-primary transition-colors text-left">{sub.name}</button>
                      <div className="text-xs text-muted-foreground mt-0.5">Attributes: {sub.attributes.join(', ')}</div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-lg font-bold text-foreground">{sub.size}</div>
                      <div className="flex gap-2">
                        <button onClick={() => navigate(`/enrichment/audiences/${sub.id}`)} className="px-3 py-1.5 bg-primary/15 text-primary text-xs font-medium rounded-lg border border-primary/30 hover:bg-primary/25 transition-colors">Enrich</button>
                        <button onClick={() => navigate(`/activation/audiences/${sub.id}`)} className="px-3 py-1.5 bg-secondary text-foreground text-xs font-medium rounded-lg border border-border hover:bg-secondary/80 transition-colors">Activate</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
