import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

import AppRouter from './admin/router/AppRouter'

function App() {
  const { i18n } = useTranslation()

  useEffect(() => {
    const language = i18n.resolvedLanguage ?? i18n.language
    document.documentElement.lang = language
    document.documentElement.dir = i18n.dir(language)
  }, [i18n, i18n.language])

  return <AppRouter />
}

export default App
