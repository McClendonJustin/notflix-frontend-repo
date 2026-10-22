import { useContext } from 'react'
import { LibraryContext } from './LibraryContext'

export function useLibrary() {
  const ctx = useContext(LibraryContext)
  if (!ctx) throw new Error('useLibrary must be used inside <LibraryProvider>')
  return ctx
}
