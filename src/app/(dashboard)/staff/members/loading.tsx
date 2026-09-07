import { Activity } from "lucide-react";

export default function Loading() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto h-[calc(100vh-6rem)]">
      <div className="w-full h-full min-h-[500px] rounded-xl bg-card/40 border border-border/50 flex flex-col items-center justify-center space-y-6 shadow-sm backdrop-blur-sm">
        <div className="relative flex items-center justify-center w-20 h-20">
          <div className="absolute inset-0 rounded-full border-[3px] border-primary/10 border-t-primary animate-spin"></div>
          <Activity className="h-8 w-8 text-muted-foreground" />
        </div>
        <div className="text-sm font-semibold text-muted-foreground tracking-[0.2em] uppercase">
          Loading Directory...
        </div>
      </div>
    </div>
  );
}
