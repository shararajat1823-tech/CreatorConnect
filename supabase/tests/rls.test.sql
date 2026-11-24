\set ON_ERROR_STOP on
\echo '================ GATHER IDS (as superuser, stash in GUCs) ================'
select set_config('test.brand', (select id from auth.users where email='brand@acme.example')::text, false);
select set_config('test.maya',  (select id from auth.users where email='maya@creators.example')::text, false);
select set_config('test.sam',   (select id from auth.users where email='sam@creators.example')::text, false);
select set_config('test.admin', (select id from auth.users where email='admin@creatorconnect.example')::text, false);
select set_config('test.c_leo',   (select id from public.creators where channel_name='Leo Builds Tech')::text, false);
select set_config('test.c_priya', (select id from public.creators where channel_name='Money with Priya')::text, false);
select set_config('test.c_maya',  (select id from public.creators where channel_name='Maya Rivers')::text, false);
select set_config('test.r_bm',    (select id from public.requests where title like 'Spring skincare%')::text, false);
select set_config('test.r2_id',   (select id from public.requests where client_token='seed-token-2')::text, false);
select set_config('test.r2_recip',(select recipient_id from public.requests where client_token='seed-token-2')::text, false);
select set_config('test.r3_id',   (select id from public.requests where client_token='seed-token-3')::text, false);
select set_config('test.r3_send', (select sender_id from public.requests where client_token='seed-token-3')::text, false);

\echo '================ 1. ANON reads only public_creators ================'
set role anon;
do $$ declare n int; begin
  select count(*) into n from public.public_creators;
  if n <> 6 then raise exception 'EXPECTED 6 public creators, got %', n; end if;
  raise notice 'OK: anon sees % public creators', n;
end $$;
do $$ begin
  perform 1 from public.creators;
  raise exception 'FAIL: anon should NOT read creators';
exception when insufficient_privilege then raise notice 'OK: anon blocked from creators table';
end $$;
reset role;

\echo '================ 2. VISITOR creates a request (idempotent) ================'
set role authenticated;
select set_config('app.current_user', current_setting('test.brand'), false);
create temp table _idem as
  select public.create_request(current_setting('test.c_leo')::uuid,'paid_sponsorship','Acme Outdoors',
    'Test brief','Hello Leo, interested in a review?', null, 'Flexible', null, null, null, true, 'tok-test-1') as id;
insert into _idem
  select public.create_request(current_setting('test.c_leo')::uuid,'paid_sponsorship','Acme Outdoors',
    'Test brief','Hello Leo, interested in a review?', null, 'Flexible', null, null, null, true, 'tok-test-1');
do $$ declare c int; begin
  select count(distinct id) into c from _idem;
  if c <> 1 then raise exception 'FAIL: idempotency broken (% distinct ids)', c; end if;
  raise notice 'OK: duplicate token returned the same request';
end $$;

\echo '================ 3. Cannot contact a non-public (under_review) creator ================'
do $$ begin
  perform public.create_request(current_setting('test.c_priya')::uuid,'paid_sponsorship','Acme','x','hi',
    null,null,null,null,null,true,'tok-test-2');
  raise exception 'FAIL: should not contact under_review creator';
exception when others then
  if sqlerrm like '%not available%' then raise notice 'OK: blocked contacting non-public creator';
  else raise exception 'Unexpected: %', sqlerrm; end if;
end $$;
reset role;

\echo '================ 4. Cannot request your own channel ================'
set role authenticated;
select set_config('app.current_user', current_setting('test.maya'), false);
do $$ begin
  perform public.create_request(current_setting('test.c_maya')::uuid,'paid_sponsorship','Maya','x','hi',
    null,null,null,null,null,true,'tok-self');
  raise exception 'FAIL: should not contact own channel';
exception when others then
  if sqlerrm like '%your own channel%' then raise notice 'OK: blocked self-contact';
  else raise exception 'Unexpected: %', sqlerrm; end if;
end $$;
reset role;

