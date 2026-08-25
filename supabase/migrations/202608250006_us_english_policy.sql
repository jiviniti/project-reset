insert into private.policy_versions (version, acknowledgement_text, status, published_at)
values (
  'reset_data_use_v1_us',
  'I understand that my responses will be stored for Project RESET research and may contribute to anonymized or aggregated findings.',
  'published',
  now()
)
on conflict (version) do update
set acknowledgement_text = excluded.acknowledgement_text,
    status = excluded.status,
    published_at = coalesce(private.policy_versions.published_at, excluded.published_at);
