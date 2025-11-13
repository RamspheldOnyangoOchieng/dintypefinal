"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Pencil, Trash2, Plus, Save, X } from 'lucide-react';

interface PlanFeature {
    id: string;
    feature_key: string;
    feature_name: string;
    description: string;
    category: string;
    free_value: any;
    premium_value: any;
    is_active: boolean;
    display_order: number;
}

interface PlanRestriction {
    id: string;
    plan_type: string;
    restriction_key: string;
    restriction_value: any;
    description: string;
}

export default function PlanManagementPage() {
    const [features, setFeatures] = useState<PlanFeature[]>([]);
    const [restrictions, setRestrictions] = useState<PlanRestriction[]>([]);
    const [editingFeature, setEditingFeature] = useState<PlanFeature | null>(null);
    const [editingRestriction, setEditingRestriction] = useState<PlanRestriction | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'features' | 'restrictions'>('features');
    
    const supabase = createClientComponentClient();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            // Load features
            const { data: featuresData } = await supabase
                .from('plan_features')
                .select('*')
                .order('display_order');
            
            // Load restrictions
            const { data: restrictionsData } = await supabase
                .from('plan_restrictions')
                .select('*')
                .order('plan_type, restriction_key');
            
            if (featuresData) setFeatures(featuresData);
            if (restrictionsData) setRestrictions(restrictionsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveFeature = async () => {
        if (!editingFeature) return;
        
        try {
            if (editingFeature.id === 'new') {
                const { error } = await supabase
                    .from('plan_features')
                    .insert({
                        feature_key: editingFeature.feature_key,
                        feature_name: editingFeature.feature_name,
                        description: editingFeature.description,
                        category: editingFeature.category,
                        free_value: editingFeature.free_value,
                        premium_value: editingFeature.premium_value,
                        is_active: editingFeature.is_active,
                        display_order: editingFeature.display_order,
                    });
                
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('plan_features')
                    .update({
                        feature_name: editingFeature.feature_name,
                        description: editingFeature.description,
                        category: editingFeature.category,
                        free_value: editingFeature.free_value,
                        premium_value: editingFeature.premium_value,
                        is_active: editingFeature.is_active,
                        display_order: editingFeature.display_order,
                    })
                    .eq('id', editingFeature.id);
                
                if (error) throw error;
            }
            
            await loadData();
            setEditingFeature(null);
        } catch (error) {
            console.error('Error saving feature:', error);
            alert('Failed to save feature');
        }
    };

    const handleSaveRestriction = async () => {
        if (!editingRestriction) return;
        
        try {
            if (editingRestriction.id === 'new') {
                const { error } = await supabase
                    .from('plan_restrictions')
                    .insert({
                        plan_type: editingRestriction.plan_type,
                        restriction_key: editingRestriction.restriction_key,
                        restriction_value: editingRestriction.restriction_value,
                        description: editingRestriction.description,
                    });
                
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('plan_restrictions')
                    .update({
                        restriction_value: editingRestriction.restriction_value,
                        description: editingRestriction.description,
                    })
                    .eq('id', editingRestriction.id);
                
                if (error) throw error;
            }
            
            await loadData();
            setEditingRestriction(null);
        } catch (error) {
            console.error('Error saving restriction:', error);
            alert('Failed to save restriction');
        }
    };

    const handleDeleteFeature = async (id: string) => {
        if (!confirm('Are you sure you want to delete this feature?')) return;
        
        try {
            const { error } = await supabase
                .from('plan_features')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            await loadData();
        } catch (error) {
            console.error('Error deleting feature:', error);
            alert('Failed to delete feature');
        }
    };

    const handleDeleteRestriction = async (id: string) => {
        if (!confirm('Are you sure you want to delete this restriction?')) return;
        
        try {
            const { error } = await supabase
                .from('plan_restrictions')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            await loadData();
        } catch (error) {
            console.error('Error deleting restriction:', error);
            alert('Failed to delete restriction');
        }
    };

    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    return (
        <div className="container mx-auto p-6">
            <h1 className="text-3xl font-bold mb-6">Plan Management</h1>
            
            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b">
                <button
                    className={`px-4 py-2 font-semibold ${activeTab === 'features' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                    onClick={() => setActiveTab('features')}
                >
                    Features
                </button>
                <button
                    className={`px-4 py-2 font-semibold ${activeTab === 'restrictions' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground'}`}
                    onClick={() => setActiveTab('restrictions')}
                >
                    Restrictions
                </button>
            </div>

            {/* Features Tab */}
            {activeTab === 'features' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold">Plan Features</h2>
                        <Button
                            onClick={() => setEditingFeature({
                                id: 'new',
                                feature_key: '',
                                feature_name: '',
                                description: '',
                                category: 'core',
                                free_value: '',
                                premium_value: '',
                                is_active: true,
                                display_order: features.length + 1,
                            })}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Add Feature
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {features.map((feature) => (
                            <Card key={feature.id} className="p-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold">{feature.feature_name}</h3>
                                        <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <span className="text-sm font-medium">Free: </span>
                                                <span className="text-sm">{JSON.stringify(feature.free_value)}</span>
                                            </div>
                                            <div>
                                                <span className="text-sm font-medium">Premium: </span>
                                                <span className="text-sm">{JSON.stringify(feature.premium_value)}</span>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center gap-4">
                                            <span className="text-xs bg-secondary px-2 py-1 rounded">{feature.category}</span>
                                            <span className="text-xs">Order: {feature.display_order}</span>
                                            <span className={`text-xs px-2 py-1 rounded ${feature.is_active ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                                {feature.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setEditingFeature(feature)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteFeature(feature.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Restrictions Tab */}
            {activeTab === 'restrictions' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-semibold">Plan Restrictions</h2>
                        <Button
                            onClick={() => setEditingRestriction({
                                id: 'new',
                                plan_type: 'free',
                                restriction_key: '',
                                restriction_value: '',
                                description: '',
                            })}
                        >
                            <Plus className="mr-2 h-4 w-4" /> Add Restriction
                        </Button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        {['free', 'premium'].map((planType) => (
                            <div key={planType}>
                                <h3 className="text-xl font-semibold mb-3 capitalize">{planType} Plan</h3>
                                <div className="space-y-2">
                                    {restrictions
                                        .filter((r) => r.plan_type === planType)
                                        .map((restriction) => (
                                            <Card key={restriction.id} className="p-3">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1">
                                                        <p className="font-medium">{restriction.restriction_key}</p>
                                                        <p className="text-sm text-muted-foreground">{restriction.description}</p>
                                                        <p className="text-sm mt-1">
                                                            <span className="font-medium">Value: </span>
                                                            {JSON.stringify(restriction.restriction_value)}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => setEditingRestriction(restriction)}
                                                        >
                                                            <Pencil className="h-3 w-3" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteRestriction(restriction.id)}
                                                        >
                                                            <Trash2 className="h-3 w-3 text-red-500" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </Card>
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Edit Feature Modal */}
            {editingFeature && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">
                                {editingFeature.id === 'new' ? 'Add' : 'Edit'} Feature
                            </h2>
                            <Button variant="ghost" onClick={() => setEditingFeature(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Feature Key</label>
                                <Input
                                    value={editingFeature.feature_key}
                                    onChange={(e) => setEditingFeature({ ...editingFeature, feature_key: e.target.value })}
                                    disabled={editingFeature.id !== 'new'}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Feature Name</label>
                                <Input
                                    value={editingFeature.feature_name}
                                    onChange={(e) => setEditingFeature({ ...editingFeature, feature_name: e.target.value })}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <Textarea
                                    value={editingFeature.description}
                                    onChange={(e) => setEditingFeature({ ...editingFeature, description: e.target.value })}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={editingFeature.category}
                                    onChange={(e) => setEditingFeature({ ...editingFeature, category: e.target.value })}
                                >
                                    <option value="core">Core</option>
                                    <option value="content">Content</option>
                                    <option value="support">Support</option>
                                    <option value="customization">Customization</option>
                                </select>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Free Value</label>
                                    <Input
                                        value={typeof editingFeature.free_value === 'string' ? editingFeature.free_value : JSON.stringify(editingFeature.free_value)}
                                        onChange={(e) => setEditingFeature({ ...editingFeature, free_value: e.target.value })}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-medium mb-1">Premium Value</label>
                                    <Input
                                        value={typeof editingFeature.premium_value === 'string' ? editingFeature.premium_value : JSON.stringify(editingFeature.premium_value)}
                                        onChange={(e) => setEditingFeature({ ...editingFeature, premium_value: e.target.value })}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Display Order</label>
                                <Input
                                    type="number"
                                    value={editingFeature.display_order}
                                    onChange={(e) => setEditingFeature({ ...editingFeature, display_order: parseInt(e.target.value) })}
                                />
                            </div>
                            
                            <div className="flex items-center gap-2">
                                <Switch
                                    checked={editingFeature.is_active}
                                    onCheckedChange={(checked) => setEditingFeature({ ...editingFeature, is_active: checked })}
                                />
                                <label className="text-sm font-medium">Active</label>
                            </div>
                            
                            <div className="flex gap-2 pt-4">
                                <Button onClick={handleSaveFeature} className="flex-1">
                                    <Save className="mr-2 h-4 w-4" /> Save
                                </Button>
                                <Button variant="outline" onClick={() => setEditingFeature(null)} className="flex-1">
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Edit Restriction Modal */}
            {editingRestriction && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-lg p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">
                                {editingRestriction.id === 'new' ? 'Add' : 'Edit'} Restriction
                            </h2>
                            <Button variant="ghost" onClick={() => setEditingRestriction(null)}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Plan Type</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-md"
                                    value={editingRestriction.plan_type}
                                    onChange={(e) => setEditingRestriction({ ...editingRestriction, plan_type: e.target.value })}
                                    disabled={editingRestriction.id !== 'new'}
                                >
                                    <option value="free">Free</option>
                                    <option value="premium">Premium</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Restriction Key</label>
                                <Input
                                    value={editingRestriction.restriction_key}
                                    onChange={(e) => setEditingRestriction({ ...editingRestriction, restriction_key: e.target.value })}
                                    disabled={editingRestriction.id !== 'new'}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Restriction Value</label>
                                <Input
                                    value={typeof editingRestriction.restriction_value === 'string' ? editingRestriction.restriction_value : JSON.stringify(editingRestriction.restriction_value)}
                                    onChange={(e) => setEditingRestriction({ ...editingRestriction, restriction_value: e.target.value })}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium mb-1">Description</label>
                                <Textarea
                                    value={editingRestriction.description}
                                    onChange={(e) => setEditingRestriction({ ...editingRestriction, description: e.target.value })}
                                />
                            </div>
                            
                            <div className="flex gap-2 pt-4">
                                <Button onClick={handleSaveRestriction} className="flex-1">
                                    <Save className="mr-2 h-4 w-4" /> Save
                                </Button>
                                <Button variant="outline" onClick={() => setEditingRestriction(null)} className="flex-1">
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
