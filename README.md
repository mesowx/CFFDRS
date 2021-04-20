# CFFDRS Computation Codes

As part of our [Great Lakes](https://glff.mesowest.org) and [Alaska](https://akff.mesowest.org) Fire and Fuels wildland fire weather awareness programs, versions of the [Canadian Forest Fire Danger Rating System](https://cwfis.cfs.nrcan.gc.ca/background/summary/fwi) have been developed to power our displays and [tools](https://glff.mesowest.org/tools/). We are also sharing the code we developed publicly, so it can be used in other fire weather awareness applications. 

This repository contains code to compute the Fire Weather Index system values in both Python 2 or 3 (with suppport for vectorized computation using `numpy`) and Javascript. Additionally we are have developed a Javascript implementation of the more complex Fire Behavior Predition system (FBP). There are additional implementations of FBP on the internet, including in the C and R languages. 

## References

The following publications can give you more information about the systems themselves. 

Forestry Canada Fire Danger Group. 1992. [Development and structure of the Canadian Forest Fire Behavior Prediction System. Information Report ST-X-3.](https://www.frames.gov/documents/catalog/forestry_canada_fire_danger_group_1992.pdf) Ottawa, Ontario, Canada: Forestry Canada, Science and Sustainable Development Directorate. 63 p.

Wotton, B.M.; Alexander, M.E.; Taylor, S.W. 2009. [Updates and Revisions to the 1992 Canadian Forest Fire Behavior Prediction System](https://cfs.nrcan.gc.ca/pubwarehouse/pdfs/31414.pdf). Natural Resources Canada, Canadian Forest Service, Great Lakes Forestry Centre, Sault Ste. Marie, Ontario, Canada. Information Report GLC-X-10, 45p.
