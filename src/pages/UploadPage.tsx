import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FileUpload } from '@/components/dashboard/FileUpload';

const UploadPage = () => {
  const navigate = useNavigate();

  const handleUploadComplete = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold">Upload Files</h1>
          <p className="text-muted-foreground">Add files to your cloud storage</p>
        </div>

        <FileUpload onUploadComplete={handleUploadComplete} currentFolder="/" />
      </motion.div>
    </div>
  );
};

export default UploadPage;
