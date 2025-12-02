---
# SFPEG EXCEL Components
---
# ![Logo](/media/Logo.png) &nbsp; **SFPEG EXCEL** Components

## Introduction

This package contains a set of LWC components primarily dedicated to the import and export of Salesforce
records from / to Microsoft Excel spreadsheets directly from the Lightning UX.

It leverages the opensource **[SheetJs](https://sheetjs.com/)** Javascript library to convert Excel 
spreadsheet data into/from JSON record arrays and adds a **[SLDS](https://www.lightningdesignsystem.com/)**
compliant UX layer to easily perform simple import/export operations.

These components were built as contributions/examples for former & ongoing Advisory assignments by 
[Pierre-Emmanuel Gros](https://github.com/pegros).


## Package Content

### **[sfpegExcelLoader](/help/sfpegExcelLoader.md)** Data Importer

This component enables to easily:
* select, upload and parse an Excel spreadsheet (_.xlsx_ extensions)
* select one of its tab and trigger the import of the contained rows

![sfpegExcelLoader component](/media/sfpegExcelLoader.png) 

There is an implicit mapping done by setting the Field API Names of the
configured target Object as column headers in the Excel spreadsheet.

Multiple options and controls are available for administrators:
* insert vs upsert mode
* automatic RecordType mapping via DeveloperNames
* automatic Lookup valuation via External IDs
* possible limitation of the max. number of rows and of the allowed fields
* possible automatic valuation of a lookup field with the current page record ID


### **[sfpegExcelExporter](/help/sfpegExcelExporter.md)** Data Exporter

This utility bar component enables to export as an Excel spreadsheet records displayed
(or selected) in the list component provided by the
**[PEG_LIST](https://github.com/pegros/PEG_LIST)** package.

It actually handles custom notifications sent by header actions configured for these
list components and generate simple Excel spreadsheet out of the provided data.


## Installation

The whole metadata for each component (LWC component, Apex classes, custom labels,
static resources, permission sets...) is located in a component specific folder.
You may deploy the whole **PEG_EXCEL** repository at once or only the folder corresponding
to one of the components directly via **Git** and **SF CLI**.

Alternatively, these 2 components are available in individual _unlocked_ packages, 
the installation links of which are available in the _Release Notes_
section of each package's overview page.  

⚠️ When deploying them, pay attention to the possible dependencies!
E.g. the `sfpegExcel-exporter` package in this repository depends on the
`sfpegExcel-loader` and `sfpegList-core` packages.

ℹ️ When installing them via the unlocked package installation links, you should rather
choose the `Install for Admins only` and `Compile only the Apex in the Package` options.

![Unlocked Package Installation](/media/sfpegExcelInstallation.png)


## Technical Details

Each component is packaged independently as an [unlocked package](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/sfdx_dev_unlocked_pkg_whats_a_package.htm).
* The **[sfpegExcel-loader](/help/sfpegExcelLoader.md)** package depends on the **[sfpegList-core](https://github.com/pegros/PEG_LIST/blob/master/help/sfpegListPkgCore.md)** package
  for the **sfpegTestObject** custom object used in Apex test classes.
* The **[sfpegExcel-exporter](/help/sfpegExcelExporter.md)** package has dependencies on:
    *  the **[sfpegExcel-loader](/help/sfpegExcelLoad.md)** package for the **[SheetJs](https://sheetjs.com/)** Javascript library (static resource)
    * the **[sfpegList-core](https://github.com/pegros/PEG_LIST/blob/master/help/sfpegListPkgCore.md)** package for the custom notification definition.

ℹ️ The actual **[SheetJs](https://sheetjs.com/)** Javascript library version used is the 
community **mini** version addressing only _.xlsx_ files. You may see which version number
is used by activating the debug checkbox on the component and change the version by modifying
the content of **sfpegSheetJs** static resource content used by the components.

⚠️ They are not available on Experience Sites (yet) but the importer may be used from within
screen flows.