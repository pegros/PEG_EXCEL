---
# SFPEG EXCEL Components
---


## Introduction

This package contains a set of LWC components primarily dedicated to the import and export of Salesforce
records from / to Microsoft Excel spreadsheets directly from the Lightning UX.

It leverages the opensource **[SheetJs](https://sheetjs.com/)** Javascript library to convert Excel 
spreadsheet data into/from JSON record arrays and adds a **[SLDS](https://www.lightningdesignsystem.com/)**
compliant UX layer to easily perform simple import/export operations.

These components were built as contributions/examples for former & ongoing Advisory assignments by 
[Pierre-Emmanuel Gros](https://github.com/pegros).


## Package Content

### **[sfpegExcelLoaderCmp](/help/sfpegExcelLoaderCmp.md)** Data Importer

This component enables to easily:
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


### **[sfpegExcelGeneratorCmp](/help/sfpegExcelLoaderCmp.md)** Data Exporter

🚧 _Planned for near future_ 🚧 

## Technical Details

Each component is provided in a dedicated folder containing all the dependencies
required to deploy and use it.

🚧 _Work in Progress_ 🚧 
