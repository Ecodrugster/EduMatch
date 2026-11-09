import axiosInstance from './axios';
import {
  Skill,
  ProjectRole,
  Candidate,
  TeamVariant,
  TeamMember,
  PeerReview,
  UserProfileDetail,
} from '../types';

export const fetchSkills = async (): Promise<Skill[]> => {
  const response = await axiosInstance.get('/api/skills');
  return response.data.skills || [];
};

export const fetchProjectRoles = async (projectId: number): Promise<ProjectRole[]> => {
  const response = await axiosInstance.get(`/api/projects/${projectId}/roles`);
  return response.data.roles || [];
};

export const fetchRoleCandidates = async (roleId: number): Promise<Candidate[]> => {
  const response = await axiosInstance.get(`/api/roles/${roleId}/candidates`);
  return response.data.candidates || [];
};

export const fetchTeamVariants = async (projectId: number): Promise<{ error: string | null; variants: TeamVariant[] }> => {
  const response = await axiosInstance.get(`/api/projects/${projectId}/team-variants`);
  return response.data;
};

export const sendRoleInvite = async (roleId: number, userId: number, direction: 'invite' | 'apply' = 'invite') => {
  const response = await axiosInstance.post(`/api/roles/${roleId}/invites`, {
    user_id: userId,
    direction,
  });
  return response.data;
};

export const acceptInvite = async (inviteId: number) => {
  const response = await axiosInstance.post(`/api/invites/${inviteId}/accept`);
  return response.data;
};

export const fetchProjectTeam = async (projectId: number): Promise<TeamMember[]> => {
  const response = await axiosInstance.get(`/api/projects/${projectId}/team`);
  return response.data.members || [];
};

export const completeProject = async (projectId: number) => {
  const response = await axiosInstance.post(`/api/projects/${projectId}/complete`);
  return response.data;
};

export const submitPeerReview = async (projectId: number, review: {
  target_id: number;
  contribution: number;
  deadlines: number;
  communication: number;
  quality: number;
  comment: string;
}) => {
  const response = await axiosInstance.post(`/api/projects/${projectId}/peer-reviews`, review);
  return response.data;
};

export const fetchProjectPeerReviews = async (projectId: number): Promise<PeerReview[]> => {
  const response = await axiosInstance.get(`/api/projects/${projectId}/peer-reviews`);
  return response.data.reviews || [];
};

export const fetchUserProfileDetail = async (userId: number): Promise<UserProfileDetail> => {
  const response = await axiosInstance.get(`/api/users/${userId}/profile`);
  return response.data.profile;
};

