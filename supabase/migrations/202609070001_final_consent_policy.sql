-- Lock the Foundation-approved launch consent before real participant collection begins.
-- Existing records are internal pre-launch tests, so the current U.S. policy may be corrected in place.
begin;

update private.policy_versions
set acknowledgement_text = 'I understand that my responses will be securely stored and may be used for Project RESET research. Anything shared publicly will be de-identified or combined with other responses.',
    status = 'published'
where version = 'reset_data_use_v1_us';

do $policy_check$
begin
  if not exists (
    select 1 from private.policy_versions where version = 'reset_data_use_v1_us'
  ) then
    raise exception 'Existing reset_data_use_v1_us policy is required';
  end if;
end
$policy_check$;

commit;