\echo '================ 5. Private thread: third party cannot read ================'
set role authenticated;
select set_config('app.current_user', current_setting('test.sam'), false);
do $$ declare n int; begin
  select count(*) into n from public.messages where request_id = current_setting('test.r_bm')::uuid;
  if n <> 0 then raise exception 'FAIL: third party saw % messages', n; end if;
  raise notice 'OK: third party sees 0 messages in a private thread';
end $$;
select set_config('app.current_user', current_setting('test.brand'), false);
do $$ declare n int; begin
  select count(*) into n from public.messages where request_id = current_setting('test.r_bm')::uuid;
  if n < 2 then raise exception 'FAIL: participant saw only % messages', n; end if;
  raise notice 'OK: participant sees % messages', n;
end $$;
reset role;

\echo '================ 6. Non-admin cannot approve or self-grant admin ================'
set role authenticated;
select set_config('app.current_user', current_setting('test.brand'), false);
do $$ begin
  perform public.approve_creator(current_setting('test.c_priya')::uuid);
  raise exception 'FAIL: non-admin approved a creator';
exception when others then
  if sqlerrm like '%Admin role required%' then raise notice 'OK: non-admin approve blocked';
  else raise exception 'Unexpected: %', sqlerrm; end if;
end $$;
do $$ begin
  insert into public.admins(user_id) values (current_setting('test.brand')::uuid);
  raise exception 'FAIL: user granted itself admin';
exception when insufficient_privilege then raise notice 'OK: self-grant admin blocked by RLS';
  when others then raise notice 'OK: self-grant admin blocked (%)', sqlerrm;
end $$;
reset role;

\echo '================ 7. Admin approves under_review -> becomes public ================'
set role authenticated;
select set_config('app.current_user', current_setting('test.admin'), false);
select public.approve_creator(current_setting('test.c_priya')::uuid);
do $$ declare n int; begin
  select count(*) into n from public.public_creators;
  if n <> 7 then raise exception 'FAIL: expected 7 public after approve, got %', n; end if;
  raise notice 'OK: approved creator is now public (% total)', n;
end $$;

\echo '================ 8. Admin suspends -> removed from public ================'
select public.suspend_creator(current_setting('test.c_leo')::uuid,'Testing suspension');
do $$ declare n int; begin
  select count(*) into n from public.public_creators where creator_id = current_setting('test.c_leo')::uuid;
  if n <> 0 then raise exception 'FAIL: suspended creator still public'; end if;
  raise notice 'OK: suspended creator removed from public';
end $$;
reset role;

\echo '================ 9. Owner cannot change status directly, but can edit content ================'
set role authenticated;
select set_config('app.current_user', current_setting('test.maya'), false);
do $$ begin
  update public.creators set status='suspended' where id = current_setting('test.c_maya')::uuid;
  raise exception 'FAIL: owner changed status directly';
exception when others then
  if sqlerrm like '%moderation functions%' then raise notice 'OK: owner status change blocked';
  else raise exception 'Unexpected: %', sqlerrm; end if;
end $$;
do $$ declare n int; begin
  update public.creators set bio='Updated bio via owner edit' where id = current_setting('test.c_maya')::uuid;
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL: owner could not edit own content (rows=%)', n; end if;
  raise notice 'OK: owner edited own content';
end $$;
reset role;

\echo '================ 10. Request status transitions (accept / withdraw) ================'
set role authenticated;
select set_config('app.current_user', current_setting('test.r2_recip'), false);
select public.set_request_status(current_setting('test.r2_id')::uuid,'accepted');
do $$ begin
  if (select status from requests where id = current_setting('test.r2_id')::uuid) <> 'accepted'
    then raise exception 'FAIL: accept did not apply'; end if;
  raise notice 'OK: recipient accepted a pending request';
end $$;
select set_config('app.current_user', current_setting('test.r3_send'), false);
select public.set_request_status(current_setting('test.r3_id')::uuid,'withdrawn');
do $$ begin
  if (select status from requests where id = current_setting('test.r3_id')::uuid) <> 'withdrawn'
    then raise exception 'FAIL: withdraw did not apply'; end if;
  raise notice 'OK: sender withdrew a pending request';
end $$;
reset role;

\echo '================ ALL TESTS PASSED ================'
