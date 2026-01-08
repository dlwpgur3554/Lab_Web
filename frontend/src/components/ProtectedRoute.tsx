import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()

  useEffect(() => {
    const isLoggedIn = !!localStorage.getItem('lab_user')
    if (!isLoggedIn) {
      navigate('/login')
    }
  }, [navigate])

  const isLoggedIn = !!localStorage.getItem('lab_user')
  if (!isLoggedIn) {
    return null
  }

  return <>{children}</>
}

