import { Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FileUpload } from '@/components/dashboard/FileUpload';
import { PageLayout } from '@/components/layout/PageLayout';

const UploadPage = () => {
  const navigate = useNavigate();

  const handleUploadComplete = () => {
    navigate('/');
  };

  return (
    <PageLayout 
      title="Upload Files" 
      icon={<Upload className="w-6 h-6" />}
      subtitle="Add files to your cloud storage"
    >
      <div className="max-w-2xl">
        <FileUpload onUploadComplete={handleUploadComplete} currentFolder="/" />
      </div>
    </PageLayout>
  );
};

export default UploadPage;