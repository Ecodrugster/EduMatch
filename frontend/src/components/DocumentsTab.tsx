import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchDocuments, uploadDocument, deleteDocument, ProjectDocument } from '../api/documents';
import { fetchUser } from '../api/users';
import { useToast } from './ToastProvider';
import { User } from '../types';

interface DocumentsTabProps {
  projectId: number;
  isOwner: boolean;
  currentUserId: number | null;
}

const DocumentItem = ({
  doc,
  isOwner,
  currentUserId,
  onDelete,
}: {
  doc: ProjectDocument;
  isOwner: boolean;
  currentUserId: number | null;
  onDelete: (id: number) => void;
}) => {
  const { data: user } = useQuery<User>({
    queryKey: ['user', doc.uploaded_by],
    queryFn: () => fetchUser(doc.uploaded_by),
  });

  const isUploader = currentUserId === doc.uploaded_by;
  const canDelete = isOwner || isUploader;

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  // Determine file icon and color
  const ext = doc.name.split('.').pop()?.toLowerCase();
  const isPdf = ext === 'pdf';
  const icon = isPdf ? '📕' : '📘';
  const badgeColor = isPdf
    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';

  return (
    <div className="bg-white dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-center gap-4 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="text-3xl select-none">{icon}</span>
        <div className="min-w-0 flex-1">
          <a
            href={`/api${doc.file_path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-600 dark:text-cyan-400 hover:underline font-semibold block truncate"
          >
            {doc.name}
          </a>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badgeColor}`}>
              {ext?.toUpperCase()}
            </span>
            <span>{formatSize(doc.file_size)}</span>
            <span>•</span>
            <span>Загрузил: {user?.username || `ID: ${doc.uploaded_by}`}</span>
            <span>•</span>
            <span>{new Date(doc.created_at).toLocaleString('ru-RU')}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <a
          href={`/api${doc.file_path}`}
          download
          className="p-2 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 rounded transition-colors"
          title="Скачать"
        >
          📥
        </a>
        {canDelete && (
          <button
            onClick={() => onDelete(doc.id)}
            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors border-0 bg-transparent cursor-pointer"
            title="Удалить"
          >
            🗑️
          </button>
        )}
      </div>
    </div>
  );
};

export const DocumentsTab = ({ projectId, isOwner, currentUserId }: DocumentsTabProps) => {
  const queryClient = useQueryClient();
  const { addToast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: documents = [], isLoading } = useQuery<ProjectDocument[]>({
    queryKey: ['documents', projectId],
    queryFn: () => fetchDocuments(projectId),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadDocument(projectId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      addToast('Документ успешно загружен!', 'success');
      setSelectedFile(null);
      // Reset file input
      const fileInput = document.getElementById('doc-file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || err.message || 'Ошибка загрузки', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (docId: number) => deleteDocument(projectId, docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents', projectId] });
      addToast('Документ удален', 'success');
    },
    onError: (err: any) => {
      addToast(err.response?.data?.error || err.message || 'Ошибка удаления', 'error');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext !== 'pdf' && ext !== 'docx' && ext !== 'doc') {
        addToast('Разрешены только PDF и Word файлы (.pdf, .docx, .doc)', 'error');
        e.target.value = '';
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  const handleDelete = (docId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот документ?')) {
      deleteMutation.mutate(docId);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Upload Section */}
      <form onSubmit={handleUpload} className="bg-gray-50 dark:bg-gray-800/40 p-5 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Загрузить новый документ (.pdf, .docx, .doc)
          </label>
          <input
            id="doc-file-input"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-500 dark:text-gray-400
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-cyan-50 file:text-cyan-700
              dark:file:bg-cyan-950/50 dark:file:text-cyan-300
              hover:file:bg-cyan-100 dark:hover:file:bg-cyan-900/50
              cursor-pointer"
          />
        </div>
        <button
          type="submit"
          disabled={!selectedFile || uploadMutation.isPending}
          className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-6 py-2.5 rounded transition-colors disabled:opacity-50 mt-4 md:mt-6 cursor-pointer"
        >
          {uploadMutation.isPending ? 'Загрузка...' : 'Загрузить'}
        </button>
      </form>

      {/* List Section */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          Документация проекта ({documents.length})
        </h3>
        {isLoading ? (
          <p className="text-gray-500 dark:text-gray-400">Загрузка документов...</p>
        ) : documents.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <span className="text-4xl block mb-2">📂</span>
            <p className="text-gray-500 dark:text-gray-400 m-0">Документы еще не загружены</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {documents.map((doc) => (
              <DocumentItem
                key={doc.id}
                doc={doc}
                isOwner={isOwner}
                currentUserId={currentUserId}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
