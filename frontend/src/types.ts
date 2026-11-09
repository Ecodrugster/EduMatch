export interface Project {
  id: number;
  owner_id: number;
  title: string;
  description?: string;
  skills_required?: string[];
  status?: string; // 'open' | 'completed'
  deadline?: string;
  is_open?: boolean;
  match_score?: number;
  start_date?: string;
  end_date?: string;
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
  avg_peer_score?: number;
}

export interface Skill {
  id: number;
  name: string;
  category: string;
}

export interface UserSkill {
  id: number;
  user_id: number;
  skill_id: number;
  skill_name: string;
  category: string;
  level: number;
  evidence_type: string;
  evidence_url?: string;
  verified: boolean;
}

export interface RoleRequirement {
  id?: number;
  role_id?: number;
  skill_id: number;
  skill_name?: string;
  min_level: number;
  weight: number;
}

export interface ProjectRole {
  id: number;
  project_id: number;
  title: string;
  hours_per_week: number;
  requirements?: RoleRequirement[];
  assigned_user?: TeamMember;
}

export interface CandidateParts {
  sSkills: number;
  sTime: number;
  sRel: number;
}

export interface Candidate {
  userId: number;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  score: number;
  parts: CandidateParts;
  reasons: string[];
  hoursPerWeek: number;
  avgPeerScore?: number;
  skills?: UserSkill[];
  eligible: boolean;
}

export interface TeamMemberCandidate {
  roleId: number;
  roleTitle: string;
  userId: number;
  username: string;
  avatar_url?: string;
  score: number;
  parts: CandidateParts;
  reasons: string[];
}

export interface TeamVariant {
  teamScore: number;
  avgScore: number;
  minScore: number;
  members: TeamMemberCandidate[];
}

export interface TeamMember {
  id: number;
  project_id: number;
  role_id: number;
  role_title?: string;
  user_id: number;
  username?: string;
  email?: string;
  avatar_url?: string;
  joined_at?: string;
}

export interface PeerReview {
  id?: number;
  project_id: number;
  author_id?: number;
  author_name?: string;
  target_id: number;
  target_name?: string;
  contribution: number;
  deadlines: number;
  communication: number;
  quality: number;
  comment?: string;
  created_at?: string;
}

export interface ProjectTrackRecord {
  project_id: number;
  project_title: string;
  role_title: string;
  avg_quality: number;
  avg_overall: number;
  review_count: number;
}

export interface UserProfileDetail {
  user: User;
  hours_per_week: number;
  skills: UserSkill[];
  track_record: ProjectTrackRecord[];
}
