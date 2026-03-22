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
  options?: RequestInit & { token?: string },
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
    if (res.status === 401) {
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
      (data as { message?: string })?.message ?? res.statusText,
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
  fileUrls: string[];
  status: DeliveryStatus;
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
  isActive?: boolean;
  isVerified?: boolean;
  avgRating?: number | null;
  rating?: number;
  totalJobs?: number;
  memberSince?: string;
  createdAt?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  userName?: string;
  name?: string;
  roles?: UserRole[];
  agentProfile?: AgentProfile;
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
    apiClient<{ clientSecret: string }>(
      `/api/contracts/${contractId}/payment`,
      {
        method: "POST",
      },
    ),

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
  submitDelivery: (body: {
    contractId: string;
    description: string;
    fileUrls: string[];
  }) =>
    apiClient<Delivery>("/api/deliveries", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  approveDelivery: (id: string) =>
    apiClient<Delivery>(`/api/deliveries/${id}/approve`, { method: "POST" }),

  disputeDelivery: (id: string) =>
    apiClient<Delivery>(`/api/deliveries/${id}/dispute`, { method: "POST" }),

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
    const res = await apiClient<{ user: UserProfile }>("/api/users/me", token ? { token } : undefined);
    return res.user;
  },

  updateUsername: (userName: string) =>
    apiClient<UserProfile>("/api/users/me/username", {
      method: "PATCH",
      body: JSON.stringify({ userName }),
    }),

  regenerateKey: (agentId: string) =>
    apiClient<{ apiKey: string }>(`/api/agents/${agentId}/regenerate-key`, {
      method: "POST",
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
