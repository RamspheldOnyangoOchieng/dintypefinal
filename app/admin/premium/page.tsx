"use client";

import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Save } from 'lucide-react';

interface TokenPackage {
    id: string;
    name: string;
    tokens: number;
    price: number;
    description: string;
    active: boolean;
}

interface TokenCost {
    id: string;
    feature_key: string;
    feature_name_sv: string;
    cost_tokens: number;
    description_sv: string;
    active: boolean;
}

export default function AdminPremiumPage() {
    const [tokenPackages, setTokenPackages] = useState<TokenPackage[]>([]);
    const [tokenCosts, setTokenCosts] = useState<TokenCost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingPackage, setEditingPackage] = useState<TokenPackage | null>(null);
    const [editingCost, setEditingCost] = useState<TokenCost | null>(null);
    const supabase = createClientComponentClient();

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            // Fetch token packages
            const { data: packages, error: packagesError } = await supabase
                .from('token_packages')
                .select('*')
                .order('tokens', { ascending: true });

            if (packagesError) throw packagesError;
            setTokenPackages(packages || []);

            // Fetch token costs
            const { data: costs, error: costsError } = await supabase
                .from('token_costs')
                .select('*')
                .order('feature_key');

            if (costsError) throw costsError;
            setTokenCosts(costs || []);
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load data');
        } finally {
            setIsLoading(false);
        }
    }

    async function savePackage(pkg: TokenPackage) {
        try {
            const { error } = await supabase
                .from('token_packages')
                .upsert({
                    ...pkg,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            toast.success('Token package saved!');
            setEditingPackage(null);
            fetchData();
        } catch (error) {
            console.error('Error saving package:', error);
            toast.error('Failed to save package');
        }
    }

    async function deletePackage(id: string) {
        if (!confirm('Are you sure you want to delete this package?')) return;

        try {
            const { error } = await supabase
                .from('token_packages')
                .delete()
                .eq('id', id);

            if (error) throw error;

            toast.success('Package deleted!');
            fetchData();
        } catch (error) {
            console.error('Error deleting package:', error);
            toast.error('Failed to delete package');
        }
    }

    async function saveCost(cost: TokenCost) {
        try {
            const { error } = await supabase
                .from('token_costs')
                .upsert({
                    ...cost,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;

            toast.success('Token cost saved!');
            setEditingCost(null);
            fetchData();
        } catch (error) {
            console.error('Error saving cost:', error);
            toast.error('Failed to save cost');
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="container max-w-7xl mx-auto py-8 px-4">
            <h1 className="text-4xl font-bold mb-8">Premium Management</h1>

            {/* Token Packages Section */}
            <Card className="p-6 mb-8">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Token Packages</h2>
                    <Button
                        onClick={() => setEditingPackage({
                            id: '',
                            name: '',
                            tokens: 0,
                            price: 0,
                            description: '',
                            active: true
                        })}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Package
                    </Button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted">
                            <tr>
                                <th className="text-left p-3">Name</th>
                                <th className="text-left p-3">Tokens</th>
                                <th className="text-left p-3">Price (kr)</th>
                                <th className="text-left p-3">Description</th>
                                <th className="text-left p-3">Active</th>
                                <th className="text-left p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tokenPackages.map((pkg) => (
                                <tr key={pkg.id} className="border-b">
                                    <td className="p-3">{pkg.name}</td>
                                    <td className="p-3">{pkg.tokens}</td>
                                    <td className="p-3">{pkg.price} kr</td>
                                    <td className="p-3">{pkg.description}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs ${pkg.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {pkg.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-3 space-x-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditingPackage(pkg)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() => deletePackage(pkg.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Token Costs Section */}
            <Card className="p-6">
                <h2 className="text-2xl font-bold mb-6">Token Costs per Feature</h2>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted">
                            <tr>
                                <th className="text-left p-3">Feature</th>
                                <th className="text-left p-3">Cost (tokens)</th>
                                <th className="text-left p-3">Description</th>
                                <th className="text-left p-3">Active</th>
                                <th className="text-left p-3">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {tokenCosts.map((cost) => (
                                <tr key={cost.id} className="border-b">
                                    <td className="p-3 font-medium">{cost.feature_name_sv}</td>
                                    <td className="p-3 font-bold">{cost.cost_tokens}</td>
                                    <td className="p-3">{cost.description_sv}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-1 rounded text-xs ${cost.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {cost.active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="p-3">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditingCost(cost)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Edit Package Modal */}
            {editingPackage && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">
                            {editingPackage.id ? 'Edit Token Package' : 'Add Token Package'}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Name</label>
                                <Input
                                    value={editingPackage.name}
                                    onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                                    placeholder="200 tokens"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Tokens</label>
                                <Input
                                    type="number"
                                    value={editingPackage.tokens}
                                    onChange={(e) => setEditingPackage({ ...editingPackage, tokens: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Price (kr)</label>
                                <Input
                                    type="number"
                                    value={editingPackage.price}
                                    onChange={(e) => setEditingPackage({ ...editingPackage, price: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <Input
                                    value={editingPackage.description}
                                    onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                                    placeholder="200 tokens för 99kr"
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="active"
                                    checked={editingPackage.active}
                                    onChange={(e) => setEditingPackage({ ...editingPackage, active: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="active" className="text-sm font-medium">Active</label>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button
                                    className="flex-1"
                                    onClick={() => savePackage(editingPackage)}
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setEditingPackage(null)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Edit Cost Modal */}
            {editingCost && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4">Edit Token Cost</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Feature Name (Swedish)</label>
                                <Input
                                    value={editingCost.feature_name_sv}
                                    onChange={(e) => setEditingCost({ ...editingCost, feature_name_sv: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Cost (tokens)</label>
                                <Input
                                    type="number"
                                    value={editingCost.cost_tokens}
                                    onChange={(e) => setEditingCost({ ...editingCost, cost_tokens: parseInt(e.target.value) || 0 })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Description (Swedish)</label>
                                <Input
                                    value={editingCost.description_sv}
                                    onChange={(e) => setEditingCost({ ...editingCost, description_sv: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="cost-active"
                                    checked={editingCost.active}
                                    onChange={(e) => setEditingCost({ ...editingCost, active: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="cost-active" className="text-sm font-medium">Active</label>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button
                                    className="flex-1"
                                    onClick={() => saveCost(editingCost)}
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setEditingCost(null)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}
        </div>
    );
}
