"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/utils/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { toast } from "sonner"

interface TokenPackage {
    id: string
    name: string
    tokens: number
    price: number
    price_display: string
    active: boolean
}

export default function TokenPackagesPage() {
    const supabase = createClient()
    const [packages, setPackages] = useState<TokenPackage[]>([])
    const [newPackage, setNewPackage] = useState({ name: "", tokens: 0, price: 0, price_display: "", active: true })
    const [editingPackage, setEditingPackage] = useState<TokenPackage | null>(null)

    useEffect(() => {
        fetchPackages()
    }, [])

    const fetchPackages = async () => {
        const { data, error } = await supabase
            .from("token_packages")
            .select("*")
            .order("tokens", { ascending: true })
        if (error) {
            toast.error("Failed to fetch token packages")
        } else {
            setPackages(data)
        }
    }

    const handleCreate = async () => {
        const { error } = await supabase.from("token_packages").insert([newPackage])
        if (error) {
            toast.error("Failed to create token package")
        } else {
            toast.success("Token package created")
            setNewPackage({ name: "", tokens: 0, price: 0, price_display: "", active: true })
            fetchPackages()
        }
    }

    const handleUpdate = async () => {
        if (!editingPackage) return
        const { error } = await supabase
            .from("token_packages")
            .update({ 
                name: editingPackage.name, 
                tokens: editingPackage.tokens, 
                price: editingPackage.price,
                price_display: editingPackage.price_display,
                active: editingPackage.active
            })
            .eq("id", editingPackage.id)
        if (error) {
            toast.error("Failed to update token package")
        } else {
            toast.success("Token package updated")
            setEditingPackage(null)
            fetchPackages()
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this package?")) return
        const { error } = await supabase.from("token_packages").delete().eq("id", id)
        if (error) {
            toast.error("Failed to delete token package")
        } else {
            toast.success("Token package deleted")
            fetchPackages()
        }
    }

    return (
        <div className="container mx-auto p-4 max-w-6xl">
            <h1 className="text-3xl font-bold mb-6">Manage Token Packages</h1>

            <Card className="mb-8 border-primary/20">
                <CardHeader>
                    <CardTitle>Create New Package</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Name</label>
                            <Input
                                placeholder="e.g. 200 tokens"
                                value={newPackage.name}
                                onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Tokens</label>
                            <Input
                                type="number"
                                placeholder="Amount"
                                value={newPackage.tokens || ""}
                                onChange={(e) => setNewPackage({ ...newPackage, tokens: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Base Price (Credits)</label>
                            <Input
                                type="number"
                                placeholder="Credits"
                                value={newPackage.price || ""}
                                onChange={(e) => setNewPackage({ ...newPackage, price: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Display Price</label>
                            <Input
                                placeholder="9,99 € / 99 kr"
                                value={newPackage.price_display}
                                onChange={(e) => setNewPackage({ ...newPackage, price_display: e.target.value })}
                            />
                        </div>
                        <Button onClick={handleCreate} className="w-full">Create Package</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Existing Packages</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Tokens</TableHead>
                                <TableHead>Price (Credits)</TableHead>
                                <TableHead>Price Display</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {packages.map((pkg) => (
                                <TableRow key={pkg.id}>
                                    {editingPackage?.id === pkg.id ? (
                                        <>
                                            <TableCell>
                                                <Input
                                                    value={editingPackage.name}
                                                    onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={editingPackage.tokens}
                                                    onChange={(e) =>
                                                        setEditingPackage({ ...editingPackage, tokens: parseInt(e.target.value) })
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    type="number"
                                                    value={editingPackage.price}
                                                    onChange={(e) =>
                                                        setEditingPackage({ ...editingPackage, price: parseFloat(e.target.value) })
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Input
                                                    value={editingPackage.price_display}
                                                    onChange={(e) =>
                                                        setEditingPackage({ ...editingPackage, price_display: e.target.value })
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <select 
                                                    className="bg-background border rounded p-1 text-sm"
                                                    value={editingPackage.active ? "true" : "false"}
                                                    onChange={(e) => setEditingPackage({...editingPackage, active: e.target.value === "true"})}
                                                >
                                                    <option value="true">Active</option>
                                                    <option value="false">Inactive</option>
                                                </select>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end space-x-2">
                                                    <Button size="sm" onClick={handleUpdate}>Save</Button>
                                                    <Button size="sm" onClick={() => setEditingPackage(null)} variant="outline">
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </>
                                    ) : (
                                        <>
                                            <TableCell className="font-medium">{pkg.name}</TableCell>
                                            <TableCell>{pkg.tokens}</TableCell>
                                            <TableCell>{pkg.price}</TableCell>
                                            <TableCell>{pkg.price_display}</TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${pkg.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {pkg.active ? 'Active' : 'Inactive'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end space-x-2">
                                                    <Button size="sm" variant="outline" onClick={() => setEditingPackage(pkg)}>Edit</Button>
                                                    <Button size="sm" onClick={() => handleDelete(pkg.id)} variant="destructive">
                                                        Delete
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}