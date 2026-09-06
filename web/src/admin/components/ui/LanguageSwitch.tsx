import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'

export default function LanguageSwitch() {
  const { i18n, t } = useTranslation()

  return (
    <div className="inline-flex items-center gap-1 rounded-xl border border-admin-border bg-white p-1">
      <button
        type="button"
        onClick={() => i18n.changeLanguage('fa')}
        className={clsx(
          'rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
          i18n.language === 'fa'
            ? 'bg-admin-accent text-white'
            : 'text-admin-muted hover:text-admin-ink',
        )}
      >
        {t('language.fa')}
      </button>
      <button
        type="button"
        onClick={() => i18n.changeLanguage('en')}
        className={clsx(
          'rounded-lg px-2.5 py-1.5 text-xs font-semibold transition',
          i18n.language === 'en'
            ? 'bg-admin-accent text-white'
            : 'text-admin-muted hover:text-admin-ink',
        )}
      >
        {t('language.en')}
      </button>
    </div>
  )
}
