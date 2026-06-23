import { Search, Bell } from "lucide-react";

export default function AdminTopBar({ activeNav }) {
  return (
    <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b border-border px-8 py-4 flex items-center justify-between">
      <div>
        <h1 className="font-medium text-foreground capitalize">{activeNav}</h1>
        <p className="font-mono text-[10px] text-muted-foreground">Last updated: {new Date().toLocaleTimeString()}</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input placeholder="Search..." className="bg-muted border border-border pl-9 pr-4 py-2 text-sm outline-none w-48 focus:border-accent/50" />
        </div>
        <button className="relative p-2 text-muted-foreground hover:text-foreground">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-accent" />
        </button>
      </div>
    </div>
  );
}
