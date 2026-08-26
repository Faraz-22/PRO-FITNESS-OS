'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createMemberAction, getActiveMembershipPlansAction } from '@/app/actions/member.actions';
import { Loader2, ArrowLeft, CreditCard } from 'lucide-react';
import { FinanceCheckoutModal } from '../shared/finance-checkout-modal';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/toast';

const memberSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  gender: z.string().optional(),
  dob: z.string().optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  planId: z.string().min(1, 'Please select a membership plan'),
  startDate: z.string().min(1, 'Start date is required'),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'ONLINE', 'OTHER'] as const),
  payInInstallments: z.boolean().optional(),
  firstInstallmentAmount: z.string().optional(),
  linkedMemberNumber: z.string().optional(),

  // Second Member Details
  isCoupleEnrollment: z.boolean().optional(),
  secondFirstName: z.string().optional(),
  secondLastName: z.string().optional(),
  secondEmail: z.string().optional(),
  secondPhone: z.string().optional(),
  secondGender: z.string().optional(),
  secondDob: z.string().optional(),
});

type MemberFormData = z.infer<typeof memberSchema>;

export default function AddMemberPage() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [pendingData, setPendingData] = useState<MemberFormData | null>(null);

  useEffect(() => {
    getActiveMembershipPlansAction().then(res => {
      if (res.success && res.data) {
        setPlans(res.data);
      }
    });
  }, []);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      startDate: new Date().toISOString().substring(0, 10),
      paymentMethod: 'UPI',
      payInInstallments: false,
      firstInstallmentAmount: undefined
    }
  });

  const payInInstallments = watch('payInInstallments');
  const selectedPlanId = watch('planId');
  const selectedPlan = plans.find(p => p.id === selectedPlanId);

  const isLoading = isSubmitting || isNavigating;

  const onProceed = (data: MemberFormData) => {
    setPendingData(data);
    setShowCheckout(true);
  };

  const handleCheckoutConfirm = async (financeData: { couponCode?: string; discountAmount: number; finalAmount: number; payInInstallments: boolean; firstInstallmentAmount?: string; paymentMethod: string }) => {
    if (!pendingData) return;
    
    try {
      const mergedData = { ...pendingData, ...financeData, paymentMethod: financeData.paymentMethod as any };
      const result = await createMemberAction(mergedData);
      
      if (!result.success) {
        toast.add({ title: result.error || 'Failed to create member', type: 'error' });
        return { success: false };
      }
      
      toast.add({ title: 'Member registered successfully!', type: 'success' });
      setShowCheckout(false);
      setIsNavigating(true);
      
      router.push(`/staff/members/${result.memberId}`);
      return { success: true, invoiceId: result.invoiceId };
    } catch (e) {
      toast.add({ title: 'An unexpected error occurred.', type: 'error' });
      return { success: false };
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/staff/members">
          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full border-border bg-card hover:bg-secondary">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Add New Member</h1>
          <p className="text-sm text-muted-foreground mt-1">Register a new member in the CRM.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onProceed)}>
        <Card className="border-border/50 bg-card/50 shadow-sm">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Basic details for the member profile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name <span className="text-danger">*</span></Label>
                <Input id="firstName" disabled={isLoading} {...register('firstName')} className="bg-background/50 border-border/50" />
                {errors.firstName && <p className="text-xs text-danger">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name <span className="text-danger">*</span></Label>
                <Input id="lastName" disabled={isLoading} {...register('lastName')} className="bg-background/50 border-border/50" />
                {errors.lastName && <p className="text-xs text-danger">{errors.lastName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" disabled={isLoading} {...register('email')} className="bg-background/50 border-border/50" />
                {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number <span className="text-danger">*</span></Label>
                <Input id="phone" disabled={isLoading} {...register('phone')} className="bg-background/50 border-border/50" />
                {errors.phone && <p className="text-xs text-danger">{errors.phone.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth</Label>
                <Input id="dob" type="date" disabled={isLoading} {...register('dob')} className="bg-background/50 border-border/50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <select id="gender" disabled={isLoading} {...register('gender')} className="flex h-10 w-full items-center justify-between rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-border/50">
              <h3 className="text-lg font-medium mb-4">Address Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="addressLine1">Address Line 1</Label>
                  <Input id="addressLine1" disabled={isLoading} {...register('addressLine1')} className="bg-background/50 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" disabled={isLoading} {...register('city')} className="bg-background/50 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zipCode">Zip Code</Label>
                  <Input id="zipCode" disabled={isLoading} {...register('zipCode')} className="bg-background/50 border-border/50" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border/50">
              <h3 className="text-lg font-medium mb-4">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactName">Contact Name</Label>
                  <Input id="emergencyContactName" disabled={isLoading} {...register('emergencyContactName')} className="bg-background/50 border-border/50" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                  <Input id="emergencyContactPhone" disabled={isLoading} {...register('emergencyContactPhone')} className="bg-background/50 border-border/50" />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border/50">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" /> Enrollment & Payment
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="planId">Membership Plan <span className="text-danger">*</span></Label>
                  <select id="planId" disabled={isLoading} {...register('planId')} className="flex h-10 w-full items-center justify-between rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="">Select a plan</option>
                    {plans.map(p => (
                      <option key={p.id} value={p.id}>{p.name} - ₹{p.price}</option>
                    ))}
                  </select>
                  {errors.planId && <p className="text-xs text-danger">{errors.planId.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date <span className="text-danger">*</span></Label>
                  <Input id="startDate" type="date" disabled={isLoading} {...register('startDate')} className="bg-background/50 border-border/50" />
                  {errors.startDate && <p className="text-xs text-danger">{errors.startDate.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method <span className="text-danger">*</span></Label>
                  <select id="paymentMethod" disabled={isLoading} {...register('paymentMethod')} className="flex h-10 w-full items-center justify-between rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CARD">Credit/Debit Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="ONLINE">Online Link</option>
                    <option value="OTHER">Other</option>
                  </select>
                  {errors.paymentMethod && <p className="text-xs text-danger">{errors.paymentMethod.message}</p>}
                </div>
                {selectedPlan && selectedPlan.maxMembers > 1 && (
                  <div className="space-y-4 md:col-span-2 border-t border-border/50 pt-4 mt-2">
                    <Label className="text-amber-500 font-medium flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        {...register('isCoupleEnrollment')}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      Register Partner / Second Member Now
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">Check this to register the second member on the same bill. Or leave unchecked and enter their existing Member Number below.</p>
                    
                    {!watch('isCoupleEnrollment') ? (
                      <div className="mt-2">
                        <Label htmlFor="linkedMemberNumber" className="text-sm">Existing Member Number (Optional)</Label>
                        <Input 
                          id="linkedMemberNumber" 
                          placeholder="e.g. MBR-2026-00001"
                          disabled={isLoading} 
                          {...register('linkedMemberNumber')} 
                          className="bg-background/50 border-border/50 mt-1" 
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-amber-500/5 p-4 rounded-lg border border-amber-500/20">
                        <div className="space-y-2">
                          <Label htmlFor="secondFirstName">First Name *</Label>
                          <Input id="secondFirstName" disabled={isLoading} {...register('secondFirstName')} className="bg-background/50 border-border/50" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="secondLastName">Last Name *</Label>
                          <Input id="secondLastName" disabled={isLoading} {...register('secondLastName')} className="bg-background/50 border-border/50" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="secondPhone">Phone Number</Label>
                          <Input id="secondPhone" disabled={isLoading} {...register('secondPhone')} className="bg-background/50 border-border/50" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="secondEmail">Email</Label>
                          <Input id="secondEmail" type="email" disabled={isLoading} {...register('secondEmail')} className="bg-background/50 border-border/50" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="secondGender">Gender</Label>
                          <select id="secondGender" disabled={isLoading} {...register('secondGender')} className="flex h-10 w-full items-center justify-between rounded-md border border-border/50 bg-background/50 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="secondDob">Date of Birth</Label>
                          <Input id="secondDob" type="date" disabled={isLoading} {...register('secondDob')} className="bg-background/50 border-border/50" />
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </div>
          </div>

            <div className="pt-6 flex justify-end gap-3">
              <Link href="/staff/members">
                <Button type="button" variant="outline" disabled={isLoading} className="border-border">Cancel</Button>
              </Link>
              <Button type="submit" disabled={isLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Proceed to Checkout
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {pendingData && selectedPlan && (
        <FinanceCheckoutModal
          mode="ONBOARDING"
          open={showCheckout}
          onOpenChange={setShowCheckout}
          details={{
            planId: selectedPlan.id,
            planName: selectedPlan.name,
            planPrice: selectedPlan.price,
            startDate: pendingData.startDate,
            branchId: selectedPlan.branchId,
            paymentMethod: pendingData.paymentMethod
          }}
          onConfirm={handleCheckoutConfirm}
        />
      )}
    </div>
  );
}
