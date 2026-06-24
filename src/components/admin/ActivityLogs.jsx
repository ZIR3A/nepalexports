"use client";

import { useState, useEffect } from "react";
import { Search, Loader2, Eye, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ActivityLogs() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchUser, setSearchUser] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (searchUser) query.append("userName", searchUser);
      if (filterAction && filterAction !== "all") query.append("actionType", filterAction);

      const res = await fetch(`/api/admin/activity-logs?${query.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [searchUser, filterAction]);

  const uniqueActions = [...new Set(logs.map(log => log.action_type))];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div>
        <h2 className="font-display text-2xl font-light">Activity Logs</h2>
        <p className="text-sm text-muted-foreground">Global audit trail of system changes.</p>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-64 max-w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input 
                placeholder="Search by User Name..." 
                className="pl-9"
                value={searchUser}
                onChange={e => setSearchUser(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="text-muted-foreground w-4 h-4" />
              <select
                className="border border-border bg-background/50 rounded-md px-3 h-10 text-sm outline-none"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
              >
                <option value="all">All Actions</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>{action}</option>
                ))}
              </select>
            </div>
          </div>
          <Button variant="outline" onClick={fetchLogs}>
            Refresh
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Date/Time</th>
                <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">User</th>
                <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Action Type</th>
                <th className="text-left px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Target</th>
                <th className="text-center px-5 py-3 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="py-8 text-center"><Loader2 className="animate-spin mx-auto text-muted-foreground" /></td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">No logs found.</td></tr>
              ) : logs.map((log) => (
                <tr key={log._id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-5 py-3 text-sm">
                    {log.userName || "System"} <span className="text-[10px] text-muted-foreground block">{log.userId}</span>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-accent">
                    {log.action_type}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">
                    {log.target_resource || "N/A"}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}>
                      <Eye size={16} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border w-full max-w-2xl p-6 rounded-lg shadow-xl max-h-[80vh] flex flex-col">
            <h3 className="font-display text-xl mb-2">Activity Details</h3>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">Action</p>
                <p className="font-mono text-accent">{selectedLog.action_type}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">User</p>
                <p>{selectedLog.userName} ({selectedLog.userId})</p>
              </div>
            </div>
            
            <p className="text-muted-foreground text-xs uppercase tracking-wider mb-2">Raw JSON Data</p>
            <div className="flex-1 overflow-auto bg-muted/30 p-4 rounded border border-border">
              <pre className="font-mono text-xs text-foreground whitespace-pre-wrap">
                {JSON.stringify(selectedLog.details, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-border">
              <Button onClick={() => setSelectedLog(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
