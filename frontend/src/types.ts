export interface Project {
  id: number;
  owner_id: number;
  title: string;
  description?: string;
  skills_required: string[];
  is_open?: boolean;
  match_score?: number;
  created_at?: string;
  updated_at?: string;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  skills?: string[];
  bio?: string;
  avatar_url?: string;
}
