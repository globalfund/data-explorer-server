import {alt, value} from 'map-transform'

export const grantsMap = [
  "response.docs[]",
  {
    "id": "iati_identifier",
    "title": ["title_narrative_first", alt(value(""))],
    "status": ["activity_status_code", alt(value(""))],
    "component": ["sector_code[0]", alt(value("null"))],
    "geoLocation": ["recipient_country_code[0]", alt(value(""))],
    "rating": ["result_reference_code[0]", alt(value(null))],
    "disbursed": ["activity_plus_child_aggregation_disbursement_value_usd", alt(value(0))],
    "committed": ["activity_plus_child_aggregation_commitment_value_usd", alt(value(0))],
    "signed": ["activity_plus_child_aggregation_commitment_value_usd", alt(value(0))],
  }
]
