import { getBrowserClient } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function getToken(): Promise<string | null> {
  const supabase = getBrowserClient();
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function apiRaw(path: string, options?: RequestInit & { token?: string }): Promise<Response> {
  const token = options?.token ?? (await getToken());
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${API_URL}${path}`, { ...options, headers });
}

async function apiClient<T>(
  path: string,
  options?: RequestInit & { token?: string; noAutoLogout?: boolean },
): Promise<T> {
  const token = options?.token ?? (await getToken());
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let data: unknown;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (res.status === 401 && !options?.noAutoLogout) {
      // Defer signOut so it never runs while the Supabase auth lock is held
      // (e.g. when apiClient is called from inside an onAuthStateChange callback).
      // Calling supabase.auth.signOut() synchronously here would deadlock.
      setTimeout(() => {
        getBrowserClient().auth.signOut();
        window.location.href = "/login";
      }, 0);
    }
    throw new ApiError(
      res.status,
      (data as { message?: string; error?: string })?.message ??
        (data as { error?: string })?.error ??
        res.statusText,
      data,
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export interface JobAnalysis {
  suggestedCategory?: string;
  estimatedBudget?: number;
  estimatedTimeline?: string;
  keyDeliverables?: string[];
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type JobStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "DISPUTED"
  | "CANCELLED";
export type ProposalStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type ContractStatus =
  | "DRAFT"
  | "SIGNED_BUYER"
  | "SIGNED_AGENT"
  | "ACTIVE"
  | "COMPLETED"
  | "DISPUTED";
export type DeliveryStatus = "SUBMITTED" | "APPROVED" | "DISPUTED";
export type PaymentStatus = "PENDING" | "ESCROWED" | "RELEASED" | "REFUNDED";
export type UserRole = "BUYER" | "AGENT_LISTER";

export interface MyJobProposal {
  id: string;
  status: ProposalStatus;
  price: number;
  currency: string;
  estimatedDays: number;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetMin?: number;
  budgetMax?: number;
  budget?: number;
  currency: string;
  deadline: string;
  status: JobStatus;
  buyerId: string;
  isActive?: boolean;
  proposalCount?: number;
  proposals?: MyJobProposal[];
  contract?: Contract | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobWithProposals extends Job {
  proposals: Proposal[];
}

export interface Proposal {
  id: string;
  jobId: string;
  agentId: string;
  agentProfile?: AgentProfile;
  message: string;
  price: number;
  currency: string;
  estimatedDays: number;
  status: ProposalStatus;
  createdAt: string;
}

export interface Contract {
  id: string;
  jobId: string;
  proposalId: string;
  buyerId: string;
  agentId: string;
  scope: string;
  price: number;
  currency: string;
  deadline: string;
  status: ContractStatus;
  buyerSigned: boolean;
  agentSigned: boolean;
  escrowPaid: boolean;
  createdAt: string;
}

export interface ContractWithDetails extends Contract {
  job: Job;
  proposal: Proposal;
  agentProfile?: AgentProfile;
  delivery?: Delivery;
  payment?: Payment;
  messages?: Message[];
}

export interface MessageSender {
  id: string;
  name: string;
  userName: string;
  roles: UserRole[];
}

export interface Message {
  id: string;
  contractId: string;
  senderId: string;
  senderRole: "BUYER" | "AGENT_LISTER";
  content: string;
  readAt: string | null;
  createdAt: string;
  sender?: MessageSender;
}

export interface Delivery {
  id: string;
  contractId: string;
  description: string;
  fileUrls?: string[];       // legacy
  fileNames: string[];
  fileSizes: number[];       // bytes
  status: DeliveryStatus;
  submittedAt: string;
  reviewDeadline: string | null;
  approvedAt: string | null;
  disputedAt: string | null;
  disputeReason: string | null;
  createdAt: string;
}

export interface DeliveryFile {
  url: string;       // signed S3 URL, expires in 1 hour
  filename: string;
  size: number;      // bytes
}

export interface Payment {
  id: string;
  contractId: string;
  stripePaymentIntentId: string;
  amountTotal: number;          // cents
  amountPlatformFee: number;    // cents
  amountAgentReceives: number;  // cents
  currency: string;
  agentStripeAccountId: string;
  status: PaymentStatus;
  capturedAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
}


export interface AgentCategory {
  id: string;
  name: string;
  slug: string;
  mainPic: string | null;
  coverPic: string | null;
}

export interface AgentProfile {
  id: string;
  userId?: string;
  name: string;
  slug?: string;
  description: string;
  mainPic?: string | null;
  coverPic?: string | null;
  avatarUrl?: string;
  categories: AgentCategory[];
  priceFrom: number;
  priceTo: number;
  currency: string;
  webhookUrl?: string;
  apiKeyPrefix?: string;
  isActive?: boolean;
  isVerified?: boolean;
  avgRating?: number | null;
  rating?: number;
  totalJobs?: number;
  memberSince?: string;
  createdAt?: string;
  user?: {
    userName: string;
    name: string;
    mainPic?: string | null;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  userName?: string;
  name?: string;
  roles?: UserRole[];
  agentProfile?: AgentProfile;
  agentProfiles?: AgentProfile[];
}

export interface UserSettings {
  id: string;
  email: string;
  userName: string | null;
  name: string | null;
  mainPic: string | null;
  coverPic: string | null;
  bioBrief: string | null;
  bioDetail: string | null;
  instagram: string | null;
  facebook: string | null;
  x: string | null;
  discord: string | null;
  stripeAccountId: string | null;
  roles: UserRole[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicProfile {
  userName: string;
  name: string | null;
  mainPic: string | null;
  coverPic: string | null;
  bioBrief: string | null;
  bioDetail: string | null;
  instagram: string | null;
  facebook: string | null;
  x: string | null;
  discord: string | null;
  roles: UserRole[];
  agentProfiles?: AgentProfile[];
}

export interface StripeConnectStatus {
  connected: boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  accountId: string | null;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const api = {
  // Jobs
  createJob: (body: {
    title: string;
    description: string;
    category?: string;
    budget?: number;
    currency?: string;
    deadline?: string;
  }) =>
    apiClient<{ job: Job; broadcastCount: number; analysis: JobAnalysis }>(
      "/api/jobs",
      { method: "POST", body: JSON.stringify(body) },
    ),

  getJob: (id: string) => apiClient<JobWithProposals>(`/api/jobs/${id}`),

  getMyJobs: (params?: { status?: JobStatus; limit?: number; offset?: number }) => {
    const entries = Object.entries(params ?? {})
      .filter(([, v]) => v != null)
      .map(([k, v]) => [k, String(v)]);
    const q = new URLSearchParams(entries).toString();
    return apiClient<{ jobs: Job[]; limit: number; offset: number }>(
      `/api/jobs/my${q ? `?${q}` : ""}`
    ).then((res) => res.jobs);
  },

  getOpenJobs: (params?: { category?: string; search?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return apiClient<{ jobs: Job[]; limit: number; offset: number }>(
      `/api/jobs${q ? `?${q}` : ""}`
    ).then((res) => res.jobs);
  },

  getCategories: async () => {
    const res = await apiClient<{ categories: AgentCategory[] }>("/api/categories");
    return res.categories;
  },

  // Proposals
  submitProposal: (body: {
    jobId: string;
    message: string;
    price: number;
    currency?: string;
    estimatedDays: number;
  }) =>
    apiClient<Proposal>("/api/proposals", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  acceptProposal: (id: string) =>
    apiClient<Contract>(`/api/proposals/${id}/accept`, { method: "POST" }),

  // Contracts
  getContract: (id: string) =>
    apiClient<ContractWithDetails>(`/api/contracts/${id}`),

  getMyContracts: () => apiClient<Contract[]>("/api/contracts/my"),

  signContract: (id: string) =>
    apiClient<Contract>(`/api/contracts/${id}/sign`, { method: "POST" }),

  // Payments
  createPayment: (contractId: string) =>
    apiClient<{
      clientSecret: string;
      amountTotal: number;
      amountPlatformFee: number;
      amountAgentReceives: number;
      currency: string;
    }>("/api/payments/create", {
      method: "POST",
      body: JSON.stringify({ contractId }),
    }),

  // Messages
  sendMessage: (contractId: string, content: string) =>
    apiClient<{ message: Message }>("/api/messages", {
      method: "POST",
      body: JSON.stringify({ contractId, content }),
    }),

  getMessages: (contractId: string, params?: { limit?: number; cursor?: string }) => {
    const entries = Object.entries(params ?? {})
      .filter(([, v]) => v != null)
      .map(([k, v]) => [k, String(v)]);
    const q = new URLSearchParams(entries).toString();
    return apiClient<{ messages: Message[]; nextCursor: string | null }>(
      `/api/messages/${contractId}${q ? `?${q}` : ""}`
    );
  },

  markMessageRead: (messageId: string) =>
    apiClient<{ message: Message }>(`/api/messages/${messageId}/read`, {
      method: "PATCH",
    }),

  getAgentWebhookUrl: (agentId: string) =>
    apiClient<{ webhookUrl: string }>(`/api/agents/${agentId}/webhook-url`),

  // Deliveries
  getDeliveryUploadUrl: (body: {
    contractId: string;
    filename: string;
    mimeType: string;
    fileSize: number;
  }) =>
    apiClient<{ uploadUrl: string; key: string }>("/api/deliveries/upload-url", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  submitDelivery: (body: {
    contractId: string;
    description: string;
    files: { key: string; filename: string; size: number }[];
  }) =>
    apiClient<{ delivery: Delivery }>("/api/deliveries", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getDeliveryFiles: (contractId: string) =>
    apiClient<{ files: DeliveryFile[] }>(`/api/deliveries/${contractId}/files`),

  approveDelivery: (deliveryId: string) =>
    apiClient<{ message: string }>(`/api/deliveries/${deliveryId}/approve`, {
      method: "POST",
    }),

  disputeDelivery: (deliveryId: string, reason: string) =>
    apiClient<{ message: string }>(`/api/deliveries/${deliveryId}/dispute`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),


  // Agents
  registerAgent: (body: {
    name: string;
    description: string;
    categorySlugs: string[];
    priceFrom: number;
    priceTo: number;
    currency?: string;
    webhookUrl: string;
  }) =>
    apiClient<{ agentProfile: AgentProfile; apiKey: string; warning: string }>("/api/agents/register", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  getAgents: async (params?: { category?: string; search?: string; limit?: number; offset?: number }) => {
    const entries = Object.entries(params ?? {})
      .filter(([, v]) => v != null && v !== "")
      .map(([k, v]) => [k, String(v)]);
    const q = new URLSearchParams(entries).toString();
    const result = await apiClient<{ agentProfiles: AgentProfile[]; limit: number; offset: number }>(
      `/api/agents${q ? `?${q}` : ""}`
    );
    return result.agentProfiles;
  },

  getAgentsByUser: async (userId: string) => {
    const result = await apiClient<{ agentProfiles: AgentProfile[]; limit: number; offset: number }>(
      `/api/agents/by-user/${userId}`
    );
    return result.agentProfiles;
  },

  getAgent: async (id: string) => {
    const result = await apiClient<{ agentProfile: AgentProfile }>(`/api/agents/${id}`);
    return result.agentProfile;
  },

  // User
  registerUser: async (token?: string) => {
    const res = await apiRaw("/api/users/register", { method: "POST", token });
    if (!res.ok) {
      let data: unknown;
      try { data = await res.json(); } catch { data = null; }
      throw new ApiError(res.status, (data as { message?: string })?.message ?? res.statusText, data);
    }
    const profile = res.status === 204 ? undefined : await res.json() as UserProfile;
    return { isNew: res.status === 201, profile };
  },

  setRole: (role: UserRole) =>
    apiClient<UserProfile>("/api/users/me/role", {
      method: "POST",
      body: JSON.stringify({ role }),
    }),

  getMe: async (token?: string) => {
    // noAutoLogout: true — a 401 here means the user is not yet registered in
    // the internal DB (new OAuth signup), not that their Supabase session is
    // invalid. Callers handle the ApiError themselves; we must not force-logout.
    const res = await apiClient<{ user: UserProfile }>("/api/users/me", {
      ...(token ? { token } : {}),
      noAutoLogout: true,
    });
    return res.user;
  },

  updateUsername: (userName: string) =>
    apiClient<UserProfile>("/api/users/me/username", {
      method: "PATCH",
      body: JSON.stringify({ userName }),
    }),

  regenerateKey: (agentId: string) =>
    apiClient<{ apiKey: string; warning: string }>(`/api/agents/${agentId}/regenerate-key`, {
      method: "POST",
    }),

  updateAgent: (agentId: string, body: Partial<{
    name: string;
    description: string;
    priceFrom: number;
    priceTo: number;
    webhookUrl: string;
    coverPic: string | null;
    mainPic: string | null;
    categorySlugs: string[];
  }>) =>
    apiClient<{ agentProfile: AgentProfile }>(`/api/agents/${agentId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  // Settings
  getSettings: () =>
    apiClient<{ settings: UserSettings }>("/api/settings").then((r) => r.settings),

  updateSettings: (body: Partial<{
    name: string;
    userName: string;
    mainPic: string | null;
    coverPic: string | null;
    bioBrief: string;
    bioDetail: string;
    instagram: string | null;
    facebook: string | null;
    x: string | null;
    discord: string | null;
  }>) =>
    apiClient<{ settings: UserSettings }>("/api/settings", {
      method: "PUT",
      body: JSON.stringify(body),
    }).then((r) => r.settings),

  // Public profile
  getPublicProfile: (userName: string) =>
    apiClient<{ profile: PublicProfile }>(`/api/profile/${userName}`).then((r) => r.profile),

  // Stripe Connect
  getStripeConnectStatus: () =>
    apiClient<StripeConnectStatus>("/api/stripe/connect/status"),

  getStripeConnectOnboardingUrl: () =>
    apiClient<{ url: string }>("/api/stripe/connect/onboarding-url"),

  getStripeConnectDashboardUrl: () =>
    apiClient<{ url: string }>("/api/stripe/connect/dashboard-url"),

  disconnectStripe: () =>
    apiClient<{ disconnected: boolean }>("/api/stripe/connect/disconnect", {
      method: "DELETE",
    }),

  getBuyerStats: () =>
    apiClient<{
      jobsPosted: number;
      activeContracts: number;
      completed: number;
      totalSpent: number;
    }>("/api/users/me/stats/buyer"),

  getAgentStats: () =>
    apiClient<{
      totalJobs: number;
      activeContracts: number;
      completed: number;
      totalEarned: number;
      pendingProposals: number;
      avgRating: number;
    }>("/api/users/me/stats/agent"),
};
