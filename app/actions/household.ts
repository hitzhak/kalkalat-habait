'use server';

import { prisma } from '@/lib/db';
import { getHouseholdId, getAuthUserId } from '@/lib/auth';

/**
 * קבלת פרטי משק הבית — חברים, הזמנות, שם
 */
export async function getHouseholdInfo() {
  try {
    const householdId = await getHouseholdId();
    const userId = await getAuthUserId();

    const household = await prisma.household.findUnique({
      where: { id: householdId },
      include: {
        members: {
          orderBy: { joinedAt: 'asc' },
        },
        invites: {
          where: {
            usedAt: null,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!household) {
      throw new Error('משק בית לא נמצא');
    }

    const currentMember = household.members.find((m) => m.userId === userId);

    return {
      id: household.id,
      name: household.name,
      createdAt: household.createdAt.toISOString(),
      members: household.members.map((m) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        displayName: m.displayName,
        joinedAt: m.joinedAt.toISOString(),
        isCurrentUser: m.userId === userId,
      })),
      pendingInvites: household.invites.map((inv) => ({
        id: inv.id,
        token: inv.token,
        expiresAt: inv.expiresAt.toISOString(),
        createdAt: inv.createdAt.toISOString(),
      })),
      currentUserRole: currentMember?.role || 'MEMBER',
    };
  } catch (error) {
    console.error('Error fetching household info:', error);
    throw new Error('שגיאה בטעינת פרטי משק הבית');
  }
}

/**
 * יצירת קישור הזמנה — OWNER only, 48h expiry
 */
export async function createInviteLink() {
  try {
    const householdId = await getHouseholdId();
    const userId = await getAuthUserId();

    const member = await prisma.householdMember.findUnique({
      where: { userId },
    });

    if (!member || member.role !== 'OWNER') {
      throw new Error('רק בעל הבית יכול להזמין חברים');
    }

    const invite = await prisma.householdInvite.create({
      data: {
        householdId,
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
      },
    });

    return {
      success: true,
      token: invite.token,
      expiresAt: invite.expiresAt.toISOString(),
    };
  } catch (error) {
    console.error('Error creating invite link:', error);
    throw error instanceof Error ? error : new Error('שגיאה ביצירת קישור הזמנה');
  }
}

/**
 * קבלת פרטי הזמנה לפי token (public — for invite landing page)
 */
export async function getInviteInfo(token: string) {
  try {
    const invite = await prisma.householdInvite.findUnique({
      where: { token },
      include: {
        household: {
          select: {
            id: true,
            name: true,
            members: {
              select: { displayName: true, role: true },
            },
          },
        },
      },
    });

    if (!invite) {
      return { valid: false as const, reason: 'הזמנה לא נמצאה' };
    }

    if (invite.usedAt) {
      return { valid: false as const, reason: 'ההזמנה כבר מומשה' };
    }

    if (invite.expiresAt < new Date()) {
      return { valid: false as const, reason: 'ההזמנה פגה — בקש קישור חדש' };
    }

    return {
      valid: true as const,
      householdName: invite.household.name,
      membersCount: invite.household.members.length,
      expiresAt: invite.expiresAt.toISOString(),
    };
  } catch (error) {
    console.error('Error fetching invite info:', error);
    return { valid: false as const, reason: 'שגיאה בטעינת ההזמנה' };
  }
}

/**
 * קבלת הזמנה — מעביר את המשתמש למשק הבית המזמין
 */
export async function acceptInvite(token: string) {
  try {
    const userId = await getAuthUserId();

    const invite = await prisma.householdInvite.findUnique({
      where: { token },
      include: { household: true },
    });

    if (!invite) {
      throw new Error('הזמנה לא נמצאה');
    }
    if (invite.usedAt) {
      throw new Error('ההזמנה כבר מומשה');
    }
    if (invite.expiresAt < new Date()) {
      throw new Error('ההזמנה פגה — בקש קישור חדש');
    }

    const existingMember = await prisma.householdMember.findUnique({
      where: { userId },
    });

    if (existingMember?.householdId === invite.householdId) {
      throw new Error('אתה כבר חבר במשק בית זה');
    }

    await prisma.$transaction(async (tx) => {
      if (existingMember) {
        const oldHouseholdId = existingMember.householdId;

        await tx.householdMember.delete({
          where: { userId },
        });

        const remainingMembers = await tx.householdMember.count({
          where: { householdId: oldHouseholdId },
        });

        if (remainingMembers === 0) {
          await tx.household.delete({ where: { id: oldHouseholdId } });
        }
      }

      await tx.householdMember.create({
        data: {
          householdId: invite.householdId,
          userId,
          role: 'MEMBER',
        },
      });

      await tx.householdInvite.update({
        where: { id: invite.id },
        data: {
          usedAt: new Date(),
          usedByUserId: userId,
        },
      });
    });

    return {
      success: true,
      householdName: invite.household.name,
    };
  } catch (error) {
    console.error('Error accepting invite:', error);
    throw error instanceof Error ? error : new Error('שגיאה בהצטרפות למשק הבית');
  }
}

/**
 * הסרת חבר — OWNER only
 */
export async function removeMember(memberId: string) {
  try {
    const householdId = await getHouseholdId();
    const userId = await getAuthUserId();

    const currentMember = await prisma.householdMember.findUnique({
      where: { userId },
    });

    if (!currentMember || currentMember.role !== 'OWNER') {
      throw new Error('רק בעל הבית יכול להסיר חברים');
    }

    const targetMember = await prisma.householdMember.findUnique({
      where: { id: memberId },
    });

    if (!targetMember || targetMember.householdId !== householdId) {
      throw new Error('החבר לא נמצא במשק הבית');
    }

    if (targetMember.userId === userId) {
      throw new Error('לא ניתן להסיר את עצמך — השתמש ב"עזיבת משק בית"');
    }

    await prisma.$transaction(async (tx) => {
      await tx.householdMember.delete({
        where: { id: memberId },
      });

      await tx.household.create({
        data: {
          name: 'הבית שלי',
          members: { create: { userId: targetMember.userId, role: 'OWNER' } },
          settings: { create: { payday: 11 } },
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error('Error removing member:', error);
    throw error instanceof Error ? error : new Error('שגיאה בהסרת החבר');
  }
}

/**
 * עזיבת משק בית — לחברים (לא OWNER)
 */
export async function leaveHousehold() {
  try {
    const userId = await getAuthUserId();

    const member = await prisma.householdMember.findUnique({
      where: { userId },
      include: {
        household: {
          include: { members: true },
        },
      },
    });

    if (!member) {
      throw new Error('לא נמצא חבר');
    }

    if (member.role === 'OWNER' && member.household.members.length > 1) {
      throw new Error('בעל הבית לא יכול לעזוב כשיש חברים נוספים — הסר אותם קודם או העבר בעלות');
    }

    if (member.household.members.length === 1) {
      throw new Error('אי אפשר לעזוב — אתה החבר היחיד');
    }

    await prisma.$transaction(async (tx) => {
      const oldHouseholdId = member.householdId;

      await tx.householdMember.delete({
        where: { userId },
      });

      await tx.household.create({
        data: {
          name: 'הבית שלי',
          members: { create: { userId, role: 'OWNER' } },
          settings: { create: { payday: 11 } },
        },
      });
    });

    return { success: true };
  } catch (error) {
    console.error('Error leaving household:', error);
    throw error instanceof Error ? error : new Error('שגיאה בעזיבת משק הבית');
  }
}

/**
 * עדכון שם משק הבית — OWNER only
 */
export async function updateHouseholdName(name: string) {
  try {
    const householdId = await getHouseholdId();
    const userId = await getAuthUserId();

    const member = await prisma.householdMember.findUnique({
      where: { userId },
    });

    if (!member || member.role !== 'OWNER') {
      throw new Error('רק בעל הבית יכול לשנות את השם');
    }

    if (!name || name.trim().length === 0) {
      throw new Error('שם משק הבית לא יכול להיות ריק');
    }

    await prisma.household.update({
      where: { id: householdId },
      data: { name: name.trim() },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating household name:', error);
    throw error instanceof Error ? error : new Error('שגיאה בעדכון שם משק הבית');
  }
}
