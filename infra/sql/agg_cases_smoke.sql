-- ServeSA Pilot: Anonymized Case Aggregates for /explore
-- Returns anonymized counts by municipality/ward for the last 24 hours

SELECT
  municipality_id,
  municipality_name,
  ward_id,
  ward_name,
  COUNT(*) as total_cases,
  COUNTIF(TIMESTAMP_DIFF(CURRENT_TIMESTAMP(), created_at, HOUR) <= 24) as cases_last_24h,
  COUNTIF(sla_breached = true) as breached_cases,
  COUNTIF(status = 'resolved') as resolved_cases,
  AVG(TIMESTAMP_DIFF(resolved_at, created_at, HOUR)) as avg_resolution_hours,
  MAX(created_at) as latest_case
FROM `servesa-aad53.geo.case_analytics`
WHERE created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
GROUP BY municipality_id, municipality_name, ward_id, ward_name
ORDER BY cases_last_24h DESC, total_cases DESC
LIMIT 100;
