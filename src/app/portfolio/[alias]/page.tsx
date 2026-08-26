import { PortfolioService } from '@/lib/services/portfolio.service';
import { notFound } from 'next/navigation';

export default async function PublicPortfolioPage({ params }: { params: { alias: string } }) {
  const portfolio = await PortfolioService.getPublicPortfolioByAlias(params.alias);

  // Deny if unpublished or missing
  if (!portfolio) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 relative overflow-hidden">
      {/* Dark Luxury Accents */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background pointer-events-none"></div>
      
      <main className="max-w-4xl mx-auto px-6 py-16 md:py-24 space-y-20 relative z-10">
        
        {/* Header / Intro */}
        <section className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground drop-shadow-md">
            {portfolio.memberFirstName}&apos;s Fitness Journey
          </h1>
          {portfolio.headline && (
            <p className="text-xl md:text-2xl text-primary font-medium italic">
              &quot;{portfolio.headline}&quot;
            </p>
          )}
          {portfolio.bio && (
            <div className="max-w-2xl mx-auto text-muted-foreground leading-relaxed text-lg">
              {portfolio.bio}
            </div>
          )}
        </section>

        {/* Photos Grid */}
        {portfolio.photos.length > 0 && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
            <h2 className="text-2xl font-semibold border-b border-border/50 pb-4 text-center md:text-left text-foreground">
              Progress Gallery
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {portfolio.photos.map((photo) => (
                <div key={photo.id} className="relative aspect-[3/4] bg-card/50 rounded-xl overflow-hidden group border border-border/50 shadow-sm">
                  {photo.url ? (
                    <img 
                      src={photo.url} 
                      alt={photo.type} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full text-muted-foreground/50">
                      No Image
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                    <span className="text-sm font-medium text-foreground tracking-wide">{photo.type.replace(/_/g, ' ')}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Measurements (If populated) */}
        {portfolio.measurements.length > 0 && (
          <section className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <h2 className="text-2xl font-semibold border-b border-border/50 pb-4 text-foreground">Key Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Future logic to display measurements from DTO */}
            </div>
          </section>
        )}

      </main>

      <footer className="border-t border-border/50 py-8 text-center text-muted-foreground text-sm mt-12 bg-card/30 relative z-10">
        <p className="flex items-center justify-center gap-2">
          Powered by 
          <span className="font-extrabold uppercase italic tracking-tight text-foreground">
            PRO FITNESS <span className="text-primary font-light">OS</span>
          </span>
        </p>
      </footer>
    </div>
  );
}
