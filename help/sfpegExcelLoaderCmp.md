---
# sfpegExcelLoaderCmp Component
---


## Introduction

The **sfpegExcelLoaderCmp** component enables to easily:
* select, upload and parse an Excel spreadsheet
* select one of its tab and trigger the import of the contained rows

![sfpegExcelLoaderCmp](/media/sfpegExcelLoader.png) 

There is an implicit mapping done by setting the Field API Names of the
configured target Object as column headers in the Excel spreadsheet.

Multiple options and controls are available for administrators:
* insert vs upsert mode
* automatic RecordType mapping via DeveloperNames
* automatic Lookup valuation via External IDs
* possible limitation of the max. number of rows and of the allowed fields
* possible automatic valuation of a lookup field with the current page record ID

## Component Configuration

All of the configuration is done in the App Builder via a set of simple properties.

![sfpegExcelLoaderCmp Configuration](/media/sfpegExcelLoaderConfig.png) 

🚧 _Work In Progress_ 🚧 

Many custom labels are available for customisation (prefixed as `sfpegExcelLoader`)
for button titles or labels, misc. labels as well as error or information messages.

A **sfpegExcelLoaderUsage** permission set provides access to the necessary metadata
to use the component.

## Technical Details

🚧 _Work In Progress_ 🚧 