export type IssueStatus = 'pending' | 'verified' | 'assigned' | 'resolved' | 'rejected';
export type IssuePriority = 'low' | 'medium' | 'high' | 'critical';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'citizen' | 'admin';
  contributionScore: number;
  badges: string[];
  createdAt: string;
}

export interface AIAnalysis {
  issueType: string;
  severity: string;
  priority: IssuePriority;
  department: string;
  estimatedDays: number;
  reasoning: string;
  confidence: number;
  // Development suggestions
  category?: string;
  developmentNeed?: string;
  expectedBeneficiaries?: number;
}

export interface CivicIssueReport {
  id: string;
  imageUrl?: string;
  videoUrl?: string;
  description: string;
  category: string;
  latitude: number;
  longitude: number;
  address: string;
  date: string;
  createdAt: string;
  reporterId: string;
  reporterName: string;
  reporterPhoto?: string;
  status: IssueStatus;
  department: string;
  priority: IssuePriority;
  severity: string;
  aiAnalysis?: AIAnalysis;
  votesCount: number;
  upvotes: number;
  downvotes: number;
  verificationCount: number; // confirmations
  rejectionsCount: number;
  verificationStatus: 'unverified' | 'verified' | 'disputed';
  timeline: TimelineEvent[];
  duplicatesMerged: string[]; // ids of other merged reports
  ward: string;
  // Development Suggestion Additions
  title?: string;
  expectedImpact?: string;
  expectedBeneficiaries?: number;
  isVoiceInput?: boolean;
  voiceTranscription?: string;
}

export interface TimelineEvent {
  id: string;
  status: string;
  title: string;
  description: string;
  date: string;
  updatedBy: string;
}

export interface Comment {
  id: string;
  reportId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  content: string;
  createdAt: string;
  imageUrl?: string;
}

export interface Vote {
  id: string;
  reportId: string;
  userId: string;
  voteType: 'confirm' | 'reject' | 'upvote' | 'downvote';
  createdAt: string;
}

export interface LeaderboardUser {
  uid: string;
  displayName: string;
  photoURL: string;
  contributionScore: number;
  badges: string[];
  resolvedCount: number;
  reportsCount: number;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface AIHotspot {
  lat: number;
  lng: number;
  category: string;
  count: number;
  intensity: 'high' | 'medium' | 'low';
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  department: string;
  priority: 'low' | 'medium' | 'high';
}

export interface AnalyticsDashboardData {
  issuesByCategory: { category: string; count: number }[];
  monthlyTrends: { month: string; count: number; resolved: number }[];
  departmentPerformance: { department: string; count: number; averageResolutionDays: number }[];
  communityParticipation: { date: string; votes: number; reports: number }[];
  hotspots: AIHotspot[];
  recommendations: AIRecommendation[];
  dailySummary?: string;
  weeklyTrendsSummary?: string;
  predictionsSummary?: string;
}
