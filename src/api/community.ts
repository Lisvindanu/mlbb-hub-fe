const API_BASE_URL = import.meta.env.DEV ? '' : 'https://mlbbapi.project-n.site';

export type PostType = 'build' | 'strategy' | 'discussion' | 'dev';

export interface Post {
  id: number;
  author_id: number | null;
  author_name: string | null;
  type: PostType;
  title: string;
  content: string;
  tags: string[];
  is_pinned: boolean;
  is_dev: boolean;
  likes: number;
  liked: boolean;
  image_url: string | null;
  reply_count: number;
  created_at: string;
  updated_at: string;
}

export async function fetchPosts(params?: { type?: string; limit?: number; offset?: number }, token?: string): Promise<Post[]> {
  const qs = new URLSearchParams();
  if (params?.type) qs.set('type', params.type);
  if (params?.limit) qs.set('limit', String(params.limit));
  if (params?.offset) qs.set('offset', String(params.offset));
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}/api/posts?${qs}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

export async function createPost(
  params: { type: PostType; title: string; content: string; tags?: string[]; image_url?: string | null },
  token: string
): Promise<Post> {
  const res = await fetch(`${API_BASE_URL}/api/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create post');
  }
  return res.json();
}

export async function updatePost(
  id: number,
  params: { title?: string; content?: string; tags?: string[]; image_url?: string | null },
  token: string
): Promise<Post> {
  const res = await fetch(`${API_BASE_URL}/api/posts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update post');
  }
  return res.json();
}

export async function deletePost(id: number, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/posts/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete post');
}

export async function toggleLike(id: number, token?: string): Promise<{ liked: boolean }> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}/api/posts/${id}/like`, { method: 'POST', headers });
  if (!res.ok) throw new Error('Failed to toggle like');
  return res.json();
}

export interface Reply {
  id: number;
  post_id: number;
  author_id: number | null;
  author_name: string | null;
  content: string;
  created_at: string;
}

export async function fetchReplies(postId: number): Promise<Reply[]> {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/replies`);
  if (!res.ok) throw new Error('Failed to fetch replies');
  return res.json();
}

export async function createReply(postId: number, content: string, token: string): Promise<Reply> {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create reply');
  }
  return res.json();
}

export async function deleteReply(postId: number, replyId: number, token: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/replies/${replyId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to delete reply');
}

export async function updateReply(postId: number, replyId: number, content: string, token: string): Promise<Reply> {
  const res = await fetch(`${API_BASE_URL}/api/posts/${postId}/replies/${replyId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update reply');
  }
  return res.json();
}

export async function uploadImage(
  imageData: string,
  mimeType: string,
  token: string
): Promise<{ url: string }> {
  const res = await fetch(`${API_BASE_URL}/api/posts/upload-image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ imageData, mimeType }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to upload image');
  }
  return res.json();
}
