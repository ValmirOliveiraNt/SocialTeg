ALTER TABLE businesses ADD COLUMN default_destination_type TEXT NOT NULL DEFAULT 'google_review';
ALTER TABLE businesses ADD COLUMN default_target_url TEXT;
ALTER TABLE businesses ADD COLUMN default_destination_configuration TEXT NOT NULL DEFAULT '{}';
ALTER TABLE nfc_tags ADD COLUMN configuration_mode TEXT NOT NULL DEFAULT 'business';

UPDATE businesses
SET default_destination_type = COALESCE((
      SELECT d.type FROM tag_destinations d
      JOIN nfc_tags t ON t.id = d.tag_id
      WHERE t.business_id = businesses.id AND d.is_active = 1
      ORDER BY datetime(d.updated_at) DESC LIMIT 1
    ), 'google_review'),
    default_target_url = (
      SELECT d.target_url FROM tag_destinations d
      JOIN nfc_tags t ON t.id = d.tag_id
      WHERE t.business_id = businesses.id AND d.is_active = 1
      ORDER BY datetime(d.updated_at) DESC LIMIT 1
    ),
    default_destination_configuration = COALESCE((
      SELECT d.configuration FROM tag_destinations d
      JOIN nfc_tags t ON t.id = d.tag_id
      WHERE t.business_id = businesses.id AND d.is_active = 1
      ORDER BY datetime(d.updated_at) DESC LIMIT 1
    ), '{}');

UPDATE nfc_tags
SET configuration_mode = 'custom'
WHERE business_id IS NULL
   OR EXISTS (
     SELECT 1 FROM tag_destinations d
     JOIN businesses b ON b.id = nfc_tags.business_id
     WHERE d.tag_id = nfc_tags.id
       AND d.is_active = 1
       AND (
         COALESCE(d.type, '') <> COALESCE(b.default_destination_type, '')
         OR COALESCE(d.target_url, '') <> COALESCE(b.default_target_url, '')
         OR COALESCE(d.configuration, '{}') <> COALESCE(b.default_destination_configuration, '{}')
       )
   );
