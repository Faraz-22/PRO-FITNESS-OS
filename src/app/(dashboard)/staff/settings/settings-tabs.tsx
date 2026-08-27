'use client';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { updateBranchAction, updateProfileAction } from './actions';
import { useRef, useState } from 'react';
import { Save, User, Building, Cable, TriangleAlert } from 'lucide-react';

export function SettingsTabs({ branch, user, staffProfile }: any) {
  const [isSavingBranch, setIsSavingBranch] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  
  const handleBranchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSavingBranch(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updateBranchAction(branch.id, formData);
      // Optional: Add toast success here
    } catch (err) {
      console.error(err);
      // Optional: Add toast error here
    } finally {
      setIsSavingBranch(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSavingProfile(true);
    const formData = new FormData(e.currentTarget);
    try {
      await updateProfileAction(formData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="mb-6 h-auto p-1 bg-secondary/50 border border-border">
        <TabsTrigger value="general" className="gap-2 py-2.5 px-4"><Building className="h-4 w-4" /> General</TabsTrigger>
        <TabsTrigger value="profile" className="gap-2 py-2.5 px-4"><User className="h-4 w-4" /> Profile</TabsTrigger>
        <TabsTrigger value="integrations" className="gap-2 py-2.5 px-4"><Cable className="h-4 w-4" /> Integrations</TabsTrigger>
        <TabsTrigger value="danger" className="gap-2 py-2.5 px-4 text-danger hover:bg-danger/10 hover:text-danger data-[state=active]:bg-danger data-[state=active]:text-danger-foreground"><TriangleAlert className="h-4 w-4" /> Danger Zone</TabsTrigger>
      </TabsList>

      <TabsContent value="general">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle>Branch Configuration</CardTitle>
            <CardDescription>Update your gym branch details and localization settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBranchSubmit} className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Branch Name</Label>
                  <Input id="name" name="name" defaultValue={branch?.name || ''} required className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Branch Code</Label>
                  <Input id="code" name="code" defaultValue={branch?.code || ''} required className="bg-background" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Physical Address</Label>
                <Input id="address" name="address" defaultValue={branch?.address || ''} className="bg-background" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" name="phone" defaultValue={branch?.phone || ''} className="bg-background" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input id="timezone" name="timezone" defaultValue={branch?.timezone || 'Asia/Kolkata'} required className="bg-background" />
                </div>
              </div>
              <Button type="submit" disabled={isSavingBranch}>
                {isSavingBranch ? 'Saving...' : 'Save Branch Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="profile">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle>Staff Profile</CardTitle>
            <CardDescription>Manage your personal staff account details.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleProfileSubmit} className="space-y-6 max-w-xl">
              <div className="space-y-2">
                <Label htmlFor="userName">Display Name</Label>
                <Input id="userName" name="name" defaultValue={user?.name || ''} required className="bg-background" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userEmail">Email Address (Read-only)</Label>
                <Input id="userEmail" type="email" defaultValue={user?.email || ''} disabled className="bg-muted text-muted-foreground" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="userPhone">Personal Phone</Label>
                <Input id="userPhone" name="phone" defaultValue={staffProfile?.phone || ''} className="bg-background" />
              </div>
              <Button type="submit" disabled={isSavingProfile}>
                {isSavingProfile ? 'Saving...' : 'Save Profile Changes'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="integrations">
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm opacity-60 pointer-events-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cable className="h-5 w-5" /> Integrations <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">Phase 8</span>
            </CardTitle>
            <CardDescription>Hardware and payment gateway configurations are locked pending deployment validation.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Razorpay (Payments)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Key ID</Label>
                  <Input disabled value="rzp_test_..." />
                </div>
                <div className="space-y-2">
                  <Label>Key Secret</Label>
                  <Input disabled type="password" value="********" />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-sm font-medium">eSSL MB20 (Hardware Sync)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Device IP Address</Label>
                  <Input disabled value="192.168.1.100" />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input disabled value="4370" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="danger">
        <Card className="border-danger/50 bg-danger/5 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <CardTitle className="text-danger flex items-center gap-2">
              Danger Zone
            </CardTitle>
            <CardDescription className="text-danger/80">Destructive actions. Use with extreme caution.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-danger/20 rounded-lg bg-background/50">
              <div>
                <h4 className="font-semibold text-foreground">Reset Test Data</h4>
                <p className="text-sm text-muted-foreground mt-1">Permanently delete all members, invoices, attendance, and activity logs. Keeps branch, staff, and plans intact.</p>
              </div>
              <Button 
                variant="destructive"
                onClick={async () => {
                  const confirmed = confirm('WARNING: This will delete ALL member data, invoices, and attendance logs. Type "CONFIRM" to proceed.');
                  if (confirmed) {
                    const typed = prompt('Type "CONFIRM" exactly to permanently delete data.');
                    if (typed === 'CONFIRM') {
                      try {
                        const { resetTestDataAction } = await import('./actions');
                        await resetTestDataAction();
                        alert('Data successfully deleted! The system is now clean.');
                        window.location.reload();
                      } catch (e: any) {
                        alert('Error deleting data: ' + e.message);
                      }
                    } else {
                      alert('Reset cancelled. You did not type CONFIRM.');
                    }
                  }
                }}
              >
                Clear Test Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
