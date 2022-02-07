# Mapping

Mapping config files are used in order to make the data middleware API re-usable with different data source APIs and without the need of changing the core of the codebase.

The data middleware API consists of many endpoints that are defined and implemented in the controller source files. The endpoints are grouped in controllers based on the datasets coming from the datasource API ([The Global Fund | Data Service](https://data-service.theglobalfund.org/api)).

The endpoints are defined in the controller source files like the following example:
`@get('/grants')`

- `get`: HTTP method type
- `'/grants'`: the endpoint route, in this case it can be accessed through `http://localhost:4200/grants`

Each endpoint is implemented using 4 source files

- <b>Controller</b>: core logic of the endpoint
- <b>Mapping</b>: a JSON file defining the needed data fields and their corresponding field from the datasource API
- <b>Utils mapping</b>: a JSON file defining util functionalities and how they are associated with the corresponding ones from the datasource API
- <b>Filters mapping</b>: a JSON file defining the filter fields and their corresponding field from the datasource API

[Generic datasource API filter/sort/paginate syntax mapping](./filtering/index.json)
For example page size parameter key:

- In ODATA API syntax: `"page_size": "$top"`
- In Django API syntax: `"page_size": "page_size"`
- In Solr API syntax: `"page_size": "rows"`

Data source API endpoint keys can be found in [here](./urls/index.json)

<details>
  <summary>Grants & Grant detail</summary>

## Grants list

`@get('/grants')`

Data source API endpoint key: `grants`\
[Controller](../controllers/grants.controller.ts)\
[Mapping](./mapping/grants/index.ts)\
[Utils mapping](./mapping/grants/utils.json)\
[Filters mapping](./filtering/grants.json)

## Grant detail

`@get('/grant/detail')`

Data source API endpoint key: `grantsNoCount`\
[Controller](../controllers/grants.controller.ts)\
[Mapping](./mapping/grants/grantDetail.json)\
[Utils mapping](./mapping/grants/grantDetail.utils.json)

## Grant detail periods

`@get('/grant/periods')`

Data source API endpoint key: `grantPeriods`\
[Controller](../controllers/grants.controller.ts)\
[Mapping](./mapping/grants/grantPeriods.json)\
[Utils mapping](./mapping/grants/grantDetail.utils.json)

## Grant detail period info

`@get('/grant/period/info')`

Data source API endpoint key: `grantPeriods`, `performancerating`\
[Controller](../controllers/grants.controller.ts)\
[Mapping](./mapping/grants/grantPeriodInfo.json)\
[Utils mapping](./mapping/grants/grantDetail.utils.json)

## Grants radial visualisation

`@get('/grants/radial')`

Data source API endpoint key: `grantsNoCount`, `vgrantPeriods`, `performancerating`\
[Controller](../controllers/grants.controller.ts)\
[Mapping](./mapping/grants/grantsRadial.json)\
[Filters mapping 1](./filtering/grants.json)\
[Filters mapping 2](./filtering/performancerating.json)

</details>

<details>
  <summary>Allocations</summary>

## Allocations radial visualisation

`@get('/allocations')`

Data source API endpoint key: `allocations`\
[Controller](../controllers/allocations.controller.ts)\
[Mapping](./mapping/allocations/index.json)\
[Filters mapping](./filtering/allocations.json)

## Allocations periods

`@get('/allocations/periods')`

Data source API endpoint key: `allocations`\
[Controller](../controllers/allocations.controller.ts)\
[Mapping](./mapping/allocations/periods.json)\
[Filters mapping](./filtering/allocations.json)

## Allocations radial visualisation drilldown treemap

`@get('/allocations/drilldown')`

Data source API endpoint key: `allocations`\
[Controller](../controllers/allocations.controller.ts)\
[Mapping](./mapping/allocations/drilldown.json)\
[Filters mapping](./filtering/allocations.json)

## Allocations geomap

`@get('/allocations/geomap')`

Data source API endpoint key: `allocations`, `geojson`\
[Controller](../controllers/allocations.controller.ts)\
[Mapping](./mapping/allocations/geomap.json)\
[Filters mapping](./filtering/allocations.json)

## Allocations geomap multicountries

`@get('/allocations/geomap/multicountries')`

Data source API endpoint key: `allocations`, `multicountriescountriesdata`\
[Controller](../controllers/allocations.controller.ts)\
[Mapping](./mapping/allocations/geomap.json)\
[Filters mapping](./filtering/allocations.json)

</details>

<details>
  <summary>Budgets</summary>

## Budgets flow visualisation

`@get('/budgets/flow')`

Data source API endpoint key: `budgets`\
[Controller](../controllers/budgets.controller.ts)\
[Mapping](./mapping/budgets/flow.json)\
[Filters mapping](./filtering/budgets.json)

## Budgets time/cycle visualisation

`@get('/budgets/time-cycle')`

Data source API endpoint key: `budgets`\
[Controller](../controllers/budgets.controller.ts)\
[Mapping](./mapping/budgets/timeCycle.json)\
[Filters mapping](./filtering/budgets.json)

## Budgets drilldown level 1 treemap

`@get('/budgets/drilldown')`

Data source API endpoint key: `budgets`\
[Controller](../controllers/budgets.controller.ts)\
[Mapping](./mapping/budgets/flowDrilldown.json)\
[Filters mapping](./filtering/budgets.json)

## Budgets drilldown level 2 treemap

`@get('/budgets/drilldown/2')`

Data source API endpoint key: `budgets`\
[Controller](../controllers/budgets.controller.ts)\
[Mapping](./mapping/budgets/flowDrilldown.json)\
[Filters mapping](./filtering/budgets.json)

## Budgets geomap

`@get('/budgets/geomap')`

Data source API endpoint key: `budgets`, `geojson`\
[Controller](../controllers/budgets.controller.ts)\
[Mapping](./mapping/budgets/geomap.json)\
[Filters mapping](./filtering/budgets.json)

## Budgets geomap multicountries

`@get('/budgets/geomap/multicountries')`

Data source API endpoint key: `budgets`, `multicountriescountriesdata`\
[Controller](../controllers/budgets.controller.ts)\
[Mapping](./mapping/budgets/geomap.json)\
[Filters mapping](./filtering/budgets.json)

</details>

<details>
  <summary>Disbursements/Signed/Commitment</summary>

## Disbursements time/cycle visualisation

`@get('/disbursements/time-cycle')`

Data source API endpoint key: `disbursements`\
[Controller](../controllers/disbursements.controller.ts)\
[Mapping](./mapping/disbursements/timeCycle.json)\
[Filters mapping](./filtering/grants.json)

## Signed time/cycle visualisation

`@get('/signed/time-cycle')`

Data source API endpoint key: `vgrantPeriods`\
[Controller](../controllers/disbursements.controller.ts)\
[Mapping](./mapping/disbursements/timeCycle.json)\
[Filters mapping](./filtering/grants.json)

## Commitment time/cycle visualisation

`@get('/commitment/time-cycle')`

Data source API endpoint key: `vcommitments`\
[Controller](../controllers/disbursements.controller.ts)\
[Mapping](./mapping/disbursements/timeCycle.json)\
[Filters mapping](./filtering/grants.json)

## Disbursements time/cycle drilldown treemap

`@get('/disbursements/time-cycle/drilldown')`

Data source API endpoint key: `disbursements`\
[Controller](../controllers/disbursements.controller.ts)\
[Mapping](./mapping/disbursements/timeCycleDrilldown.json)\
[Filters mapping](./filtering/grants.json)

## Signed time/cycle drilldown treemap

`@get('/signed/time-cycle/drilldown')`

Data source API endpoint key: `vgrantPeriods`\
[Controller](../controllers/disbursements.controller.ts)\
[Mapping](./mapping/disbursements/timeCycleDrilldown.json)\
[Filters mapping](./filtering/grants.json)

## Commitment time/cycle drilldown treemap

`@get('/commitment/time-cycle/drilldown')`

Data source API endpoint key: `vcommitments`\
[Controller](../controllers/disbursements.controller.ts)\
[Mapping](./mapping/disbursements/timeCycleDrilldown.json)\
[Filters mapping](./filtering/grants.json)

## Disbursements treemap visualisation

`@get('/disbursements/treemap')`

Data source API endpoint key: `grantsNoCount`\
[Controller](../controllers/disbursements.controller.ts)\
[Mapping](./mapping/disbursements/treemap.json)\
[Filters mapping](./filtering/grants.json)

## Signed treemap visualisation

`@get('/signed/treemap')`

Data source API endpoint key: `grantsNoCount`\
[Controller](../controllers/disbursements.controller.ts)\
[Mapping](./mapping/disbursements/treemap.json)\
[Filters mapping](./filtering/grants.json)

## Commitment treemap visualisation

`@get('/commitment/treemap')`

Data source API endpoint key: `grantsNoCount`\
[Controller](../controllers/disbursements.controller.ts)\
[Mapping](./mapping/disbursements/treemap.json)\
[Filters mapping](./filtering/grants.json)

## Disbursements treemap drilldown visualisation

`@get('/disbursements/treemap')`

Data source API endpoint key: `grantsNoCount`\
[Controller](../controllers/disbursements.controller.ts)\
[Mapping](./mapping/disbursements/treemap.json)\
[Filters mapping](./filtering/grants.json)

## Signed treemap drilldown visualisation

`@get('/signed/treemap')`

Data source API endpoint key: `grantsNoCount`\
[Controller](../controllers/disbursements.controller.ts)\
[Mapping](./mapping/disbursements/treemap.json)\
[Filters mapping](./filtering/grants.json)

## Commitment treemap drilldown visualisation

`@get('/commitment/treemap')`

Data source API endpoint key: `grantsNoCount`\
[Controller](../controllers/disbursements.controller.ts)\
[Mapping](./mapping/disbursements/treemap.json)\
[Filters mapping](./filtering/grants.json)

## Disbursements geomap

`@get('/disbursements/geomap')`

Data source API endpoint key: `grantsNoCount`, `geojson`\
[Controller](../controllers/disbursements.controller.ts)\
[Mapping](./mapping/disbursements/geomap.json)\
[Filters mapping](./filtering/grants.json)

## Disbursements geomap multicountries

`@get('/disbursements/geomap/multicountries')`

Data source API endpoint key: `grantPeriods`, `multicountriescountriesdata`\
[Controller](../controllers/disbursements.controller.ts)\
[Mapping](./mapping/disbursements/geomap.json)\
[Filters mapping](./filtering/multicountries.json)

## Location detail Disbursements treemap visualisation

`@get('/location/disbursements/treemap')`

Data source API endpoint key: `grantsNoCount`\
[Controller](../controllers/disbursements.controller.ts)\
[Mapping](./mapping/disbursements/treemap.json)\
[Filters mapping](./filtering/grants.json)

## Location detail Signed treemap visualisation

`@get('/location/signed/treemap')`

Data source API endpoint key: `grantsNoCount`\
[Controller](../controllers/disbursements.controller.ts)\
[Mapping](./mapping/disbursements/treemap.json)\
[Filters mapping](./filtering/grants.json)

## Location detail Commitment treemap visualisation

`@get('/location/commitment/treemap')`

Data source API endpoint key: `grantsNoCount`\
[Controller](../controllers/disbursements.controller.ts)\
[Mapping](./mapping/disbursements/treemap.json)\
[Filters mapping](./filtering/grants.json)

## Grant detail Disbursements time/cycle visualisation

`@get('/grant/disbursements/time-cycle')`

Data source API endpoint key: `grantDetailDisbursements`\
[Controller](../controllers/disbursements.controller.ts)\
[Mapping](./mapping/disbursements/grantDetailTimeCycle.json)\
[Filters mapping](./filtering/grantDetailDisbursements.json)

## Grant detail Commitment time/cycle visualisation

`@get('/grant/commitment/time-cycle')`

Data source API endpoint key: `commitments`\
[Controller](../controllers/disbursements.controller.ts)\
[Mapping](./mapping/disbursements/grantCommittedTimeCycle.json)\
[Filters mapping](./filtering/grants.json)

## Grant detail Disbursements treemap visualisation

`@get('/grant/disbursements/treemap')`

Data source API endpoint key: `grantDetailGrants`\
[Controller](../controllers/disbursements.controller.ts)\
[Mapping](./mapping/disbursements/grantDetailTreemap.json)\
[Filters mapping](./filtering/grantDetailTreemapDisbursements.json)

## Grant detail Signed treemap visualisation

`@get('/grant/signed/treemap')`

Data source API endpoint key: `grantsNoCount`\
[Controller](../controllers/disbursements.controller.ts)\
[Mapping](./mapping/disbursements/grantDetailTreemap.json)\
[Filters mapping](./filtering/grantDetailTreemapDisbursements.json)

## Grant detail Commitment treemap visualisation

`@get('/grant/commitment/treemap')`

Data source API endpoint key: `grantsNoCount`\
[Controller](../controllers/disbursements.controller.ts)\
[Mapping](./mapping/disbursements/grantDetailTreemap.json)\
[Filters mapping](./filtering/grantDetailTreemapDisbursements.json)

</details>

<details>
  <summary>Documents</summary>

## Documents list

`@get('/documents')`

Data source API endpoint key: `documents`\
[Controller](../controllers/documents.controller.ts)\
[Mapping](./mapping/documents/index.json)\
[Utils mapping](./mapping/documents/utils.json)\
[Filters mapping](./filtering/documents.json)

## Grant detail Documents list

`@get('/grant-documents')`

Data source API endpoint key: `documents`\
[Controller](../controllers/documents.controller.ts)\
[Mapping](./mapping/documents/index.json)\
[Utils mapping](./mapping/documents/utils.json)\
[Filters mapping](./filtering/documents.json)

</details>

<details>
  <summary>Eligibility</summary>

## Eligibility dots visualisation

`@get('/eligibility')`

Data source API endpoint key: `eligibility`\
[Controller](../controllers/eligibility.controller.ts)\
[Mapping](./mapping/eligibility/dotsChart.json)\
[Filters mapping](./filtering/eligibility.json)

## Eligibility dots visualisation years

`@get('/eligibility/years')`

Data source API endpoint key: `eligibility`\
[Controller](../controllers/eligibility.controller.ts)\
[Mapping](./mapping/eligibility/years.json)

## Location detail Eligibility scatterplot visualisation

`@get('/eligibility/country')`

Data source API endpoint key: `eligibility`\
[Controller](../controllers/eligibility.controller.ts)\
[Mapping](./mapping/eligibility/scatterplot.json)\
[Filters mapping](./filtering/eligibility.json)

</details>

<details>
  <summary>Filter options</summary>

## Locations

`@get('/filter-options/locations')`

Data source API endpoint key: `filteroptionslocations`\
[Controller](../controllers/filteroptions.controller.ts)\
[Mapping](./mapping/filteroptions/locations.json)

## Components

`@get('/filter-options/components')`

Data source API endpoint key: `filteroptionscomponents`\
[Controller](../controllers/filteroptions.controller.ts)\
[Mapping](./mapping/filteroptions/components.json)

## Partner types

`@get('/filter-options/partner-types')`

Data source API endpoint key: `filteroptionspartnertypes`\
[Controller](../controllers/filteroptions.controller.ts)\
[Mapping](./mapping/filteroptions/partnertypes.json)

## Grant status

`@get('/filter-options/status')`

Data source API endpoint key: `filteroptionsstatus`\
[Controller](../controllers/filteroptions.controller.ts)\
[Mapping](./mapping/filteroptions/status.json)

## Replenishment periods

`@get('/filter-options/replenishment-periods')`

Data source API endpoint key: `filteroptionsreplenishmentperiods`\
[Controller](../controllers/filteroptions.controller.ts)\
[Mapping](./mapping/filteroptions/replenishmentperiods.json)

## Donors

`@get('/filter-options/donors')`

Data source API endpoint key: `filteroptionsdonors`\
[Controller](../controllers/filteroptions.controller.ts)\
[Mapping](./mapping/filteroptions/donors.json)

</details>

<details>
  <summary>Global search</summary>

## Global search

`@get('/global-search')`

Data source API endpoint key: listed in the mapping file\
[Controller](../controllers/global-search.controller.ts)\
[Mapping](./mapping/globalsearch/index.json)

</details>

<details>
  <summary>Location detail</summary>

## Location detail info

`@get('/location/detail')`

Data source API endpoint key: `multicountries`, `grantsNoCount`\
[Controller](../controllers/location.controller.ts)\
[Mapping](./mapping/location/index.json)\
[Filters mapping](./filtering/grants.json)

</details>

<details>
  <summary>Partner detail</summary>

## Partner detail info

`@get('/partner/detail')`

Data source API endpoint key: `grantsNoCount`\
[Controller](../controllers/partner.controller.ts)\
[Mapping](./mapping/partner/index.json)\
[Filters mapping](./filtering/grants.json)

</details>

<details>
  <summary>Performance framework</summary>

## Performance framework network visualisation

`@get('/performance-framework')`

Data source API endpoint key: `performanceframework`\
[Controller](../controllers/performanceframework.controller.ts)\
[Mapping](./mapping/performanceframework/index.json)\
[Utils mapping](./mapping/performanceframework/utils.json)

## Performance framework network visualisation expand/drilldown

`@get('/performance-framework/expand')`

Data source API endpoint key: `performanceframework`\
[Controller](../controllers/performanceframework.controller.ts)\
[Mapping](./mapping/performanceframework/expandMap.json)\
[Utils mapping](./mapping/performanceframework/expand.json)

</details>

<details>
  <summary>Performance rating</summary>

## Performance rating bar chart

`@get('/performance-rating')`

Data source API endpoint key: `performancerating`\
[Controller](../controllers/performancerating.controller.ts)\
[Mapping](./mapping/performancerating/index.json)

</details>

<details>
  <summary>Pledges & Contributions</summary>

## Pledges & Contributions time/cycle

`@get('/pledges-contributions/time-cycle')`

Data source API endpoint key: `pledgescontributions`\
[Controller](../controllers/pledgescontributions.controller.ts)\
[Mapping](./mapping/pledgescontributions/timeCycle.json)\
[Filters mapping](./filtering/pledgescontributions.json)

## Pledges & Contributions geomap

`@get('/pledges-contributions/geomap')`

Data source API endpoint key: `pledgescontributions`\
[Controller](../controllers/pledgescontributions.controller.ts)\
[Mapping](./mapping/pledgescontributions/geo.json)\
[Filters mapping](./filtering/pledgescontributions.json)

## Pledges & Contributions time/cycle drilldown

`@get('/pledges-contributions/time-cycle/drilldown')`

Data source API endpoint key: `pledgescontributions`\
[Controller](../controllers/pledgescontributions.controller.ts)\
[Mapping](./mapping/pledgescontributions/timeCycleDrilldown.json)\
[Filters mapping](./filtering/pledgescontributions.json)

## Pledges & Contributions treemap

`@get('/pledges-contributions/treemap')`

Data source API endpoint key: `pledgescontributions`\
[Controller](../controllers/pledgescontributions.controller.ts)\
[Mapping](./mapping/pledgescontributions/geo.json)\
[Filters mapping](./filtering/pledgescontributions.json)

</details>

<details>
  <summary>Results</summary>

## Results list

`@get('/results')`

Data source API endpoint key: `results`\
[Controller](../controllers/results.controller.ts)\
[Mapping](./mapping/results/index.json)\
[Utils mapping](./mapping/results/utils.json)\
[Filters mapping](./filtering/results.json)

## Results years

`@get('/results/years')`

Data source API endpoint key: `results`\
[Controller](../controllers/results.controller.ts)\
[Mapping](./mapping/results/years.json)

## Results stats

`@get('/results-stats')`

Data source API endpoint key: `results`\
[Controller](../controllers/results.controller.ts)\
[Mapping](./mapping/results/stats.json)\
[Filters mapping](./filtering/results.json)

</details>
