'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Loader2, Pencil } from 'lucide-react';
import { toast } from '@/components/ui/toast';
import { updateMemberProfileAction } from '@/app/actions/member.actions';

interface EditProfileModalProps {
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    gender: string;
    dob: string;
    addressLine1: string;
    city: string;
    zipCode: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
  };
}

export function EditProfileModal({ member }: EditProfileModalProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const isPlaceholderEmail =
    member.email.startsWith('temp_') || member.email.startsWith('pending-');

  const [firstName, setFirstName] = useState(member.firstName);
  const [lastName, setLastName] = useState(member.lastName);
  const [email, setEmail] = useState(isPlaceholderEmail ? '' : member.email);
  const [phone, setPhone] = useState(member.phone);
  const [gender, setGender] = useState(member.gender);
  const [dob, setDob] = useState(member.dob);
  const [addressLine1, setAddressLine1] = useState(member.addressLine1);
  const [city, setCity] = useState(member.city);
  const [zipCode, setZipCode] = useState(member.zipCode);
  const [emergencyContactName, setEmergencyContactName] = useState(member.emergencyContactName);
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(member.emergencyContactPhone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateMemberProfileAction({
        memberId: member.id,
        firstName,
        lastName,
        email,
        phone,
        gender,
        dob,
        addressLine1,
        city,
        zipCode,
        emergencyContactName,
        emergencyContactPhone,
      });

      if (res.success) {
        toast.add({ title: 'Member profile updated', type: 'success' });
        setOpen(false);
        router.refresh();
      } else {
        toast.add({ title: res.error || 'Failed to update profile', type: 'error' });
      }
    } catch {
      toast.add({ title: 'Unexpected error occurred', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" className="border-border gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit Profile
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Member Profile</DialogTitle>
          <DialogDescription>
            Update personal, contact, and emergency details for this member.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="edit-firstName">First Name</Label>
              <Input
                id="edit-firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-lastName">Last Name</Label>
              <Input
                id="edit-lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isPlaceholderEmail ? 'Add real email (currently placeholder)' : ''}
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-gender">Gender</Label>
              <select
                id="edit-gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                disabled={saving}
                className="flex h-10 w-full rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Not specified</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-dob">Date of Birth</Label>
              <Input
                id="edit-dob"
                type="date"
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-border/50">
            <div className="space-y-1.5 sm:col-span-3">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={addressLine1}
                onChange={(e) => setAddressLine1(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="edit-city">City</Label>
              <Input
                id="edit-city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-zip">Zip Code</Label>
              <Input
                id="edit-zip"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/50">
            <div className="space-y-1.5">
              <Label htmlFor="edit-ecName">Emergency Contact Name</Label>
              <Input
                id="edit-ecName"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                disabled={saving}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-ecPhone">Emergency Contact Phone</Label>
              <Input
                id="edit-ecPhone"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

