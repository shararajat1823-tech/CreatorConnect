-- ===========================================================================
-- CreatorConnect — FICTIONAL SEED DATA (local development only)
-- ---------------------------------------------------------------------------
-- Everything below is invented for demos. Do NOT run against production.
-- All demo accounts use the password:  password123
--
-- Demo accounts:
--   admin@creatorconnect.example  — admin (use in the admin app)
--   brand@acme.example            — a visitor/brand that sends briefs
--   maya@creators.example .. etc  — creators
-- ===========================================================================

-- Helper that creates a confirmed email user + identity, returns the uid.
create or replace function pg_temp.make_user(p_email text, p_name text)
returns uuid
language plpgsql
as $$
declare uid uuid := gen_random_uuid();
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', p_email,
    crypt('password123', gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    json_build_object('display_name', p_name)::jsonb, now(), now(),
    '', '', '', ''
  );
  insert into auth.identities (
    provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) values (
    uid::text, uid,
    json_build_object('sub', uid::text, 'email', p_email)::jsonb,
    'email', now(), now(), now()
  );
  return uid;
end;
$$;

do $$
declare
  admin_id uuid; brand_id uuid;
  u_maya uuid; u_leo uuid; u_aisha uuid; u_diego uuid; u_hana uuid; u_sam uuid; u_priya uuid; u_tom uuid;
  c_maya uuid; c_leo uuid; c_aisha uuid; c_diego uuid; c_hana uuid; c_sam uuid; c_priya uuid; c_tom uuid;
  r1 uuid; r2 uuid; r3 uuid;
