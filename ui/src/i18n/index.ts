import en from './locales/en.json'
import id from './locales/id.json'

const messages: Record<string, Record<string, unknown>> = {
  en,
  id,
}

export default function getMessages(locale: string) {
  return messages[locale] ?? messages['id']
}

export type Messages = typeof id
