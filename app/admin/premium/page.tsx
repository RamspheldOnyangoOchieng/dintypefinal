"use client";

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Save } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';

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
    const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
    const [packageToDelete, setPackageToDelete] = useState<string[] | null>(null);
    const supabase = createClient();

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        try {
            const { data: packages, error: packagesError } = await supabase
                .from('token_packages')
                .select('*')
                .order('tokens', { ascending: true });

            if (packagesError) throw packagesError;
            setTokenPackages(packages || []);
            
            setSelectedPackages([]);

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

    async function executeDelete(ids: string[]) {
        try {
            const { error } = await supabase
                .from('token_packages')
                .delete()
                .in('id', ids);

            if (error) throw error;

            toast.success(`${ids.length} package(s) deleted!`);
            setPackageToDelete(null);
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

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedPackages(tokenPackages.map(p => p.id));
        } else {
            setSelectedPackages([]);
        }
    };

    const toggleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            setSelectedPackages(prev => [...prev, id]);
        } else {
            setSelectedPackages(prev => prev.filter(pId => pId !== id));
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="container max-w-7xl mx-auto py-8 px-4 space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Premium Management</h1>
            </div>

            {/* Token Packages Section */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-bold">Token Packages</CardTitle>
                        <CardDescription>Manage available token packages for users.</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedPackages.length > 0 && (
                             <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setPackageToDelete(selectedPackages)}
                             >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Selected ({selectedPackages.length})
                             </Button>
                        )}
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
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[50px]">
                                        <Checkbox
                                            checked={selectedPackages.length === tokenPackages.length && tokenPackages.length > 0}
                                            onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                                        />
                                    </th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Tokens</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Price (kr)</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Description</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tokenPackages.map((pkg) => (
                                    <tr key={pkg.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                        <td className="p-4 align-middle">
                                            <Checkbox
                                                checked={selectedPackages.includes(pkg.id)}
                                                onCheckedChange={(checked) => toggleSelectOne(pkg.id, !!checked)}
                                            />
                                        </td>
                                        <td className="p-4 align-middle font-medium">{pkg.name}</td>
                                        <td className="p-4 align-middle">{pkg.tokens}</td>
                                        <td className="p-4 align-middle">{pkg.price} kr</td>
                                        <td className="p-4 align-middle">{pkg.description}</td>
                                        <td className="p-4 align-middle">
                                            <Badge variant={pkg.active ? "default" : "secondary"} className={pkg.active ? "bg-green-600 hover:bg-green-700" : ""}>
                                                {pkg.active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <div className="flex gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    onClick={() => setEditingPackage(pkg)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => setPackageToDelete([pkg.id])}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {tokenPackages.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                            No token packages found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Token Costs Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl font-bold">Token Costs</CardTitle>
                    <CardDescription>Configure token costs for individual features.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50">
                                <tr className="border-b transition-colors hover:bg-muted/50">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Feature</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Cost</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Description</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tokenCosts.map((cost) => (
                                    <tr key={cost.id} className="border-b transition-colors hover:bg-muted/50">
                                        <td className="p-4 align-middle font-medium">{cost.feature_name_sv}</td>
                                        <td className="p-4 align-middle font-bold">{cost.cost_tokens} tokens</td>
                                        <td className="p-4 align-middle text-muted-foreground">{cost.description_sv}</td>
                                        <td className="p-4 align-middle">
                                            <Badge variant={cost.active ? "default" : "secondary"} className={cost.active ? "bg-green-600 hover:bg-green-700" : ""}>
                                                {cost.active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="p-4 align-middle">
                                            <Button
                                                size="icon"
                                                variant="ghost"
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
                </CardContent>
            </Card>

            {/* Edit Package Dialog */}
            <Dialog open={!!editingPackage} onOpenChange={(open) => !open && setEditingPackage(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingPackage?.id ? 'Edit Token Package' : 'Add Token Package'}</DialogTitle>
                        <DialogDescription>
                            Configure the details for this token package.
                        </DialogDescription>
                    </DialogHeader>
                    
                    {editingPackage && (
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={editingPackage.name}
                                    onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="tokens">Tokens</Label>
                                    <Input
                                        id="tokens"
                                        type="number"
                                        value={editingPackage.tokens}
                                        onChange={(e) => setEditingPackage({ ...editingPackage, tokens: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="price">Price (kr)</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        value={editingPackage.price}
                                        onChange={(e) => setEditingPackage({ ...editingPackage, price: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    value={editingPackage.description}
                                    onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="active"
                                    checked={editingPackage.active}
                                    onCheckedChange={(checked) => setEditingPackage({ ...editingPackage, active: !!checked })}
                                />
                                <Label htmlFor="active">Active Status</Label>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingPackage(null)}>Cancel</Button>
                        <Button onClick={() => editingPackage && savePackage(editingPackage)}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit Cost Dialog */}
            <Dialog open={!!editingCost} onOpenChange={(open) => !open && setEditingCost(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Token Cost</DialogTitle>
                        <DialogDescription>
                            Update the cost for this feature.
                        </DialogDescription>
                    </DialogHeader>

                    {editingCost && (
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="feature_name">Feature Name (SV)</Label>
                                <Input
                                    id="feature_name"
                                    value={editingCost.feature_name_sv}
                                    onChange={(e) => setEditingCost({ ...editingCost, feature_name_sv: e.target.value })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="cost_tokens">Cost (Tokens)</Label>
                                <Input
                                    id="cost_tokens"
                                    type="number"
                                    value={editingCost.cost_tokens}
                                    onChange={(e) => setEditingCost({ ...editingCost, cost_tokens: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description_sv">Description (SV)</Label>
                                <Input
                                    id="description_sv"
                                    value={editingCost.description_sv}
                                    onChange={(e) => setEditingCost({ ...editingCost, description_sv: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="cost_active"
                                    checked={editingCost.active}
                                    onCheckedChange={(checked) => setEditingCost({ ...editingCost, active: !!checked })}
                                />
                                <Label htmlFor="cost_active">Active Status</Label>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingCost(null)}>Cancel</Button>
                        <Button onClick={() => editingCost && saveCost(editingCost)}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Alert */}
            <AlertDialog open={!!packageToDelete} onOpenChange={(open) => !open && setPackageToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete 
                            {packageToDelete && packageToDelete.length > 1 
                                ? ` ${packageToDelete.length} packages` 
                                : ' this package'} 
                            from the database.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                            onClick={() => packageToDelete && executeDelete(packageToDelete)}
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
