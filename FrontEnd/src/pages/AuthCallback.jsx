import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Get user data from URL query params or make API call to check auth status
    const checkAuth = async () => {
      try {
        // After OAuth callback, backend should set cookies
        // We can fetch current user info
        const response = await fetch('/api/v1/users/me', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          
          // Save user data to localStorage
          localStorage.setItem('user', JSON.stringify(data.data));
          localStorage.setItem('isLoggedIn', 'true');
          
          console.log('Google login successful');
          
          // Redirect to home page
          navigate('/');
        } else {
          console.error('Auth check failed');
          navigate('/');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/');
      }
    };

    checkAuth();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#4618ac]">
      <div className="text-white text-xl">Prisijungiama...</div>
    </div>
  );
};

export default AuthCallback;
