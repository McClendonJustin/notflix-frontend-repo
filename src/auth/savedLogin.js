// Cheap check for a login the Supabase library saved in this browser (keys start with "sb-").
export function hasSavedLogin() {
  try {
    return Object.keys(localStorage).some((k) => k.startsWith('sb-'))
  } catch {
    return false
  }
}
