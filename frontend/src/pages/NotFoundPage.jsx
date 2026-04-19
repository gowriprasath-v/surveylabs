import { useNavigate } from 'react-router-dom';
import AppShell from '../components/layout/AppShell';
import Button from '../components/ui/Button';
import { Ghost, Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <AppShell>
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4">
        <div className="relative mb-2">
          <p className="text-[120px] font-display font-black text-primary/10 leading-none select-none">404</p>
          <Ghost size={72} strokeWidth={1} className="text-primary/60 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-display font-semibold text-text-1 mb-3 mt-4">
          Page not found
        </h1>
        
        <p className="text-text-2 text-base sm:text-lg max-w-md mx-auto mb-8 leading-relaxed">
          The page you are looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button variant="secondary" onClick={() => navigate(-1)} className="gap-2 w-full sm:w-auto">
            <ArrowLeft size={16} /> Go Back
          </Button>
          <Button variant="primary" onClick={() => navigate('/dashboard')} className="gap-2 w-full sm:w-auto shadow-glow">
            <Home size={16} /> Back to Dashboard
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
