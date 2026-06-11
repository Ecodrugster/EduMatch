export interface Project {
  id: number;
  ownerId: number;
  title: string;
  description?: string;
  skillsRequired: string[];
  isOpen?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: number;
  username: string;
  email?: string;
  skills?: string[];
  bio?: string;
}
