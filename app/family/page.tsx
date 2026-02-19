'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  getHouseholdInfo,
  createInviteLink,
  removeMember,
  leaveHousehold,
  updateHouseholdName,
} from '@/app/actions/household';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Users,
  Crown,
  UserPlus,
  Copy,
  Check,
  Pencil,
  Trash2,
  LogOut,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

type HouseholdInfo = Awaited<ReturnType<typeof getHouseholdInfo>>;

export default function FamilyPage() {
  const [info, setInfo] = useState<HouseholdInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');

  const isOwner = info?.currentUserRole === 'OWNER';

  useEffect(() => {
    loadInfo();
  }, []);

  async function loadInfo() {
    try {
      const data = await getHouseholdInfo();
      setInfo(data);
      setNewName(data.name);
    } catch (error) {
      toast.error('שגיאה בטעינת פרטי המשפחה');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateInvite() {
    startTransition(async () => {
      try {
        const result = await createInviteLink();
        const link = `${window.location.origin}/invite/${result.token}`;
        setInviteLink(link);
        setInviteDialogOpen(true);
      } catch (error: any) {
        toast.error(error.message || 'שגיאה ביצירת קישור');
      }
    });
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      toast.success('הקישור הועתק');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('לא ניתן להעתיק');
    }
  }

  async function handleRemoveMember(memberId: string, displayName: string | null) {
    startTransition(async () => {
      try {
        await removeMember(memberId);
        toast.success(`${displayName || 'החבר'} הוסר ממשק הבית`);
        loadInfo();
      } catch (error: any) {
        toast.error(error.message || 'שגיאה בהסרת חבר');
      }
    });
  }

  async function handleLeave() {
    startTransition(async () => {
      try {
        await leaveHousehold();
        toast.success('עזבת את משק הבית');
        loadInfo();
      } catch (error: any) {
        toast.error(error.message || 'שגיאה בעזיבת משק הבית');
      }
    });
  }

  async function handleUpdateName() {
    if (!newName.trim()) return;
    startTransition(async () => {
      try {
        await updateHouseholdName(newName.trim());
        toast.success('שם משק הבית עודכן');
        setEditingName(false);
        loadInfo();
      } catch (error: any) {
        toast.error(error.message || 'שגיאה בעדכון השם');
      }
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="text-center py-20 text-slate-500">
        לא נמצאו נתונים
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-2xl mx-auto" dir="rtl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-cyan-600" />
            {editingName ? (
              <div className="flex items-center gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="h-9 w-48"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUpdateName();
                    if (e.key === 'Escape') setEditingName(false);
                  }}
                />
                <Button size="sm" onClick={handleUpdateName} disabled={isPending}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <CardTitle className="text-xl">{info.name}</CardTitle>
                {isOwner && (
                  <button
                    onClick={() => setEditingName(true)}
                    className="text-slate-400 hover:text-cyan-600 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
          {isOwner && (
            <Button onClick={handleCreateInvite} disabled={isPending} size="sm" className="gap-2">
              <UserPlus className="h-4 w-4" />
              הזמן חבר
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {info.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-50 text-cyan-600 font-semibold text-sm">
                    {(member.displayName || member.userId).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">
                        {member.displayName || 'חבר'}
                        {member.isCurrentUser && (
                          <span className="text-slate-400 text-sm mr-1">(אתה)</span>
                        )}
                      </span>
                      {member.role === 'OWNER' && (
                        <Badge variant="secondary" className="gap-1 text-xs">
                          <Crown className="h-3 w-3" />
                          בעלים
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">
                      הצטרף {new Date(member.joinedAt).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                </div>
                {isOwner && !member.isCurrentUser && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>הסרת חבר</AlertDialogTitle>
                        <AlertDialogDescription>
                          {member.displayName || 'החבר'} יוסר ממשק הבית ויקבל משק בית חדש משלו.
                          הנתונים שלו לא יועברו.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="flex-row-reverse gap-2">
                        <AlertDialogCancel>ביטול</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleRemoveMember(member.id, member.displayName)}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          הסר
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>

          {info.pendingInvites.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">הזמנות פעילות</h3>
                {info.pendingInvites.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between text-sm py-1">
                    <span className="text-slate-600 truncate max-w-[200px]">
                      ...{inv.token.slice(-8)}
                    </span>
                    <span className="text-slate-400">
                      פג {new Date(inv.expiresAt).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {!isOwner && info.members.length > 1 && (
            <>
              <Separator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full gap-2 text-red-500 border-red-200 hover:bg-red-50">
                    <LogOut className="h-4 w-4" />
                    עזוב את משק הבית
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent dir="rtl">
                  <AlertDialogHeader>
                    <AlertDialogTitle>עזיבת משק הבית</AlertDialogTitle>
                    <AlertDialogDescription>
                      אתה עומד לעזוב את &quot;{info.name}&quot;. ייווצר לך משק בית חדש ריק.
                      הנתונים של משק הבית הנוכחי לא יועברו.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-row-reverse gap-2">
                    <AlertDialogCancel>ביטול</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleLeave}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      עזוב
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>קישור הזמנה</DialogTitle>
            <DialogDescription>
              שלח את הקישור לבן המשפחה. הקישור תקף ל-48 שעות.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 mt-2">
            <Input value={inviteLink} readOnly dir="ltr" className="text-sm" />
            <Button variant="outline" size="icon" onClick={handleCopyLink}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
