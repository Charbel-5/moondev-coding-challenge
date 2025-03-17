import { useRouter } from 'next/navigation';
import { FiLogOut } from 'react-icons/fi';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({ className = '' }: LogoutButtonProps) {
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
    <button
      onClick={handleLogout}
      className={`flex items-center px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-800 transition-colors ${className}`}
      aria-label="Logout"
    >
      <FiLogOut className="mr-2" />
      <span>Logout</span>
    </button>
  );
}