-- User-approved Signature Collection launch price, 15 September 2026.
-- Only the former base price changes; tax, commissions and existing orders remain intact.
INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, before_json, after_json, reason)
SELECT 'signature-price-20260915', NULL, 'settings.update', 'app_settings', 'commerce',
       value_json, json_set(value_json, '$.basePriceCents', 249900),
       'Owner requested a new price for the redesigned Signature Collection: INR 2499.'
FROM app_settings
WHERE key = 'commerce' AND json_extract(value_json, '$.basePriceCents') = 149900;

UPDATE app_settings
SET value_json = json_set(value_json, '$.basePriceCents', 249900), updated_at = CURRENT_TIMESTAMP
WHERE key = 'commerce' AND json_extract(value_json, '$.basePriceCents') = 149900;
