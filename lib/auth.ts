import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db';

export async function getHouseholdId(): Promise<string> {
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
    const household = await prisma.household.create({
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
}

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
