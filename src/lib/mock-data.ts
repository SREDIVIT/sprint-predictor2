export type HealthStatus = "healthy" | "warning" | "critical";
export type Priority = "Low" | "Medium" | "High" | "Critical";
export type StoryStatus = "To Do" | "In Progress" | "In Review" | "Done" | "Blocked";

export interface Developer {
  id: string;
  name: string;
  role: string;
  avatarSeed: string;
  assigned: number;
  completed: number;
  currentStory: string;
  performance: number;
  health: HealthStatus;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  developerId: string;
  priority: Priority;
  points: number;
  progress: number;
  status: StoryStatus;
  health: HealthStatus;
  bugs: number;
  hoursEstimated: number;
  hoursSpent: number;
  daysRemaining: number;
  riskPercent: number;
  reasons: string[];
  recommendation: string;
  completionProbability: number;
  projectId: string;
}

export interface Project {
  id: string;
  name: string;
  currentSprint: string;
  developers: number;
  completion: number;
  aiHealth: number;
  color: string;
}

export interface AlertItem {
  id: string;
  level: HealthStatus;
  title: string;
  storyId: string;
  storyTitle: string;
  developer: string;
  reasons: string[];
  recommendations: string[];
  createdAt: string;
  reviewed?: boolean;
}

export const developers: Developer[] = [
  { id: "d1", name: "Ava Chen", role: "Senior Frontend", avatarSeed: "ava", assigned: 6, completed: 4, currentStory: "Payments checkout revamp", performance: 92, health: "healthy" },
  { id: "d2", name: "Marcus Reed", role: "Backend Engineer", avatarSeed: "marcus", assigned: 5, completed: 2, currentStory: "Rate limiter for public API", performance: 74, health: "warning" },
  { id: "d3", name: "Priya Natarajan", role: "Full-stack", avatarSeed: "priya", assigned: 7, completed: 5, currentStory: "OAuth refactor", performance: 88, health: "healthy" },
  { id: "d4", name: "Diego Alvarez", role: "Mobile", avatarSeed: "diego", assigned: 4, completed: 1, currentStory: "iOS push notifications", performance: 58, health: "critical" },
  { id: "d5", name: "Sofia Larsen", role: "QA Engineer", avatarSeed: "sofia", assigned: 5, completed: 4, currentStory: "E2E regression suite", performance: 90, health: "healthy" },
  { id: "d6", name: "Ken Watanabe", role: "DevOps", avatarSeed: "ken", assigned: 3, completed: 2, currentStory: "K8s autoscaling", performance: 81, health: "warning" },
];

export const projects: Project[] = [
  { id: "p1", name: "Atlas Payments", currentSprint: "Sprint 24", developers: 6, completion: 68, aiHealth: 82, color: "from-violet-500 to-fuchsia-500" },
  { id: "p2", name: "Nimbus Analytics", currentSprint: "Sprint 12", developers: 4, completion: 42, aiHealth: 61, color: "from-sky-500 to-cyan-500" },
  { id: "p3", name: "Helio Mobile", currentSprint: "Sprint 08", developers: 5, completion: 34, aiHealth: 48, color: "from-amber-500 to-rose-500" },
  { id: "p4", name: "Orbit Platform", currentSprint: "Sprint 31", developers: 7, completion: 79, aiHealth: 91, color: "from-emerald-500 to-teal-500" },
];

