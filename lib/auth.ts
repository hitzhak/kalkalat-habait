import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

/**
 * Request-scoped cached auth lookup.
 * React.cache() deduplicates within a single server request,
 * so calling getHouseholdId() 9 times in getDashboardData()
 * only hits Supabase + DB once.
 */
export const getHouseholdId = cache(async (): Promise<string> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('לא מחובר — יש להתחבר מחדש');
  }

  let member = await prisma.householdMember.findUnique({
    where: { userId: user.id },
  });

  if (!member) {
    await prisma.household.create({
      data: {
        name: 'הבית שלי',
        members: { create: { userId: user.id, role: 'OWNER' } },
        settings: { create: { payday: 11 } },
      },
    });
    member = await prisma.householdMember.findUnique({
      where: { userId: user.id },
    });
  }

  return member!.householdId;
});

export const getAuthUserId = cache(async (): Promise<string> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('לא מחובר — יש להתחבר מחדש');
  }

  return user.id;
});
