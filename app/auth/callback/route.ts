import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  const errorParam = searchParams.get('error_description');

  if (errorParam) {
    const encoded = encodeURIComponent(errorParam);
    return NextResponse.redirect(`${origin}/login?error=${encoded}`);
  }

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Ignore - can fail in certain server contexts
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }

    const msg = error.message?.toLowerCase() || '';
    if (msg.includes('identity') || msg.includes('already')) {
      return NextResponse.redirect(
        `${origin}/login?error=${encodeURIComponent('כבר קיים חשבון עם האימייל הזה — נסה שיטת התחברות אחרת')}`
      );
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
