import { createClient } from '@/lib/supabase/server';

export async function getAuthUserId(): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('לא מחובר — יש להתחבר מחדש');
  }

  return user.id;
}
