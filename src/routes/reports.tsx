import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { Sparkles, Download, FileBarChart, Users, ShieldAlert, TrendingUp, Plus, ClipboardList, BookOpen, HeartHandshake } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reports")({
  head: () => ({
    meta: [
      { title: "Reports · SprintSense AI" },
      { name: "description", content: "Downloadable sprint, developer, AI risk, and performance reports." },
      { property: "og:title", content: "Reports · SprintSense AI" },
      { property: "og:description", content: "Downloadable AI-generated sprint reports." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  const user = useAuth();
  
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog & Form States
  const [generateOpen, setGenerateOpen] = useState(false);
  const [reportType, setReportType] = useState("Sprint");
  const [reportTitle, setReportTitle] = useState("");
  
  // Custom content inputs depending on report type
  const [field1, setField1] = useState(""); // Summary / What went well
  const [field2, setField2] = useState(""); // Details / What didn't go well
  const [field3, setField3] = useState(""); // Recommendations / Action items
  const [generating, setGenerating] = useState(false);

  const loadData = async () => {
    try {
      const projRes = await api.get("/api/projects");
      setProjects(projRes.data);
      if (projRes.data.length > 0) {
        const defaultProjId = selectedProjectId || projRes.data[0].id.toString();
        setSelectedProjectId(defaultProjId);
        await fetchReports(defaultProjId);
      } else {
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const fetchReports = async (projId: string) => {
    try {
      const res = await api.get("/api/reports", { params: { project_id: projId } });
      setReportsList(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setLoading(true);
      loadData();
    }
  }, [user]);

  const handleProjectChange = (val: string) => {
    setSelectedProjectId(val);
    setLoading(true);
    fetchReports(val);
  };

  if (user === undefined) return null;
  if (!user) return <Navigate to="/login" />;

  // Trigger PDF Stream download
  const handleDownloadPDF = async (reportId: number, title: string) => {
    const loadingToast = toast.loading(`Generating PDF: ${title}...`);
    try {
      const res = await api.get(`/api/reports/${reportId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title.replace(/\s+/g, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss(loadingToast);
      toast.success("PDF report downloaded successfully!");
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Failed to generate PDF report.");
      console.error(err);
    }
  };

  // Pre-fill text inputs helper based on type
  const handleTypeChange = (type: string) => {
    setReportType(type);
    setReportTitle(`${type} Report - ${new Date().toLocaleDateString()}`);
    
    // Set placeholder content guidelines
    if (type === "Sprint") {
      setField1("Velocity is holding at 35 story points. Sprint 24 completion is at 68% with checkout pipelines stabilized.");
      setField2("Minor bugs discovered in Apple Pay payment callback flows.");
      setField3("Monitor checkout build deployment and merge pending Playwright E2E integration test suites.");
    } else if (type === "Retrospective") {
      setField1("Core webhook cryptography refactoring completed. Successful load testing on checkout microservices.");
      setField2("Mobile push notifications pipeline stalled due to external APNs certificate verification delays.");
      setField3("Marcus Reed to pair-program with Diego Alvarez tomorrow morning to configure iOS developer profile certs.");
    } else if (type === "Sprint Review") {
      setField1("Demoed the Apple Pay checkout integration flow successfully on the staging environment.");
      setField2("Incomplete webhook security tests carried forward to Sprint 25.");
      setField3("Stakeholder feedback: Add Google Pay payment fallback checkout logic to next sprint commitments.");
    } else if (type === "Risk") {
      setField1("Critical warning: iOS push notification pipeline story is blocked with 2 days remaining.");
      setField2("High volume of active bugs (4 open severity bugs) found on Webhook Signer code branches.");
      setField3("Implement immediate code freeze on non-essential tasks. Pair Marcus Reed with Diego Alvarez.");
    } else {
      setField1("Overall project status is healthy. Deliverables are aligned with roadmap milestones.");
      setField2("Risk of delay on mobile items is mitigated by shifting mobile QA to senior fullstack developers.");
      setField3("Review roadmap commitments with stakeholders next Thursday.");
    }
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportTitle || !field1) {
      toast.error("Please fill in report title and content details.");
      return;
    }
    setGenerating(true);
    
    // Assemble content JSON depending on type
    let reportContent: any = {};
    if (reportType === "Sprint") {
      reportContent = {
        executive_summary: field1,
        bottlenecks_discovered: field2.split("\n").filter(Boolean),
        next_actions: field3.split("\n").filter(Boolean)
      };
    } else if (reportType === "Retrospective") {
      reportContent = {
        what_went_well: field1.split("\n").filter(Boolean),
        what_did_not_go_well: field2.split("\n").filter(Boolean),
        agreed_action_items: field3.split("\n").filter(Boolean)
      };
    } else if (reportType === "Sprint Review") {
      reportContent = {
        delivered_features: field1.split("\n").filter(Boolean),
        incomplete_items: field2.split("\n").filter(Boolean),
        stakeholder_feedback: field3.split("\n").filter(Boolean)
      };
    } else if (reportType === "Risk") {
      reportContent = {
        risk_summary: field1,
        contributing_blockers: field2.split("\n").filter(Boolean),
        mitigation_strategy: field3
      };
    } else {
      reportContent = {
        status_update: field1,
        risk_factors: field2,
        recommendations: field3
      };
    }

    try {
      // Find active sprint to tie it
      const sprintRes = await api.get("/api/sprints", { params: { project_id: selectedProjectId } });
      const active = sprintRes.data.find((s: any) => s.is_active);

      await api.post("/api/reports", {
        project_id: parseInt(selectedProjectId),
        sprint_id: active ? active.id : null,
        type: reportType,
        title: reportTitle,
        content: reportContent
      });

      toast.success("Agile report generated and logged!");
      setGenerateOpen(false);
      
      // Reset forms
      setReportTitle("");
      setField1("");
      setField2("");
      setField3("");

      fetchReports(selectedProjectId);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "Risk": return ShieldAlert;
      case "Retrospective": return HeartHandshake;
      case "Sprint Review": return BookOpen;
      case "Sprint": return FileBarChart;
      default: return ClipboardList;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case "Risk": return "from-amber-500 to-rose-500";
      case "Retrospective": return "from-emerald-500 to-teal-500";
      case "Sprint Review": return "from-sky-500 to-cyan-500";
      default: return "from-violet-500 to-fuchsia-500";
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header Section */}
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <div className="text-xs font-semibold text-primary uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Insights
            </div>
            <h1 className="font-display text-4xl font-bold mt-1">Reports</h1>
            <p className="text-muted-foreground mt-1">
              {reportsList.length} logs recorded · exportable as PDF.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Project:</Label>
              <Select value={selectedProjectId} onValueChange={handleProjectChange}>
                <SelectTrigger className="w-56 bg-background/50">
                  <SelectValue placeholder="Select project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {user.role === "scrum" && (
              <Dialog open={generateOpen} onOpenChange={(v) => { setGenerateOpen(v); if (v) handleTypeChange("Sprint"); }}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary text-white shadow-lg glow">
                    <Plus className="h-4 w-4 mr-1" /> Generate Report
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg glass-strong border-border">
                  <DialogHeader>
                    <DialogTitle className="font-display text-2xl font-bold">Generate Agile Report</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleGenerateReport} className="space-y-4 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Report Type</Label>
                        <Select value={reportType} onValueChange={handleTypeChange}>
                          <SelectTrigger className="mt-1.5">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["Sprint", "Project Status", "Sprint Review", "Retrospective", "Risk"].map((t) => (
                              <SelectItem key={t} value={t}>{t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="title">Report Title</Label>
                        <Input
                          id="title"
                          value={reportTitle}
                          onChange={(e) => setReportTitle(e.target.value)}
                          className="mt-1.5"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <Label>
                          {reportType === "Sprint" ? "Executive Summary" :
                           reportType === "Retrospective" ? "What Went Well (One item per line)" :
                           reportType === "Sprint Review" ? "Delivered Features (One item per line)" :
                           reportType === "Risk" ? "Risk Summary Overview" : "Status Update Details"}
                        </Label>
                        <Textarea
                          value={field1}
                          onChange={(e) => setField1(e.target.value)}
                          className="mt-1.5 bg-background/50 text-[11px]"
                          rows={2.5}
                          required
                        />
                      </div>

                      <div>
                        <Label>
                          {reportType === "Sprint" ? "Bottlenecks Discovered (One item per line)" :
                           reportType === "Retrospective" ? "What Didn't Go Well (One item per line)" :
                           reportType === "Sprint Review" ? "Incomplete Backlog Items (One item per line)" :
                           reportType === "Risk" ? "Contributing Blockers (One item per line)" : "Active Risk Factors"}
                        </Label>
                        <Textarea
                          value={field2}
                          onChange={(e) => setField2(e.target.value)}
                          className="mt-1.5 bg-background/50 text-[11px]"
                          rows={2.5}
                        />
                      </div>

                      <div>
                        <Label>
                          {reportType === "Sprint" ? "Next Scheduled Actions (One item per line)" :
                           reportType === "Retrospective" ? "Agreed Action Items (One item per line)" :
                           reportType === "Sprint Review" ? "Stakeholder Feedback (One item per line)" :
                           reportType === "Risk" ? "Mitigation Strategy Description" : "Roadmap Recommendations"}
                        </Label>
                        <Textarea
                          value={field3}
                          onChange={(e) => setField3(e.target.value)}
                          className="mt-1.5 bg-background/50 text-[11px]"
                          rows={2.5}
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={generating} className="w-full gradient-primary text-white h-11 font-semibold mt-2">
                      {generating ? "Compiling..." : "Compile & Log PDF Report"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Reports Listing Grid */}
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="text-sm text-muted-foreground animate-pulse">Loading reports list...</div>
          </div>
        ) : reportsList.length === 0 ? (
          <div className="flex flex-col h-64 items-center justify-center glass rounded-2xl p-6 text-center max-w-lg mx-auto">
            <FileBarChart className="h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="font-semibold text-lg">No Reports Found</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Use the generate button to compile a Sprint Retrospective, Review, or Risk Mitigation report.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-500">
            {reportsList.map((r) => {
              const Icon = getIcon(r.type);
              const color = getColor(r.type);
              
              // Count bullet list items for description helper
              let itemCount = 0;
              if (r.content && typeof r.content === "object") {
                itemCount = Object.values(r.content).reduce((acc: number, val: any) => {
                  if (Array.isArray(val)) return acc + val.length;
                  return acc + 1;
                }, 0);
              }

              return (
                <div key={r.id} className="glass rounded-2xl p-6 relative overflow-hidden group hover:-translate-y-1 transition-all flex flex-col justify-between border">
                  <div className={`absolute -top-16 -right-16 h-48 w-48 rounded-full bg-gradient-to-br ${color} opacity-20 blur-3xl`} />
                  <div className="relative flex items-start gap-4">
                    <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${color} text-white shadow-lg shrink-0`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-display text-xl font-bold truncate">{r.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wider font-semibold">
                        Type: {r.type} · {itemCount} metrics logged
                      </p>
                      <p className="text-[11px] text-muted-foreground/80 mt-1">
                        Logged on {new Date(r.created_at).toLocaleString()}
                      </p>
                      <div className="mt-4 flex gap-2">
                        <Button size="sm" className="gradient-primary text-white" onClick={() => handleDownloadPDF(r.id, r.title)}>
                          <Download className="h-3.5 w-3.5 mr-1.5" /> PDF Download
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
