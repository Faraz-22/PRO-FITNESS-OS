'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MembershipPlanType, PlanCategory } from '@prisma/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2, Edit } from 'lucide-react';
import { createMembershipPlanAction, updateMembershipPlanAction } from '@/app/actions/membership-plan.actions';
import { membershipPlanSchema, MembershipPlanFormData } from '@/lib/validations/membership-plan.schema';
import { buttonVariants } from '@/components/ui/button';

interface PlanFormModalProps {
  plan?: MembershipPlanFormData & { id: string };
  trigger?: React.ReactNode;
}

export function PlanFormModal({ plan, trigger }: PlanFormModalProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!plan;

  const form = useForm({
    resolver: zodResolver(membershipPlanSchema),
    defaultValues: {
      id: plan?.id,
      name: plan?.name || '',
      code: plan?.code || '',
      description: plan?.description || '',
      durationDays: plan?.durationDays || 30,
      price: plan?.price ? Number(plan.price) : 0,
      planType: plan?.planType || 'MONTHLY',
      category: plan?.category || 'INDIVIDUAL',
      maxMembers: plan?.maxMembers || 1,
      isActive: plan?.isActive ?? true,
      benefits: plan?.benefits || [],
    },
  });

  const [benefitInput, setBenefitInput] = useState('');
  
  const addBenefit = () => {
    if (benefitInput.trim() !== '') {
      const currentBenefits = form.getValues('benefits');
      form.setValue('benefits', [...currentBenefits, benefitInput.trim()]);
      setBenefitInput('');
    }
  };

  const removeBenefit = (index: number) => {
    const currentBenefits = form.getValues('benefits');
    form.setValue('benefits', currentBenefits.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    try {
      const result = isEditing 
        ? await updateMembershipPlanAction(data)
        : await createMembershipPlanAction(data);

      if (result.success) {
        alert(`Plan successfully ${isEditing ? 'updated' : 'created'}!`);
        setOpen(false);
        if (!isEditing) form.reset();
      } else {
        alert(result.error || 'Failed to save plan');
      }
    } catch (error) {
      alert('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {trigger || (
          <div className={buttonVariants({ variant: "default", className: "bg-primary text-primary-foreground hover:bg-primary/90 font-medium" })}>
            <Plus className="mr-2 h-4 w-4" />
            New Plan
          </div>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Membership Plan' : 'Create Membership Plan'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name</Label>
              <Input id="name" placeholder="e.g. Monthly Pro" {...form.register('name')} />
              {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Plan Code</Label>
              <Input id="code" placeholder="e.g. MP1" {...form.register('code')} className="uppercase" />
              {form.formState.errors.code && <p className="text-sm text-destructive">{form.formState.errors.code.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="durationDays">Duration (Days)</Label>
              <Input id="durationDays" type="number" {...form.register('durationDays')} />
              {form.formState.errors.durationDays && <p className="text-sm text-destructive">{form.formState.errors.durationDays.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price</Label>
              <Input id="price" type="number" step="0.01" {...form.register('price')} />
              {form.formState.errors.price && <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="planType">Plan Type</Label>
            <Select 
              defaultValue={form.getValues('planType')} 
              onValueChange={(value) => form.setValue('planType', value as MembershipPlanType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRIAL">Trial</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                <SelectItem value="HALF_YEARLY">Half Yearly</SelectItem>
                <SelectItem value="YEARLY">Yearly</SelectItem>
                <SelectItem value="LIFETIME">Lifetime</SelectItem>
                <SelectItem value="CUSTOM">Custom</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.planType && <p className="text-sm text-destructive">{form.formState.errors.planType.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <textarea 
              id="description" 
              placeholder="Brief description of the plan" 
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...form.register('description')} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                defaultValue={form.getValues('category')} 
                onValueChange={(value) => {
                  form.setValue('category', value as PlanCategory);
                  if (value === 'COUPLE' && form.getValues('maxMembers') < 2) {
                    form.setValue('maxMembers', 2);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                  <SelectItem value="COUPLE">Couple</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.category && <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="maxMembers">Max Members</Label>
              <Input id="maxMembers" type="number" min="1" {...form.register('maxMembers')} />
              {form.formState.errors.maxMembers && <p className="text-sm text-destructive">{form.formState.errors.maxMembers.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Included Benefits / Facilities</Label>
            <div className="flex gap-2">
              <Input 
                placeholder="e.g. Steam Bath" 
                value={benefitInput}
                onChange={(e) => setBenefitInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addBenefit();
                  }
                }}
              />
              <Button type="button" variant="secondary" onClick={addBenefit}>Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {form.watch('benefits').map((benefit, idx) => (
                <div key={idx} className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
                  {benefit}
                  <button type="button" onClick={() => removeBenefit(idx)} className="text-muted-foreground hover:text-foreground">
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4 bg-secondary/20">
            <div className="space-y-0.5">
              <Label className="text-base">Active Status</Label>
              <p className="text-sm text-muted-foreground">
                Make this plan available for new memberships.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input 
                type="checkbox" 
                id="isActive"
                className="h-4 w-4"
                checked={form.watch('isActive')}
                onChange={(e) => form.setValue('isActive', e.target.checked)}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Update Plan' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
