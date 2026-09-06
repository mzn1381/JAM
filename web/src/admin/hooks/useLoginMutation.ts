import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { login } from '../../api/auth/authApi'
import { useAuth } from './useAuth'
import { getErrorMessage } from '../utils/httpError'

export function useLoginMutation() {
  const navigate = useNavigate()
  const { setAuthenticatedSession } = useAuth()

  return useMutation({
    mutationFn: login,
    onSuccess(response) {
      setAuthenticatedSession(response.data)
      toast.success('با موفقیت وارد شدید.')
      navigate('/dashboard', { replace: true })
    },
    onError(error) {
      toast.error(getErrorMessage(error))
    },
  })
}
