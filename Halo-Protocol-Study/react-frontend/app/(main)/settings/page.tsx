"use client"

import * as React from "react"
import { apiRequest } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { User, Phone, Envelope, Shield } from "@phosphor-icons/react"

export default function SettingsPage() {
    const [user, setUser] = React.useState<any>(null) // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = React.useState(true)
    const [saving, setSaving] = React.useState(false)
    const { toast } = useToast()

    React.useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await apiRequest('/api/auth/me')
                setUser(res.user)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        fetchUser()
    }, [])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        try {
            await apiRequest('/api/users/profile', {
                method: 'PATCH',
                body: JSON.stringify({
                    first_name: user.first_name,
                    last_name: user.last_name,
                    mobile: user.mobile
                })
            })
            toast({
                title: "Settings Saved",
                description: "Your profile has been updated successfully."
            })
        } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            toast({
                title: "Error",
                description: err.message,
                variant: "destructive"
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading) return <div className="p-8">Loading settings...</div>

    return (
        <div className="container mx-auto max-w-3xl p-6">
            <h1 className="mb-8 text-3xl font-bold">Settings</h1>

            <form onSubmit={handleSave} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User size={20} />
                            Profile Information
                        </CardTitle>
                        <CardDescription>Update your personal details.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">First Name</label>
                                <Input
                                    value={user?.first_name || ""}
                                    onChange={e => setUser({ ...user, first_name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Last Name</label>
                                <Input
                                    value={user?.last_name || ""}
                                    onChange={e => setUser({ ...user, last_name: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-1">
                                <Envelope size={14} /> Email Address
                            </label>
                            <Input value={user?.email || ""} disabled className="bg-muted opacity-60" />
                            <p className="text-[10px] text-muted-foreground">Email cannot be changed after registration.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Phone size={20} />
                            Mobile Security
                        </CardTitle>
                        <CardDescription>Verified mobile number for 2FA and card verification.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Phone Number</label>
                            <div className="flex gap-2">
                                <Input
                                    value={user?.mobile || ""}
                                    onChange={e => setUser({ ...user, mobile: e.target.value })}
                                />
                                {user?.mobile_verified ? (
                                    <div className="flex items-center gap-1 rounded-md bg-green-500/10 px-3 text-xs font-medium text-green-600 border border-green-500/20">
                                        Verified
                                    </div>
                                ) : (
                                    <Button variant="outline" size="sm" type="button">Verify</Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-destructive/20 bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-destructive">
                            <Shield size={20} />
                            Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button variant="destructive" size="sm" type="button">Deactivate Account</Button>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-3">
                    <Button variant="ghost" type="button">Cancel</Button>
                    <Button type="submit" disabled={saving}>
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>
        </div>
    )
}
