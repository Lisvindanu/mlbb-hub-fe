// TODO: Backend will be implemented in mlbbapi VPS
// Temporarily disabled until VPS endpoint is ready
const API_BASE_URL = import.meta.env.DEV ? '' : 'https://mlbbapi.project-n.site';

export interface TierListData {
  'S+': number[];
  'S': number[];
  'A': number[];
  'B': number[];
  'C': number[];
  'D': number[];
}

export interface TierList {
  id: string;
  title: string;
  creatorName: string;
  creatorId: string | null;
  tiers: TierListData;
  votes: number;
  votedBy: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface Contributor {
  id: string;
  name: string;
  email: string | null;
  createdAt: string;
  totalTierLists: number;
  totalVotes: number;
  totalContributions?: number; // For skin/data contributions
}

// Tier Lists
export async function fetchTierLists(): Promise<TierList[]> {
  const response = await fetch(`${API_BASE_URL}/api/tier-lists`);
  if (!response.ok) throw new Error('Failed to fetch tier lists');
  const data = await response.json();
  return data.tierLists;
}

export async function createTierList(params: {
  title: string;
  creatorName: string;
  creatorId?: string | null;
  tiers: TierListData;
  token?: string;
}): Promise<TierList> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (params.token) {
    headers['Authorization'] = `Bearer ${params.token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/tier-lists`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: params.title,
      creatorName: params.creatorName,
      tiers: params.tiers,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create tier list');
  }

  const data = await response.json();
  return data.tierList;
}

export async function updateTierList(params: {
  id: string;
  title?: string;
  tiers?: TierListData;
  token: string;
}): Promise<TierList> {
  const response = await fetch(`${API_BASE_URL}/api/tier-lists/${params.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${params.token}`,
    },
    body: JSON.stringify({ title: params.title, tiers: params.tiers }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update tier list');
  }

  const data = await response.json();
  return data.tierList;
}

export async function voteTierList(tierListId: string, token?: string): Promise<TierList> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/tier-lists/${tierListId}/vote`, {
    method: 'POST',
    headers,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to vote');
  }

  const data = await response.json();
  return data.tierList;
}

// Comments
export interface Comment {
  id: number;
  tierListId: string;
  parentId: number | null;
  contributorId: number | null;
  authorName: string;
  content: string;
  createdAt: string;
  isVerified: boolean;
}

export async function fetchComments(tierListId: string): Promise<Comment[]> {
  const response = await fetch(`${API_BASE_URL}/api/tier-lists/${tierListId}/comments`);
  if (!response.ok) throw new Error('Failed to fetch comments');
  const data = await response.json();
  return data.comments;
}

export async function postComment(
  tierListId: string,
  params: { content: string; authorName: string; parentId?: number | null; token?: string }
): Promise<Comment> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (params.token) headers['Authorization'] = `Bearer ${params.token}`;

  const response = await fetch(`${API_BASE_URL}/api/tier-lists/${tierListId}/comments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content: params.content, authorName: params.authorName, parentId: params.parentId ?? null }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to post comment');
  }

  const data = await response.json();
  return data.comment;
}

export async function deleteCommentApi(commentId: number, token: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/comments/${commentId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete comment');
  }
}

// Contributors
export async function fetchContributors(): Promise<Contributor[]> {
  const response = await fetch(`${API_BASE_URL}/api/contributors`);
  if (!response.ok) throw new Error('Failed to fetch contributors');
  const data = await response.json();
  return data.contributors;
}

export async function registerContributor(params: {
  name: string;
  email: string;
  password: string;
}): Promise<{ contributor: Contributor; token: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to register');
  }

  return await response.json();
}

export async function loginContributor(email: string, password: string): Promise<{ contributor: Contributor; token: string }> {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to login');
  }

  return await response.json();
}

// Feedback
export type FeedbackCategory = 'bug' | 'feature' | 'suggestion' | 'criticism' | 'compliment' | 'other';

export async function submitFeedback(params: {
  name?: string;
  category: FeedbackCategory;
  message: string;
}): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to submit feedback');
  }
}

export interface FeedbackItem {
  id: number;
  name: string;
  category: FeedbackCategory;
  message: string;
  is_read: boolean;
  created_at: string;
}

export async function fetchFeedbacks(token: string): Promise<FeedbackItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/feedback`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Failed to fetch feedbacks');
  const data = await response.json();
  return data.feedbacks;
}

export async function markFeedbackRead(id: number, token: string): Promise<void> {
  await fetch(`${API_BASE_URL}/api/feedback/${id}/read`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` },
  });
}
