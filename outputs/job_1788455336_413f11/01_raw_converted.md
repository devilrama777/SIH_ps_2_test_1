# CSV Dataset Overview: 7ef81408_coal_production_report.csv

- **Total Records:** 24
- **Total Columns:** 10
- **Column List:** Data_Category, Entity, Financial_Year, Production_MT, YoY_Growth_Percent, Revenue_Crore, Secondary_Metric, Secondary_Value_MT, Source, Data_Status

---

## Dataset Schema

| Column Name | Data Type | Non-Null Count | Missing Count | Unique Values |
| --- | --- | --- | --- | --- |
| Data_Category | str | 24 | 0 | 3 |
| Entity | str | 24 | 0 | 11 |
| Financial_Year | str | 24 | 0 | 12 |
| Production_MT | float64 | 24 | 0 | 24 |
| YoY_Growth_Percent | float64 | 10 | 14 | 10 |
| Revenue_Crore | float64 | 9 | 15 | 9 |
| Secondary_Metric | str | 11 | 13 | 1 |
| Secondary_Value_MT | float64 | 11 | 13 | 11 |
| Source | str | 24 | 0 | 3 |
| Data_Status | str | 24 | 0 | 1 |


## Numerical Summary Statistics

| Metric / Column | count | mean | std | min | 25% | 50% | 75% | max |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Production_MT | 24.0 | 535.218 | 336.3626 | 0.2 | 174.5725 | 666.634 | 773.69 | 1047.523 |
| YoY_Growth_Percent | 10.0 | 5.952 | 5.1834 | -2.02 | 2.725 | 6.3 | 8.4825 | 14.78 |
| Revenue_Crore | 9.0 | 31548.38 | 42249.2368 | 115.97 | 14559.14 | 17491.99 | 27182.32 | 141967.71 |
| Secondary_Value_MT | 11.0 | 148.249 | 17.8413 | 124.261 | 138.9685 | 144.709 | 153.9775 | 187.536 |


## Data Records Preview (Showing first 24 rows)

| Data_Category | Entity | Financial_Year | Production_MT | YoY_Growth_Percent | Revenue_Crore | Secondary_Metric | Secondary_Value_MT | Source | Data_Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| National Coal Production | India | 2013-14 | 565.765 |  |  | SECL contribution | 124.261 | PIB / Ministry of Coal, Coal Production (02-Apr-2025) | Reported |
| National Coal Production | India | 2014-15 | 609.179 | 7.67 |  | SECL contribution | 128.275 | PIB / Ministry of Coal, Coal Production (02-Apr-2025) | Reported |
| National Coal Production | India | 2015-16 | 639.23 | 4.93 |  | SECL contribution | 137.934 | PIB / Ministry of Coal, Coal Production (02-Apr-2025) | Reported |
| National Coal Production | India | 2016-17 | 657.868 | 2.92 |  | SECL contribution | 140.003 | PIB / Ministry of Coal, Coal Production (02-Apr-2025) | Reported |
| National Coal Production | India | 2017-18 | 675.4 | 2.66 |  | SECL contribution | 144.709 | PIB / Ministry of Coal, Coal Production (02-Apr-2025) | Reported |
| National Coal Production | India | 2018-19 | 728.718 | 7.89 |  | SECL contribution | 157.349 | PIB / Ministry of Coal, Coal Production (02-Apr-2025) | Reported |
| National Coal Production | India | 2019-20 | 730.874 | 0.3 |  | SECL contribution | 150.546 | PIB / Ministry of Coal, Coal Production (02-Apr-2025) | Reported |
| National Coal Production | India | 2020-21 | 716.083 | -2.02 |  | SECL contribution | 150.606 | PIB / Ministry of Coal, Coal Production (02-Apr-2025) | Reported |
| National Coal Production | India | 2021-22 | 778.21 | 8.68 |  | SECL contribution | 142.514 | PIB / Ministry of Coal, Coal Production (02-Apr-2025) | Reported |
| National Coal Production | India | 2022-23 | 893.191 | 14.78 |  | SECL contribution | 167.006 | PIB / Ministry of Coal, Coal Production (02-Apr-2025) | Reported |
| National Coal Production | India | 2023-24 | 997.826 | 11.71 |  | SECL contribution | 187.536 | PIB / Ministry of Coal, Coal Production (02-Apr-2025) | Reported |
| CIL Subsidiary Production | BCCL | 2023-24 | 41.1 |  | 14113.31 |  |  | Rajya Sabha / Ministry of Coal, Subsidiary-wise raw coal production and revenue (2023-24) | Reported |
| CIL Subsidiary Production | CCL | 2023-24 | 86.05 |  | 16565.72 |  |  | Rajya Sabha / Ministry of Coal, Subsidiary-wise raw coal production and revenue (2023-24) | Reported |
| CIL Subsidiary Production | ECL | 2023-24 | 47.56 |  | 14559.14 |  |  | Rajya Sabha / Ministry of Coal, Subsidiary-wise raw coal production and revenue (2023-24) | Reported |
| CIL Subsidiary Production | MCL | 2023-24 | 206.1 |  | 27182.32 |  |  | Rajya Sabha / Ministry of Coal, Subsidiary-wise raw coal production and revenue (2023-24) | Reported |
| CIL Subsidiary Production | NCL | 2023-24 | 136.15 |  | 24632.89 |  |  | Rajya Sabha / Ministry of Coal, Subsidiary-wise raw coal production and revenue (2023-24) | Reported |
| CIL Subsidiary Production | NEC | 2023-24 | 0.2 |  | 115.97 |  |  | Rajya Sabha / Ministry of Coal, Subsidiary-wise raw coal production and revenue (2023-24) | Reported |
| CIL Subsidiary Production | SECL | 2023-24 | 187.38 |  | 27306.37 |  |  | Rajya Sabha / Ministry of Coal, Subsidiary-wise raw coal production and revenue (2023-24) | Reported |
| CIL Subsidiary Production | WCL | 2023-24 | 69.11 |  | 17491.99 |  |  | Rajya Sabha / Ministry of Coal, Subsidiary-wise raw coal production and revenue (2023-24) | Reported |
| CIL Subsidiary Production | CIL Grand Total | 2023-24 | 773.65 |  | 141967.71 |  |  | Rajya Sabha / Ministry of Coal, Subsidiary-wise raw coal production and revenue (2023-24) | Reported |
| Latest Ministry Headline | India | 2024-25 | 1047.523 |  |  |  |  | Ministry of Coal Production and Supplies | Reported |
| Latest Ministry Headline | CIL | 2024-25 | 781.056 |  |  |  |  | Ministry of Coal Production and Supplies | Reported |
| Latest Ministry Headline | CIL | 2023-24 | 773.81 |  |  |  |  | Ministry of Coal Production and Supplies | Reported |
| Latest Ministry Headline | CIL | 2022-23 | 703.2 |  |  |  |  | Ministry of Coal Production and Supplies | Reported |

