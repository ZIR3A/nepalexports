import { MapPin, Settings, XCircle, ThermometerSnowflake, Snowflake, Package, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WarehouseGrid({ warehouses, onEdit, onDelete }) {
  if (warehouses.length === 0) {
    return <div className="text-center py-10 text-muted-foreground">No warehouses found.</div>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {warehouses.map(w => {
        const isClosed = w.status === 'Closed';
        const isMaintenance = w.status === 'Maintenance';
        
        return (
          <div key={w._id} className="border border-border bg-card rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col relative overflow-hidden">
            {w.isDefaultInternational && (
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded-bl-lg">
                Int'l Fallback
              </div>
            )}
            
            <div className="flex justify-between items-start mb-4 mt-2">
              <div>
                <h3 className="font-semibold text-lg">{w.name}</h3>
                <span className="font-mono text-xs text-muted-foreground">{w.code}</span>
              </div>
              <div className={`px-2 py-1 text-xs rounded-full font-medium ${
                isClosed ? 'bg-red-500/10 text-red-500' :
                isMaintenance ? 'bg-amber-500/10 text-amber-500' :
                'bg-emerald-500/10 text-emerald-600'
              }`}>
                {w.status}
              </div>
            </div>

            <div className="space-y-3 flex-1 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-2">
                <MapPin size={14} />
                <span>{w.address?.city || 'No City'}, {w.country}</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings size={14} />
                <span>Manager: {w.managerId ? (w.managerId.name || w.managerId.email) : 'Unassigned'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">Currency: {w.currency}</span>
                <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">Radius: {w.geofenceRadiusKM}km</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {(w.capabilities || ['Standard']).map(cap => (
                  <div key={cap} className="flex items-center gap-1 bg-secondary text-secondary-foreground text-[11px] px-2 py-1 rounded-md">
                    {cap === 'Standard' && <Package size={12} />}
                    {cap === 'Refrigerated' && <ThermometerSnowflake size={12} />}
                    {cap === 'Frozen' && <Snowflake size={12} />}
                    {cap}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-border mt-auto">
              <Button variant="outline" className="flex-1 text-xs h-8" onClick={() => onEdit(w)}>
                <Edit size={14} className="mr-2" /> Edit
              </Button>
              <Button variant="outline" className="flex-1 text-xs h-8 text-red-500 hover:text-red-600 hover:bg-red-500/10" onClick={() => onDelete(w._id)}>
                <Trash2 size={14} className="mr-2" /> Delete
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
