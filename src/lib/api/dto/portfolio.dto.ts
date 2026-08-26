export interface MobilePortfolioDTO {
  id: string;
  alias: string;
  headline: string | null;
  bio: string | null;
  isPublic: boolean;
  publishedAt: string | null;
  content: any[];
}

export class PortfolioDTO {
  static toMobile(portfolio: any /* eslint-disable-line @typescript-eslint/no-explicit-any */): MobilePortfolioDTO {
    return {
      id: portfolio.id,
      alias: portfolio.alias,
      headline: portfolio.headline,
      bio: portfolio.bio,
      isPublic: portfolio.isPublic,
      publishedAt: portfolio.publishedAt ? portfolio.publishedAt.toISOString() : null,
      content: portfolio.content ? portfolio.content.map((c: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) => ({
        id: c.id,
        orderIndex: c.orderIndex,
        photoUrl: c.progressPhoto?.photoUrl || null,
        photoDate: c.progressPhoto?.date ? c.progressPhoto.date.toISOString() : null,
      })) : [],
    };
  }
}