begin
  -- ---- accounts ----
  admin_id := pg_temp.make_user('admin@creatorconnect.example', 'CreatorConnect Admin');
  insert into public.admins (user_id, created_by) values (admin_id, admin_id);

  brand_id := pg_temp.make_user('brand@acme.example', 'Acme Outdoors');
  u_maya  := pg_temp.make_user('maya@creators.example',  'Maya Rivers');
  u_leo   := pg_temp.make_user('leo@creators.example',   'Leo Tanaka');
  u_aisha := pg_temp.make_user('aisha@creators.example', 'Aisha Khan');
  u_diego := pg_temp.make_user('diego@creators.example', 'Diego Santos');
  u_hana  := pg_temp.make_user('hana@creators.example',  'Hana Park');
  u_sam   := pg_temp.make_user('sam@creators.example',   'Sam Carter');
  u_priya := pg_temp.make_user('priya@creators.example', 'Priya Nair');
  u_tom   := pg_temp.make_user('tom@creators.example',   'Tom Becker');

  -- ---- creators (working records) ----
  insert into public.creators (owner_id, status, channel_name, youtube_url, avatar_path, bio,
      niches, languages, country, subscriber_count, formats, videos, pricing, ownership_verified,
      published_at, submitted_at)
  values (u_maya, 'published', 'Maya Rivers', 'https://www.youtube.com/@mayarivers',
      'https://i.pravatar.cc/320?img=47',
      'Clean beauty, honest reviews and everyday lifestyle. I partner with brands I actually use.',
      array['beauty','lifestyle'], array['en'], 'US', 185000,
      array['sponsored_mention','dedicated_video','shorts'],
      '[{"video_id":"aqz-KE-bpKQ","title":"My 10-minute morning routine"},{"video_id":"J---aiyznGQ","title":"Testing viral skincare"}]'::jsonb,
      '[{"format":"dedicated_video","price_min":1200,"price_max":2500,"currency":"USD"},{"format":"sponsored_mention","price_min":400,"price_max":700,"currency":"USD"}]'::jsonb,
      true, now(), now())
  returning id into c_maya;

  insert into public.creators (owner_id, status, channel_name, youtube_url, avatar_path, bio,
      niches, languages, country, subscriber_count, formats, videos, pricing, ownership_verified,
      published_at, submitted_at)
  values (u_leo, 'published', 'Leo Builds Tech', 'https://www.youtube.com/@leobuildstech',
      'https://i.pravatar.cc/320?img=12',
      'In-depth gadget reviews and build guides. Bilingual channel (EN/JA).',
      array['tech'], array['en','ja'], 'JP', 92000,
      array['product_review','dedicated_video'],
      '[{"video_id":"ScMzIvxBSi4","title":"Best budget laptops 2026"}]'::jsonb,
      null, false, now(), now())
  returning id into c_leo;

  insert into public.creators (owner_id, status, channel_name, youtube_url, avatar_path, bio,
      niches, languages, country, subscriber_count, formats, videos, pricing, ownership_verified,
      published_at, submitted_at)
  values (u_aisha, 'published', 'Learn with Aisha', 'https://www.youtube.com/@learnwithaisha',
      'https://i.pravatar.cc/320?img=45',
      'Approachable science and study tips for students. Big, engaged community across India.',
      array['education'], array['en','hi'], 'IN', 1200000,
      array['dedicated_video','guest_appearance'],
      '[{"video_id":"oHg5SJYRHA0","title":"Physics made simple"}]'::jsonb,
      null, true, now(), now())
  returning id into c_aisha;

  insert into public.creators (owner_id, status, channel_name, youtube_url, avatar_path, bio,
      niches, languages, country, subscriber_count, formats, videos, pricing, ownership_verified,
      published_at, submitted_at)
  values (u_diego, 'published', 'Diego Plays', 'https://www.youtube.com/@diegoplays',
      'https://i.pravatar.cc/320?img=15',
      'High-energy gaming, let''s plays and community tournaments. Portuguese & Spanish.',
      array['gaming'], array['es','pt'], 'BR', 540000,
      array['sponsored_mention','shorts','joint_video'],
      '[{"video_id":"kJQP7kiw5Fk","title":"Tournament highlights"}]'::jsonb,
      '[{"format":"joint_video","note":"Open to joint videos with other gaming channels","currency":"USD"}]'::jsonb,
      false, now(), now())
  returning id into c_diego;

  insert into public.creators (owner_id, status, channel_name, youtube_url, avatar_path, bio,
      niches, languages, country, subscriber_count, formats, videos, pricing, ownership_verified,
      published_at, submitted_at)
  values (u_hana, 'published', 'Hana''s Kitchen', 'https://www.youtube.com/@hanaskitchen',
      'https://i.pravatar.cc/320?img=32',
      'Weeknight Korean recipes you can actually make. Short, friendly, and tested.',
      array['food'], array['ko','en'], 'KR', 45000,
      array['dedicated_video','shorts'],
      '[{"video_id":"9bZkp7q19f0","title":"15-minute kimchi fried rice"}]'::jsonb,
      null, false, now(), now())
  returning id into c_hana;

  insert into public.creators (owner_id, status, channel_name, youtube_url, avatar_path, bio,
      niches, languages, country, subscriber_count, formats, videos, pricing, ownership_verified,
      published_at, submitted_at)
  values (u_sam, 'published', 'Sam Moves', 'https://www.youtube.com/@sammoves',
      'https://i.pravatar.cc/320?img=59',
      'No-equipment home workouts and realistic fitness advice. Growing fast!',
      array['fitness'], array['en'], 'GB', 8200,
      array['shorts','sponsored_mention'],
      '[{"video_id":"3JZ_D3ELwOQ","title":"10-minute morning mobility"}]'::jsonb,
      null, false, now(), now())
  returning id into c_sam;

  -- Under review (NOT public) — exercises the moderation queue.
  insert into public.creators (owner_id, status, channel_name, youtube_url, avatar_path, bio,
      niches, languages, country, subscriber_count, formats, videos, ownership_verified, submitted_at)
  values (u_priya, 'under_review', 'Money with Priya', 'https://www.youtube.com/@moneywithpriya',
      'https://i.pravatar.cc/320?img=20',
      'Personal finance for young professionals. Budgets, investing basics, no jargon.',
      array['finance'], array['en','hi'], 'IN', 310000,
      array['dedicated_video','sponsored_mention'],
      '[{"video_id":"2Vv-BfVoq4g","title":"How I budget on a starter salary"}]'::jsonb,
      false, now())
  returning id into c_priya;

  -- Suspended (NOT public) — exercises suspension / reinstatement.
  insert into public.creators (owner_id, status, channel_name, youtube_url, avatar_path, bio,
      niches, languages, country, subscriber_count, formats, videos, ownership_verified, review_note)
  values (u_tom, 'suspended', 'Tom''s Comedy Hour', 'https://www.youtube.com/@tomscomedyhour',
      'https://i.pravatar.cc/320?img=8',
      'Sketches and stand-up clips.',
      array['comedy'], array['en'], 'US', 75000,
      array['sponsored_mention'],
      '[]'::jsonb, false, 'Suspended during a review of reported content.')
  returning id into c_tom;

  -- ---- publish the approved creators into the public projection ----
  perform public.sync_public_creator(c_maya);
  perform public.sync_public_creator(c_leo);
  perform public.sync_public_creator(c_aisha);
  perform public.sync_public_creator(c_diego);
  perform public.sync_public_creator(c_hana);
  perform public.sync_public_creator(c_sam);

  insert into public.moderation_actions (creator_id, actor_id, action, reason) values
    (c_maya, admin_id, 'approved', null),
    (c_leo, admin_id, 'approved', null),
    (c_aisha, admin_id, 'approved', null),
    (c_diego, admin_id, 'approved', null),
    (c_hana, admin_id, 'approved', null),
    (c_sam, admin_id, 'approved', null),
    (c_tom, admin_id, 'suspended', 'Suspended during a review of reported content.');

  -- ---- sample requests + threads ----
  -- 1) Brand -> Maya, paid sponsorship, accepted, with a reply thread.
  insert into public.requests (creator_id, sender_id, recipient_id, request_type, status,
      sender_name, title, deliverables, timeline, budget_min, budget_max, currency,
      budget_negotiable, client_token)
  values (c_maya, brand_id, u_maya, 'paid_sponsorship', 'accepted',
      'Acme Outdoors', 'Spring skincare launch — dedicated video',
      'One dedicated 8–10 min video + 1 Shorts teaser', 'Mid-April, 3 week lead time',
      1500, 2500, 'USD', false, 'seed-token-1')
  returning id into r1;
  insert into public.messages (request_id, sender_id, body, created_at) values
    (r1, brand_id, 'Hi Maya! We love your honest reviews. We''d like a dedicated video for our new SPF line. Budget is flexible in the $1.5–2.5k range. Interested?', now() - interval '3 days'),
    (r1, u_maya, 'Thanks for reaching out! I''d love to — SPF is a great fit for my audience. I can slot this for mid-April. Sending a short proposal shortly.', now() - interval '2 days');

  -- 2) Brand -> Leo, paid sponsorship, pending (awaiting reply).
  insert into public.requests (creator_id, sender_id, recipient_id, request_type, status,
      sender_name, title, deliverables, timeline, budget_negotiable, client_token)
  values (c_leo, brand_id, u_leo, 'paid_sponsorship', 'pending',
      'Acme Outdoors', 'Rugged power bank review',
      'Honest review segment in an upcoming gadget video', 'Flexible', true, 'seed-token-2')
  returning id into r2;
  insert into public.messages (request_id, sender_id, body, created_at) values
    (r2, brand_id, 'Hi Leo — would you be open to reviewing our new rugged power bank? Budget negotiable. Happy to send a sample.', now() - interval '1 day');

  -- 3) Creator -> Creator collaboration: Maya -> Diego (shows a creator initiating).
  insert into public.requests (creator_id, sender_id, recipient_id, request_type, status,
      sender_name, title, deliverables, timeline, budget_negotiable, client_token)
  values (c_diego, u_maya, u_diego, 'creator_collaboration', 'pending',
      'Maya Rivers', 'Joint "get ready with us" gaming + lifestyle crossover',
      'Each of us films a half of a shared video and cross-posts', 'Next month', false, 'seed-token-3')
  returning id into r3;
  insert into public.messages (request_id, sender_id, body) values
    (r3, u_maya, 'Hey Diego! Our audiences overlap more than you''d think. Want to do a crossover video — lifestyle meets gaming? I''ll contribute the lifestyle half.');
end;
$$;

drop function if exists pg_temp.make_user(text, text);

-- Report queue sample: Acme flags the suspended-review process is handled; add
-- one open report against a published creator so the admin reports queue isn't empty.
insert into public.reports (creator_id, reporter_id, reason, details, status)
select pc.creator_id,
       (select id from auth.users where email = 'brand@acme.example'),
       'misleading',
       'Subscriber count looks higher than their recent videos suggest — worth a quick check.',
       'open'
from public.public_creators pc
join public.creators c on c.id = pc.creator_id
where c.channel_name = 'Sam Moves'
limit 1;
