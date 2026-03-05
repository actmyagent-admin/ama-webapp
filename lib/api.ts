import { getBrowserClient } from "./supabase";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown
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

async function apiClient<T>(
  path: string,
  options?: RequestInit & { token?: string }
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
    throw new ApiError(
      res.status,
      (data as { message?: string })?.message ?? res.statusText,
      data
    );
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type JobStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "DISPUTED" | "CANCELLED";
export type ProposalStatus = "PENDING" | "ACCEPTED" | "REJECTED";
export type ContractStatus = "PENDING_SIGNATURES" | "ACTIVE" | "DELIVERED" | "COMPLETED" | "DISPUTED";
export type DeliveryStatus = "SUBMITTED" | "APPROVED" | "DISPUTED";
export type UserRole = "BUYER" | "AGENT";

export interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetMin: number;
  budgetMax: number;
  currency: string;
  deadline: string;
  status: JobStatus;
  buyerId: string;
  proposalCount?: number;
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

export interface Message {
  id: string;
  contractId: string;
  senderId: string;
  senderRole: "BUYER" | "AGENT";
  content: string;
  createdAt: string;
}

export interface Delivery {
  id: string;
  contractId: string;
  description: string;
  fileUrls: string[];
  status: DeliveryStatus;
  createdAt: string;
}

export interface AgentProfile {
  id: string;
  userId: string;
  name: string;
  description: string;
  categories: string[];
  priceFrom: number;
  priceTo: number;
  currency: string;
  webhookUrl: string;
  rating?: number;
  totalJobs?: number;
  memberSince?: string;
  avatarUrl?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role?: UserRole;
  agentProfile?: AgentProfile;
}

// ─── API Functions ────────────────────────────────────────────────────────────

export const api = {
  // Jobs
  createJob: (body: {
    title: string;
    description: string;
    category: string;
    budgetMin: number;
    budgetMax: number;
    currency?: string;
    deadline: string;
  }) => apiClient<Job>("/api/jobs", { method: "POST", body: JSON.stringify(body) }),

  getJob: (id: string) => apiClient<JobWithProposals>(`/api/jobs/${id}`),

  getMyJobs: () => apiClient<Job[]>("/api/jobs/my"),

  getOpenJobs: (params?: { category?: string; search?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return apiClient<Job[]>(`/api/jobs${q ? `?${q}` : ""}`);
  },

  // AI categorization
  categorizeTask: (description: string) =>
    apiClient<{ category: string; budgetMin: number; budgetMax: number; deadline: string }>(
      "/api/jobs/categorize",
      { method: "POST", body: JSON.stringify({ description }) }
    ),

  // Proposals
  submitProposal: (body: {
    jobId: string;
    message: string;
    price: number;
    currency?: string;
    estimatedDays: number;
  }) => apiClient<Proposal>("/api/proposals", { method: "POST", body: JSON.stringify(body) }),

  acceptProposal: (id: string) =>
    apiClient<Contract>(`/api/proposals/${id}/accept`, { method: "POST" }),

  // Contracts
  getContract: (id: string) => apiClient<ContractWithDetails>(`/api/contracts/${id}`),

  getMyContracts: () => apiClient<Contract[]>("/api/contracts/my"),

  signContract: (id: string) =>
    apiClient<Contract>(`/api/contracts/${id}/sign`, { method: "POST" }),

  // Payments
  createPayment: (contractId: string) =>
    apiClient<{ clientSecret: string }>(`/api/contracts/${contractId}/payment`, {
      method: "POST",
    }),

  // Messages
  sendMessage: (contractId: string, content: string) =>
    apiClient<Message>(`/api/contracts/${contractId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  getMessages: (contractId: string) =>
    apiClient<Message[]>(`/api/contracts/${contractId}/messages`),

  // Deliveries
  submitDelivery: (body: { contractId: string; description: string; fileUrls: string[] }) =>
    apiClient<Delivery>("/api/deliveries", { method: "POST", body: JSON.stringify(body) }),

  approveDelivery: (id: string) =>
    apiClient<Delivery>(`/api/deliveries/${id}/approve`, { method: "POST" }),

  disputeDelivery: (id: string) =>
    apiClient<Delivery>(`/api/deliveries/${id}/dispute`, { method: "POST" }),

  // Agents
  registerAgent: (body: {
    name: string;
    description: string;
    categories: string[];
    priceFrom: number;
    priceTo: number;
    currency?: string;
    webhookUrl: string;
  }) => apiClient<AgentProfile & { apiKey: string }>("/api/agents/register", {
    method: "POST",
    body: JSON.stringify(body),
  }),

  getAgents: (params?: { category?: string; search?: string }) => {
    const q = new URLSearchParams(params as Record<string, string>).toString();
    return apiClient<AgentProfile[]>(`/api/agents${q ? `?${q}` : ""}`);
  },

  getAgent: (id: string) => apiClient<AgentProfile>(`/api/agents/${id}`),

  // User
  setRole: (role: UserRole) =>
    apiClient<UserProfile>("/api/users/role", { method: "POST", body: JSON.stringify({ role }) }),

  getMe: () => apiClient<UserProfile>("/api/users/me"),

  getStats: () =>
    apiClient<{
      totalJobs?: number;
      activeContracts?: number;
      completed?: number;
      totalSpent?: number;
      earnings?: number;
      rating?: number;
    }>("/api/users/stats"),
};
