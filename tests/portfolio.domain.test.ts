import 'dotenv/config';
import { describe, it, expect } from 'vitest';
import prisma from '../src/lib/db/prisma';
import { PortfolioService } from '../src/lib/services/portfolio.service';
import { portfolioAliasSchema } from '../src/lib/validations/fitness.schema';

async function seedPortfolioEnv() {
  const branch = await prisma.branch.create({ data: { name: 'P-Branch', code: `PB-${Date.now()}` } });
  
  const userMember = await prisma.user.create({ data: { email: `pm-${Date.now()}@t.com`, name: 'Mem', role: 'MEMBER' } });
  const member = await prisma.memberProfile.create({ 
    data: { 
      userId: userMember.id, 
      branchId: branch.id, 
      memberNumber: `PM-${Date.now()}`, 
      firstName: 'Portfolio', 
      lastName: 'Owner',
      phone: `123${Date.now()}` // This must NOT leak!
    } 
  });

  return { branch, member, userMember };
}

describe('Phase 2F - Portfolio Domain (Privacy & DTOs)', () => {
  it('1. prevents reserved aliases', () => {
    const result1 = portfolioAliasSchema.safeParse('admin');
    expect(result1.success).toBe(false);

    const result2 = portfolioAliasSchema.safeParse('john-doe-99');
    expect(result2.success).toBe(true);
  });

  it('2. hides unpublished portfolios by default (Deny-by-default)', async () => {
    const env = await seedPortfolioEnv();
    
    // Create but DO NOT publish
    await prisma.portfolio.create({
      data: { memberId: env.member.id, customUrlAlias: `alias-${Date.now()}`, isPublished: false }
    });

    const dto = await PortfolioService.getPublicPortfolioByAlias(`alias-${Date.now()}`);
    expect(dto).toBeNull(); // Must return null if not published
  });

  it('3. generates Public DTO and strips sensitive MemberProfile data', async () => {
    const env = await seedPortfolioEnv();
    const alias = `public-${Date.now()}`;
    
    await PortfolioService.publishPortfolio(env.member.id, alias, 'My Transformation', 'Bio here');

    const dto = await PortfolioService.getPublicPortfolioByAlias(alias);
    expect(dto).toBeDefined();
    expect(dto?.alias).toBe(alias);
    expect(dto?.headline).toBe('My Transformation');
    expect(dto?.memberFirstName).toBe('Portfolio'); // Allowed
    
    // TypeScript check: these fields should not even exist on the type, but let's verify via any casting
    const leaked = dto as any;
    expect(leaked.lastName).toBeUndefined();
    expect(leaked.phone).toBeUndefined(); // NEVER LEAK
    expect(leaked.userId).toBeUndefined();
  });

  it('4. explicitly filters photos by visibility in the Portfolio', async () => {
    const env = await seedPortfolioEnv();
    const alias = `public-${Date.now()}`;
    
    const portfolio = await PortfolioService.publishPortfolio(env.member.id, alias, 'Media');

    // Create a PRIVATE photo
    const privatePhoto = await prisma.progressPhoto.create({
      data: { memberId: env.member.id, uploadedBy: env.userMember.id, storageKey: 'p1', visibility: 'PRIVATE' }
    });

    // Create a PORTFOLIO photo
    const publicPhoto = await prisma.progressPhoto.create({
      data: { memberId: env.member.id, uploadedBy: env.userMember.id, storageKey: 'p2', visibility: 'PORTFOLIO' }
    });

    await PortfolioService.addContentToPortfolio(portfolio.id, privatePhoto.id);
    await PortfolioService.addContentToPortfolio(portfolio.id, publicPhoto.id);

    const dto = await PortfolioService.getPublicPortfolioByAlias(alias);
    
    // Even though both are linked as Content, the Service layer must filter out the PRIVATE one.
    expect(dto?.photos.length).toBe(1);
    expect(dto?.photos[0]?.id).toBe(publicPhoto.id);
  });
});