export const stories: Story[] = [
  { id: "s1", projectId: "p1", title: "Checkout: Apple Pay integration", description: "Add Apple Pay to the mobile web checkout flow.", developerId: "d1", priority: "High", points: 8, progress: 72, status: "In Progress", health: "healthy", bugs: 1, hoursEstimated: 24, hoursSpent: 17, daysRemaining: 4, riskPercent: 18, reasons: ["On pace with estimate", "Low bug count"], recommendation: "Continue as planned.", completionProbability: 88 },
  { id: "s2", projectId: "p1", title: "Refactor payment webhook signer", description: "Move HMAC signing into shared crypto module.", developerId: "d2", priority: "Critical", points: 13, progress: 34, status: "In Progress", health: "warning", bugs: 4, hoursEstimated: 40, hoursSpent: 30, daysRemaining: 3, riskPercent: 62, reasons: ["Progress trailing estimate by 28%", "Bug count trending up"], recommendation: "Pair with another engineer for the next 2 days.", completionProbability: 46 },
  { id: "s3", projectId: "p1", title: "3DS 2.0 fallback flow", description: "Fallback UX when issuer challenges fail.", developerId: "d3", priority: "Medium", points: 5, progress: 90, status: "In Review", health: "healthy", bugs: 0, hoursEstimated: 16, hoursSpent: 15, daysRemaining: 4, riskPercent: 8, reasons: ["Ahead of schedule"], recommendation: "Ship after review.", completionProbability: 96 },
  { id: "s4", projectId: "p1", title: "iOS push notification pipeline", description: "APNs integration + retry queue.", developerId: "d4", priority: "High", points: 8, progress: 18, status: "Blocked", health: "critical", bugs: 6, hoursEstimated: 32, hoursSpent: 28, daysRemaining: 2, riskPercent: 87, reasons: ["Progress far below plan", "Critical bugs open", "Only 2 days remaining"], recommendation: "Reassign or split. Notify Scrum Master.", completionProbability: 21 },
  { id: "s5", projectId: "p1", title: "E2E regression: checkout suite", description: "Playwright coverage for checkout.", developerId: "d5", priority: "Medium", points: 5, progress: 80, status: "In Progress", health: "healthy", bugs: 0, hoursEstimated: 20, hoursSpent: 15, daysRemaining: 4, riskPercent: 12, reasons: ["Steady progress"], recommendation: "Continue.", completionProbability: 92 },
  { id: "s6", projectId: "p1", title: "K8s HPA for checkout API", description: "Autoscaling based on p95 latency.", developerId: "d6", priority: "High", points: 8, progress: 55, status: "In Progress", health: "warning", bugs: 2, hoursEstimated: 28, hoursSpent: 20, daysRemaining: 3, riskPercent: 48, reasons: ["Latency-based scaling needs tuning"], recommendation: "Add load test day.", completionProbability: 62 },
  { id: "s7", projectId: "p1", title: "Fraud rules v2", description: "Update rule engine thresholds.", developerId: "d3", priority: "Low", points: 3, progress: 100, status: "Done", health: "healthy", bugs: 0, hoursEstimated: 8, hoursSpent: 7, daysRemaining: 0, riskPercent: 2, reasons: ["Completed"], recommendation: "Done.", completionProbability: 100 },
  { id: "s8", projectId: "p1", title: "Refund flow analytics", description: "Segment events for refunds.", developerId: "d1", priority: "Low", points: 3, progress: 45, status: "In Progress", health: "healthy", bugs: 0, hoursEstimated: 10, hoursSpent: 4, daysRemaining: 4, riskPercent: 20, reasons: ["Nominal"], recommendation: "Continue.", completionProbability: 85 },
];

export const alerts: AlertItem[] = [
  { id: "a1", level: "critical", title: "Story likely to miss sprint deadline", storyId: "s4", storyTitle: "iOS push notification pipeline", developer: "Diego Alvarez", reasons: ["Progress at 18% with 2 days remaining", "6 open bugs (High severity)", "Blocked on APNs cert"], recommendations: ["Reassign to Priya Natarajan", "Split into 2 stories", "Reduce sprint scope"], createdAt: "12m ago" },
  { id: "a2", level: "warning", title: "Progress trailing plan", storyId: "s2", storyTitle: "Refactor payment webhook signer", developer: "Marcus Reed", reasons: ["Progress 28% below estimate", "Bug count trending up"], recommendations: ["Pair with senior engineer", "Monitor daily"], createdAt: "1h ago" },
  { id: "a3", level: "warning", title: "Latency scaling needs tuning", storyId: "s6", storyTitle: "K8s HPA for checkout API", developer: "Ken Watanabe", reasons: ["p95 spikes during scale-up"], recommendations: ["Add dedicated load test day"], createdAt: "3h ago" },
  { id: "a4", level: "healthy", title: "Story back on track", storyId: "s1", storyTitle: "Checkout: Apple Pay integration", developer: "Ava Chen", reasons: ["Velocity recovered", "No new bugs"], recommendations: ["Continue as planned"], createdAt: "5h ago" },
];

export const sprint = {
  name: "Sprint 24 — Atlas Payments",
  goal: "Ship Apple Pay + harden checkout pipeline for Black Friday.",
  startDate: "Jul 15, 2026",
  endDate: "Jul 29, 2026",
  daysTotal: 14,
  daysElapsed: 10,
  progress: 68,
  successProbability: 74,
};

export const weeklyProgress = [
  { day: "Mon", planned: 10, actual: 8 },
  { day: "Tue", planned: 20, actual: 17 },
  { day: "Wed", planned: 30, actual: 28 },
  { day: "Thu", planned: 40, actual: 36 },
  { day: "Fri", planned: 50, actual: 47 },
  { day: "Sat", planned: 58, actual: 55 },
  { day: "Sun", planned: 66, actual: 63 },
];

export const workloadData = developers.map((d) => ({ name: d.name.split(" ")[0], assigned: d.assigned, completed: d.completed }));

export const stats = () => {
  const total = stories.length;
  const done = stories.filter((s) => s.status === "Done").length;
  const healthy = stories.filter((s) => s.health === "healthy").length;
  const warning = stories.filter((s) => s.health === "warning").length;
  const critical = stories.filter((s) => s.health === "critical").length;
  return { total, done, healthy, warning, critical };
};
