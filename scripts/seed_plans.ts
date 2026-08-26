import { MembershipPlanType, PlanCategory } from '@prisma/client';
import prisma from '../src/lib/db/prisma';

const BRANCH_ID = "cm017z7u00000y81g2e9k1a0z"; // Using a known branch ID or fallback to first branch

async function main() {
  const branch = await prisma.branch.findFirst();
  if (!branch) {
    console.error("No branch found. Please create a branch first.");
    return;
  }

  const branchId = branch.id;

  const plans = [
    // ----------------------------------------------------
    // STANDARD GYM MEMBERSHIP
    // ----------------------------------------------------
    {
      code: "GYM_MONTHLY",
      name: "Gym Membership",
      category: PlanCategory.INDIVIDUAL,
      maxMembers: 1,
      description: "Standard gym access membership.",
      durationDays: 30,
      price: 1999,
      planType: MembershipPlanType.MONTHLY,
      benefits: ["Gym access", "Standard gym facilities"]
    },
    {
      code: "GYM_QUARTERLY",
      name: "Gym Membership",
      category: PlanCategory.INDIVIDUAL,
      maxMembers: 1,
      description: "Standard gym access membership.",
      durationDays: 90,
      price: 4999,
      planType: MembershipPlanType.QUARTERLY,
      benefits: ["Gym access", "Standard gym facilities"]
    },
    {
      code: "GYM_HALF_YEARLY",
      name: "Gym Membership",
      category: PlanCategory.INDIVIDUAL,
      maxMembers: 1,
      description: "Standard gym access membership.",
      durationDays: 180,
      price: 7999,
      planType: MembershipPlanType.HALF_YEARLY,
      benefits: ["Gym access", "Standard gym facilities"]
    },
    {
      code: "GYM_YEARLY",
      name: "Gym Membership",
      category: PlanCategory.INDIVIDUAL,
      maxMembers: 1,
      description: "Standard gym access membership.",
      durationDays: 365,
      price: 11999,
      planType: MembershipPlanType.YEARLY,
      benefits: ["Gym access", "Standard gym facilities"]
    },

    // ----------------------------------------------------
    // PLATINUM COMBO PACKAGE
    // ----------------------------------------------------
    {
      code: "PLATINUM_MONTHLY",
      name: "Platinum",
      category: PlanCategory.INDIVIDUAL,
      maxMembers: 1,
      description: "Gym package with Yoga, Zumba, Aerobics, Steam Bath, Cold Bath and Spa/Massager facilities.",
      durationDays: 30,
      price: 2699,
      planType: MembershipPlanType.MONTHLY,
      benefits: ["Gym access", "Yoga classes", "Zumba classes", "Aerobics classes", "Steam bath", "Cold bath", "Spa/Massager facilities"]
    },
    {
      code: "PLATINUM_QUARTERLY",
      name: "Platinum",
      category: PlanCategory.INDIVIDUAL,
      maxMembers: 1,
      description: "Gym package with Yoga, Zumba, Aerobics, Steam Bath, Cold Bath and Spa/Massager facilities.",
      durationDays: 90,
      price: 6999,
      planType: MembershipPlanType.QUARTERLY,
      benefits: ["Gym access", "Yoga classes", "Zumba classes", "Aerobics classes", "Steam bath", "Cold bath", "Spa/Massager facilities"]
    },
    {
      code: "PLATINUM_HALF_YEARLY",
      name: "Platinum",
      category: PlanCategory.INDIVIDUAL,
      maxMembers: 1,
      description: "Gym package with Yoga, Zumba, Aerobics, Steam Bath, Cold Bath and Spa/Massager facilities.",
      durationDays: 180,
      price: 9999,
      planType: MembershipPlanType.HALF_YEARLY,
      benefits: ["Gym access", "Yoga classes", "Zumba classes", "Aerobics classes", "Steam bath", "Cold bath", "Spa/Massager facilities"]
    },
    {
      code: "PLATINUM_YEARLY",
      name: "Platinum",
      category: PlanCategory.INDIVIDUAL,
      maxMembers: 1,
      description: "Gym package with Yoga, Zumba, Aerobics, Steam Bath, Cold Bath and Spa/Massager facilities.",
      durationDays: 365,
      price: 17999,
      planType: MembershipPlanType.YEARLY,
      benefits: ["Gym access", "Yoga classes", "Zumba classes", "Aerobics classes", "Steam bath", "Cold bath", "Spa/Massager facilities"]
    },

    // ----------------------------------------------------
    // GOLD COUPLE PACKAGE
    // ----------------------------------------------------
    {
      code: "GOLD_COUPLE_MONTHLY",
      name: "Gold",
      category: PlanCategory.COUPLE,
      maxMembers: 2,
      description: "Couple gym package with Yoga, Zumba, Aerobics, Steam Bath, Cold Bath and Spa/Massager facilities.",
      durationDays: 30,
      price: 3699,
      planType: MembershipPlanType.MONTHLY,
      benefits: ["Gym access for 2 members", "Yoga classes", "Zumba classes", "Aerobics classes", "Steam bath", "Cold bath", "Spa/Massager facilities"]
    },
    {
      code: "GOLD_COUPLE_QUARTERLY",
      name: "Gold",
      category: PlanCategory.COUPLE,
      maxMembers: 2,
      description: "Couple gym package with Yoga, Zumba, Aerobics, Steam Bath, Cold Bath and Spa/Massager facilities.",
      durationDays: 90,
      price: 8999,
      planType: MembershipPlanType.QUARTERLY,
      benefits: ["Gym access for 2 members", "Yoga classes", "Zumba classes", "Aerobics classes", "Steam bath", "Cold bath", "Spa/Massager facilities"]
    },
    {
      code: "GOLD_COUPLE_HALF_YEARLY",
      name: "Gold",
      category: PlanCategory.COUPLE,
      maxMembers: 2,
      description: "Couple gym package with Yoga, Zumba, Aerobics, Steam Bath, Cold Bath and Spa/Massager facilities.",
      durationDays: 180,
      price: 17999,
      planType: MembershipPlanType.HALF_YEARLY,
      benefits: ["Gym access for 2 members", "Yoga classes", "Zumba classes", "Aerobics classes", "Steam bath", "Cold bath", "Spa/Massager facilities"]
    },
    {
      code: "GOLD_COUPLE_YEARLY",
      name: "Gold",
      category: PlanCategory.COUPLE,
      maxMembers: 2,
      description: "Couple gym package with Yoga, Zumba, Aerobics, Steam Bath, Cold Bath and Spa/Massager facilities.",
      durationDays: 365,
      price: 24999,
      planType: MembershipPlanType.YEARLY,
      benefits: ["Gym access for 2 members", "Yoga classes", "Zumba classes", "Aerobics classes", "Steam bath", "Cold bath", "Spa/Massager facilities"]
    }
  ];

  for (const plan of plans) {
    await prisma.membershipPlan.upsert({
      where: {
        branchId_code: {
          branchId: branchId,
          code: plan.code,
        }
      },
      update: {
        name: plan.name,
        category: plan.category,
        maxMembers: plan.maxMembers,
        description: plan.description,
        durationDays: plan.durationDays,
        price: plan.price,
        planType: plan.planType,
        benefits: plan.benefits,
        isActive: true,
      },
      create: {
        branchId: branchId,
        code: plan.code,
        name: plan.name,
        category: plan.category,
        maxMembers: plan.maxMembers,
        description: plan.description,
        durationDays: plan.durationDays,
        price: plan.price,
        planType: plan.planType,
        benefits: plan.benefits,
        isActive: true,
      }
    });
    console.log(`Upserted plan: ${plan.code}`);
  }

  console.log("All plans seeded successfully!");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
