-- Run only after creating the private bucket named private-sources.
create policy "owner upload course source" on storage.objects for insert to authenticated with check(bucket_id='private-sources' and (storage.foldername(name))[1]=auth.uid()::text and exists(select 1 from public.courses c where c.id::text=(storage.foldername(name))[2] and c.owner_id=auth.uid()));
create policy "owner read private source" on storage.objects for select to authenticated using(bucket_id='private-sources' and (storage.foldername(name))[1]=auth.uid()::text);
-- No client delete policy: deletion must occur in privileged verified-cleanup worker only.
