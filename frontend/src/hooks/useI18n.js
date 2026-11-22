import { useState } from 'react'
import en from '../i18n/en.json'
import hi from '../i18n/hi.json'
import mr from '../i18n/mr.json'

const translations = { en, hi, mr }

export function useI18n() {
  const [lang, setLang] = useState('en')
  const t = (key) => translations[lang][key] || key
  return { lang, setLang, t }
}
