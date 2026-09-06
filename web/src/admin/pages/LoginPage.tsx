import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

import { useLoginMutation } from '../hooks/useLoginMutation'

import Input from '../components/ui/Input'
import Button from '../components/ui/Button'
import LanguageSwitch from '../components/ui/LanguageSwitch'

type LoginFormValues = {
  user_name: string
  password: string
}

export default function LoginPage() {
  const { t } = useTranslation()
  const loginMutation = useLoginMutation()
  const [showPassword, setShowPassword] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    defaultValues: {
      user_name: '',
      password: '',
    },
  })

  const onSubmit = (values: LoginFormValues) => {
    loginMutation.mutate(values)
  }

  return (
    <main className="min-h-screen bg-admin-bg px-4 py-8">
      <div className="mx-auto flex max-w-[460px] items-center justify-end gap-3">
        <Link
          to="/docs"
          className="text-sm font-medium text-admin-accent hover:underline"
        >
          {t('header.docs')}
        </Link>
        <LanguageSwitch />
      </div>
      <div className="mx-auto mt-4 max-w-[460px] rounded-2xl border border-admin-border bg-white p-7 shadow-admin-card md:p-8">
        <h1 className="text-[36px] font-extrabold tracking-tight text-admin-ink">
          {t('login.title')}
        </h1>
        <p className="mt-2 text-sm text-admin-muted">{t('login.subtitle')}</p>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            label={t('login.userNameLabel')}
            placeholder={t('login.userNamePlaceholder')}
            autoComplete="username"
            error={errors.user_name?.message}
            {...register('user_name', {
              required: t('login.userNameRequired'),
              pattern: {
                value: /^[a-zA-Z0-9_]+$/,
                message: t('login.userNameFormat'),
              },
            })}
          />

          <Input
            label={t('login.passwordLabel')}
            placeholder={t('login.passwordPlaceholder')}
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            error={errors.password?.message}
            trailingElement={
              <button
                type="button"
                aria-label={
                  showPassword
                    ? t('login.hidePassword')
                    : t('login.showPassword')
                }
                className="pt-2 text-admin-muted transition hover:text-admin-accent"
                onClick={() => setShowPassword((previous) => !previous)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
            {...register('password', {
              required: t('login.passwordRequired'),
            })}
          />

          <Button
            fullWidth
            type="submit"
            className="mt-2"
            disabled={loginMutation.isPending}
          >
            {t('login.submit')}
          </Button>
        </form>
      </div>
    </main>
  )
}
