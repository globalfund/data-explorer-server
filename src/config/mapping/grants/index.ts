import {alt, value} from 'map-transform'

export const grantsMap = [
  "response.docs[]",
  {
    "id": "GrantAgreementNumber[0]",
    "title": ["GrantAgreementTitle[0]", alt(value(""))],
    "status": ["GrantAgreementStatusTypeName[0]", alt(value(""))],
    "component": ["ComponentName[0]", alt(value(""))],
    "geoLocation": ["GeographicAreaCode_ISO3[0]", alt(value(""))],
    "rating": ["PerformanceRatingCode[0]", alt(value(null))],
    "disbursed": ["TotalDisbursedAmount[0]", alt(value(0))],
    "committed": ["TotalCommittedAmount[0]", alt(value(0))],
    "signed": ["TotalSignedAmount[0]", alt(value(0))],
  }
]
