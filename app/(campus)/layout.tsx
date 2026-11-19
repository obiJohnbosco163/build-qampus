import { redirect } from 'next/navigation'
import { PlatformShell } from '@/components/qampus/platform-shell'
import { createClient } from '@/lib/supabase/server'

export default async function CampusLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('handle, display_name, institution, department')
    .eq('id', user.id)
    .maybeSingle()
  if (!profile) redirect('/onboarding')

  return <PlatformShell profile={profile} isModerator={user.app_metadata?.role === 'moderator'}>{children}</PlatformShell>
}
