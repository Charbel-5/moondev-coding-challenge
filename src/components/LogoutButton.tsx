import { useRouter } from 'next/navigation';
import { FiLogOut } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { Button } from './ui/Button';

interface LogoutButtonProps {
  className?: string;
  variant?: "default" | "secondary" | "ghost" | "link" | "success" | "error";
  size?: "default" | "sm" | "lg" | "icon";
}

export default function LogoutButton({ 
  className = '',
  variant = "ghost",
  size = "default"
}: LogoutButtonProps) {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out');
    }
  };

  return (
    <Button
      onClick={handleLogout}
      variant={variant}
      size={size}
      className={className}
      aria-label="Logout"
    >
      <FiLogOut className="mr-2" />
      <span>Logout</span>
    </Button>
  );
}