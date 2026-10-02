import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function CommunityIndex() {
  const { supabase, user } = await requireUser();
  const { data: mine } = await supabase.from('community_members').select('communities(slug,name)').eq('user_id', user.id).eq('status', 'active');
  const list = (mine ?? []).map((m: any) => m.communities).filter(Boolean);
  if (list.length === 1) redirect(`/community/${list[0].slug}`);
  const { data: all } = await supabase.from('communities').select('slug,name,description').order('name');
  return (
    <div>
      <h1 className="font-display text-3xl font-semibold">Community</h1>
      <p className="text-plum-500">{list.length ? 'Your communities' : 'Join a community to find your Circle.'}</p>
      <ul className="mt-5 space-y-3">
        {(list.length ? list : (all ?? [])).map((c: any) => (
          <li key={c.slug}><Link href={`/community/${c.slug}`} className="block rounded-card bg-white p-4 ring-1 ring-pink-100 hover:ring-pink-300"><b className="font-display text-lg">{c.name}</b></Link></li>
        ))}
      </ul>
    </div>
  );
}
