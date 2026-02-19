'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getInviteInfo, acceptInvite } from '@/app/actions/household';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

type InviteInfo = Awaited<ReturnType<typeof getInviteInfo>>;

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [info, setInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [joined, setJoined] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function load() {
      try {
        const data = await getInviteInfo(token);
        setInfo(data);
      } catch {
        setInfo({ valid: false, reason: 'שגיאה בטעינת ההזמנה' });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  function handleAccept() {
    startTransition(async () => {
      try {
        const result = await acceptInvite(token);
        setJoined(true);
        toast.success(`הצטרפת למשק הבית "${result.householdName}"`);
        setTimeout(() => router.push('/family'), 2000);
      } catch (error: any) {
        toast.error(error.message || 'שגיאה בהצטרפות');
      }
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-50 to-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (joined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-50 to-slate-50 p-4" dir="rtl">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12 space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-bold text-slate-800">ברוכים הבאים!</h2>
            <p className="text-slate-500">הצטרפת בהצלחה. מעביר אותך...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!info || !info.valid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-50 to-slate-50 p-4" dir="rtl">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12 space-y-4">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto" />
            <h2 className="text-xl font-bold text-slate-800">הזמנה לא תקפה</h2>
            <p className="text-slate-500">{info?.reason || 'הקישור אינו פעיל'}</p>
            <Button onClick={() => router.push('/')} variant="outline">
              חזרה לדף הבית
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-cyan-50 to-slate-50 p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-cyan-100 rounded-2xl flex items-center justify-center">
              <Users className="h-8 w-8 text-cyan-600" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">
            הזמנה למשק בית
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-center">
            <p className="text-lg font-semibold text-slate-800">
              {info.householdName}
            </p>
            <p className="text-sm text-slate-500">
              {info.membersCount} {info.membersCount === 1 ? 'חבר' : 'חברים'}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
            הנתונים האישיים שלך לא יועברו למשק הבית החדש.
            אם יש לך נתונים קיימים, מומלץ לייצא גיבוי לפני ההצטרפות.
          </div>

          <Button
            onClick={handleAccept}
            disabled={isPending}
            className="w-full h-12 text-base font-medium bg-cyan-600 hover:bg-cyan-700"
          >
            {isPending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'הצטרף למשק הבית'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
