import axiosInstance from './axios';

export interface ProjectDocument {
  id: number;
  project_id: number;
  uploaded_by: number;
  name: string;
  file_path: string;
  file_size: number;
  created_at: string;
}

export const fetchDocuments = async (projectId: number): Promise<ProjectDocument[]> => {
  const response = await axiosInstance.get(`/protected/projects/${projectId}/documents`);
  return response.data.documents;
};

export const uploadDocument = async (projectId: number, file: File): Promise<ProjectDocument> => {
  const formData = new FormData();
  formData.append('document', file);
  const response = await axiosInstance.post(`/protected/projects/${projectId}/documents`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data.document;
};

export const deleteDocument = async (projectId: number, docId: number): Promise<void> => {
  await axiosInstance.delete(`/protected/projects/${projectId}/documents/${docId}`);
};
