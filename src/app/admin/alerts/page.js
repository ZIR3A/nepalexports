"use client";
import { useState, useEffect } from "react";
import { Bell, CheckCircle, AlertTriangle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/alerts");
      const data = await res.json();
      if (Array.isArray(data)) {
        setAlerts(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const markAsRead = async (id) => {
    try {
      const res = await fetch("/api/admin/alerts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        fetchAlerts();
      }
    } catch (err) {
      console.error("Failed to mark alert as read", err);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filter === "unread") return !a.isRead;
    return true;
  });

  const getIcon = (severity) => {
    switch (severity) {
      case "critical": return <AlertCircle className="text-red-500" />;
      case "warning": return <AlertTriangle className="text-amber-500" />;
      case "info": default: return <Bell className="text-blue-500" />;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-display text-2xl font-light">System Alerts</h2>
          <p className="text-sm text-muted-foreground">WMS sync notifications and stock discrepancies.</p>
        </div>
        <div className="flex gap-2">
          <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>All</Button>
          <Button variant={filter === 'unread' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('unread')}>
            Unread
            {alerts.filter(a => !a.isRead).length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                {alerts.filter(a => !a.isRead).length}
              </span>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchAlerts}>Refresh</Button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-muted-foreground" /></div>
        ) : filteredAlerts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No alerts found.</div>
        ) : (
          <div className="divide-y divide-border">
            {filteredAlerts.map(alert => (
              <div key={alert._id} className={`p-4 flex gap-4 ${alert.isRead ? 'opacity-70 bg-muted/30' : 'bg-card'}`}>
                <div className="shrink-0 mt-1">
                  {getIcon(alert.severity)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-medium text-foreground">{alert.title}</h3>
                    <span className="text-xs text-muted-foreground">{new Date(alert.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{alert.message}</p>
                  
                  {alert.metadata && Object.keys(alert.metadata).length > 0 && (
                    <pre className="bg-muted p-2 rounded text-xs font-mono text-muted-foreground overflow-auto mb-3">
                      {JSON.stringify(alert.metadata, null, 2)}
                    </pre>
                  )}

                  {!alert.isRead && (
                    <Button variant="outline" size="sm" onClick={() => markAsRead(alert._id)} className="h-8 text-xs">
                      <CheckCircle className="w-3 h-3 mr-2" /> Mark as Read
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
