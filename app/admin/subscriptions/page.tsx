"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, DollarSign, Users, TrendingUp, ShieldCheck } from 'lucide-react';

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  plan_type: string;
  price_eur: number;
  price_sek: number;
  stripe_subscription_id: string;
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  user_email?: string;
  source?: 'stripe' | 'manual';
}

interface Stats {
  totalSubscriptions: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  newThisMonth: number;
}

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats>({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    newThisMonth: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
    fetchSubscriptions();
  }, []);

  async function fetchSubscriptions() {
    try {
      // Only show full loader if we don't have subscriptions yet
      if (subscriptions.length === 0) {
        setIsLoading(true);
      }

      // 1. Fetch from premium_subscriptions (Stripe-based)
      const { data: stripeData, error: stripeError } = await supabase
        .from('premium_subscriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (stripeError) {
        console.warn('Error fetching premium_subscriptions:', stripeError);
      }

      // 2. Fetch from premium_profiles (Manual/Migrations)
      const { data: profileData, error: profileError } = await supabase
        .from('premium_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileError) {
        console.warn('Error fetching premium_profiles:', profileError);
      }

      // 3. Fetch all profiles to get emails (more robust than joins if FKs are missing)
      const userIds = [
        ...(stripeData || []).map(s => s.user_id),
        ...(profileData || []).map(p => p.user_id)
      ];

      let profileEmailMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, email')
          .in('id', userIds);

        if (!profilesError && profiles) {
          profiles.forEach(p => {
            profileEmailMap[p.id] = p.email;
          });
        }
      }

      // Consolidate data
      const consolidated: Subscription[] = [];
      const processedUserIds = new Set<string>();

      // Add Stripe subscriptions first
      (stripeData || []).forEach((sub: any) => {
        consolidated.push({
          ...sub,
          user_email: profileEmailMap[sub.user_id] || 'Unknown',
          source: 'stripe'
        });
        processedUserIds.add(sub.user_id);
      });

      // Add profiles if not already added via Stripe
      (profileData || []).forEach((prof: any) => {
        if (!processedUserIds.has(prof.user_id)) {
          const expiresAt = new Date(prof.expires_at);
          const isActive = expiresAt > new Date();

          consolidated.push({
            id: prof.id || prof.user_id, // Fallback to user_id if id is missing in profile data
            user_id: prof.user_id,
            status: isActive ? 'active' : 'expired',
            plan_type: 'premium',
            price_eur: 11,
            price_sek: 110,
            stripe_subscription_id: 'MANUAL',
            current_period_start: prof.created_at,
            current_period_end: prof.expires_at,
            created_at: prof.created_at,
            user_email: profileEmailMap[prof.user_id] || 'Unknown',
            source: 'manual'
          });
        }
      });

      setSubscriptions(consolidated);

      // Calculate stats
      const active = consolidated.filter((s: Subscription) => s.status === 'active').length;
      const thisMonth = consolidated.filter((s: Subscription) => {
        const created = new Date(s.created_at);
        const now = new Date();
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).length;

      const revenue = consolidated
        .filter((s: Subscription) => s.status === 'active')
        .reduce((sum: number, s: Subscription) => sum + (s.price_sek || 0), 0);

      setStats({
        totalSubscriptions: consolidated.length,
        activeSubscriptions: active,
        monthlyRevenue: revenue,
        newThisMonth: thisMonth
      });
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('Failed to load subscriptions');
    } finally {
      setIsLoading(false);
    }
  }

  async function cancelSubscription(subscriptionId: string, source?: string) {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;

    try {
      if (source === 'manual') {
        // Update premium_profiles
        const { error } = await supabase
          .from('premium_profiles')
          .update({
            expires_at: new Date().toISOString()
          })
          .eq('id', subscriptionId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('premium_subscriptions')
          .update({
            status: 'cancelled',
            cancelled_at: new Date().toISOString()
          })
          .eq('id', subscriptionId);
        if (error) throw error;
      }

      toast.success('Subscription updated');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription');
    }
  }

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch = sub.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.stripe_subscription_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // Stabilize hydration and loading states
  if (!mounted || (isLoading && subscriptions.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[80vh] bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">Laddar prenumerationer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-primary/10 rounded-2xl">
          <ShieldCheck className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Premium Subscriptions</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6 border-none bg-card/50 backdrop-blur-xl shadow-xl ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Subscriptions</p>
              <p className="text-3xl font-bold">{stats.totalSubscriptions}</p>
            </div>
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-none bg-card/50 backdrop-blur-xl shadow-xl ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Active</p>
              <p className="text-3xl font-bold text-green-500">{stats.activeSubscriptions}</p>
            </div>
            <div className="p-3 bg-green-500/10 rounded-xl">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-none bg-card/50 backdrop-blur-xl shadow-xl ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Monthly Revenue</p>
              <p className="text-3xl font-bold">{stats.monthlyRevenue} kr</p>
            </div>
            <div className="p-3 bg-yellow-500/10 rounded-xl">
              <DollarSign className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
        </Card>

        <Card className="p-6 border-none bg-card/50 backdrop-blur-xl shadow-xl ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">New This Month</p>
              <p className="text-3xl font-bold text-purple-500">{stats.newThisMonth}</p>
            </div>
            <div className="p-3 bg-purple-500/10 rounded-xl">
              <Calendar className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6 border-none bg-card/30 backdrop-blur shadow-lg ring-1 ring-white/5">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or subscription ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-background/50 border-white/10"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-white/10 rounded-md bg-background/50 text-sm focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </Card>

      {/* Subscriptions Table */}
      <Card className="border-none bg-card/50 backdrop-blur-xl shadow-2xl ring-1 ring-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">User Email</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Plan</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Source</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Period End</th>
                <th className="text-left p-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="h-8 w-8 opacity-20" />
                      <p>No active subscriptions found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <tr key={`${sub.id}-${sub.source}`} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground">{sub.user_email}</span>
                        <span className="text-[10px] text-muted-foreground mt-0.5">{sub.stripe_subscription_id}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${sub.status === 'active'
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                        {sub.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <Badge variant="outline" className="capitalize bg-primary/5 text-primary border-primary/20">
                        {sub.plan_type}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${sub.source === 'manual' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'
                        }`}>
                        {sub.source === 'manual' ? 'MANUAL' : 'STRIPE'}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground font-mono">
                      {sub.current_period_end
                        ? new Date(sub.current_period_end).toLocaleDateString('sv-SE')
                        : 'N/A'
                      }
                    </td>
                    <td className="p-4 text-right">
                      {sub.status === 'active' && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all font-bold text-xs"
                          onClick={() => cancelSubscription(sub.id, sub.source)}
                        >
                          Revoke Access
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredSubscriptions.length > 0 && (
          <div className="p-4 border-t border-white/5 text-xs text-muted-foreground text-center bg-white/5">
            Displaying {filteredSubscriptions.length} records. Premium Profiles are merged with Stripe Subscriptions.
          </div>
        )}
      </Card>
    </div>
  );
}
