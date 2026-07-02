import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
export default async function DashboardPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accessToken')?.value

  if (!token) {
    redirect('/login')
  }

  const userRole = cookieStore.get('userRole')?.value
  const role = userRole === 'employer' ? 'employer' : 'seeker'

  redirect(`/dashboard/${role}`)
}
