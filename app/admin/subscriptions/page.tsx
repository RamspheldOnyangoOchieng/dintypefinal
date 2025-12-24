"use client";

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Search, Calendar, DollarSign, Users, TrendingUp } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const supabase = createClientComponentClient();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  async function fetchSubscriptions() {
    try {
      setIsLoading(true);

      // Fetch subscriptions
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .select(`
          *,
          profiles!inner(email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Add user email to subscriptions
      const subsWithEmail = (data || []).map((sub: any) => ({
        ...sub,
        user_email: sub.profiles?.email || 'Unknown'
      }));

      setSubscriptions(subsWithEmail);

      // Calculate stats
      const active = subsWithEmail.filter((s: Subscription) => s.status === 'active').length;
      const thisMonth = subsWithEmail.filter((s: Subscription) => {
        const created = new Date(s.created_at);
        const now = new Date();
        return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
      }).length;

      const revenue = subsWithEmail
        .filter((s: Subscription) => s.status === 'active')
        .reduce((sum: number, s: Subscription) => sum + s.price_sek, 0);

      setStats({
        totalSubscriptions: subsWithEmail.length,
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

  async function cancelSubscription(subscriptionId: string) {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;

    try {
      const { error } = await supabase
        .from('premium_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', subscriptionId);

      if (error) throw error;

      toast.success('Subscription cancelled');
      fetchSubscriptions();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    }
  }

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch = sub.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         sub.stripe_subscription_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || sub.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <h1 className="text-4xl font-bold mb-8">Premium Subscriptions</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Subscriptions</p>
              <p className="text-3xl font-bold">{stats.totalSubscriptions}</p>
            </div>
            <Users className="h-10 w-10 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active</p>
              <p className="text-3xl font-bold text-green-600">{stats.activeSubscriptions}</p>
            </div>
            <TrendingUp className="h-10 w-10 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Monthly Revenue</p>
              <p className="text-3xl font-bold">{stats.monthlyRevenue} kr</p>
            </div>
            <DollarSign className="h-10 w-10 text-yellow-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">New This Month</p>
              <p className="text-3xl font-bold text-purple-600">{stats.newThisMonth}</p>
            </div>
            <Calendar className="h-10 w-10 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email or subscription ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border rounded-md bg-background"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="cancelled">Cancelled</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </Card>

      {/* Subscriptions Table */}
      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3">User Email</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Plan</th>
                <th className="text-left p-3">Price</th>
                <th className="text-left p-3">Period End</th>
                <th className="text-left p-3">Created</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-muted-foreground">
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b">
                    <td className="p-3 font-medium">{sub.user_email}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        sub.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : sub.status === 'cancelled'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                      }`}>
                        {sub.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-3 capitalize">{sub.plan_type}</td>
                    <td className="p-3">{sub.price_sek} kr / {sub.price_eur} €</td>
                    <td className="p-3">
                      {sub.current_period_end 
                        ? new Date(sub.current_period_end).toLocaleDateString('sv-SE')
                        : 'N/A'
                      }
                    </td>
                    <td className="p-3">
                      {new Date(sub.created_at).toLocaleDateString('sv-SE')}
                    </td>
                    <td className="p-3">
                      {sub.status === 'active' && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => cancelSubscription(sub.id)}
                        >
                          Cancel
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
          <div className="mt-4 text-sm text-muted-foreground text-center">
            Showing {filteredSubscriptions.length} of {subscriptions.length} subscriptions
          </div>
        )}
      </Card>
    </div>
  );
}
