import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

// Signed-in users go back to Selection; everyone else goes to Home.
export default function BackLink() {
  const { user } = useAuth()
  return (
    <Link className="btn" to={user ? '/selection' : '/'}>
      {user ? 'Back to selection' : 'Back to home'}
    </Link>
  )
}
