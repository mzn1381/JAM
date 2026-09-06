import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { logout } from '../../api/auth/authApi'
import { useAuth } from './useAuth'

export function useLogoutMutation() {
  const navigate = useNavigate()
  const { clearAuthSession } = useAuth()

  return useMutation({
    mutationFn: logout,
    onSuccess() {
      toast.success('با موفقیت خارج شدید.')
    },
    onSettled() {
      clearAuthSession()
      navigate('/login', { replace: true })
    },
  })
}
