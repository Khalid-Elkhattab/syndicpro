import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { login as loginApi, logout as logoutApi, getMe as getMeApi } from '@/api/auth.api';

export const useLogin = () => {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      setUser(data.data.user);
      navigate(data.data.user.role === 'syndic' ? '/syndic/dashboard' : '/coproprietaires/dashboard');
    },
  });
};

export const useLogout = () => {
  const navigate = useNavigate();
  const clearUser = useAuthStore((s) => s.clearUser);

  return useMutation({
    mutationFn: logoutApi,
    onSuccess: () => {
      clearUser();
      navigate('/login');
    },
  });
};

export const useCurrentUser = () => {
  const setUser = useAuthStore((s) => s.setUser);

  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data } = await getMeApi();
      setUser(data.data);
      return data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};