# ![Logo](/media/Logo.png) &nbsp; **sfpegExcelExporter** Component

## Introduction

This utility bar component enables to export as an Excel spreadsheet records displayed
(or selected) in the list component provided by the
**[PEG_LIST](https://github.com/pegros/PEG_LIST)** package.

It actually handles custom notifications sent by header actions configured for these
list components and generate simple Excel spreadsheet out of the provided data.

ℹ️ This LWC component is available for standard Lightning UX and Experience Sites.


## Installation

This component may be installed and upgraded as the `sfpegExcel-exporter` unlocked package
directly on your Org via the installation link provided in the [release notes](#release-notes).

⚠️ It requires the following packages to be already deployed:
* the **[sfpegExcel-loader](/help/sfpegExcelLoader.md)** package for the **[SheetJs](https://sheetjs.com/)** Javascript library (static resource)
* the **[sfpegList-core](https://github.com/pegros/PEG_LIST)** package for the custom notification definition

After package installation, you may then add the `SF PEG Excel Exporter` component in
your Lightning App utility bar or in the footer of your Experience Site.


## Component Overview

The component basically provides no UI and merely converts data sent via `sfpegCustomAction`
custom notifications (see **[PEG_LIST](https://github.com/pegros/PEG_LIST) component) into
a simple on tab Excel spreadsheet.

ℹ️ Data and Excel file names are expected to be provided as part of the notification payload.


## Component Configuration

### Utility App / Experience Site Builder Configuration

All of the configuration is done in the `Utility Items` section of the **App Builder** via:
* standard utility bar component parameters, like `Label`or `Icon`
    * `Panel Width` and `Panel Height` are usually set to `0` as no output is provided
    except when in _debug_ mode
    * ⚠️ `Start automatically` should be checked so that the component is actually
    instantiated and ready to receive notification.
* custom ones, the most immortant one being the `Notification Channel` from which
the component will receive the `export` notifications

![sfpegExcelExporter Configuration](/media/sfpegExcelExporterConfig.png) 


### **sfpegAction** Metadata Configuration

In order to trigger an **export** from a **[sfpegListCmp](https://github.com/pegros/PEG_LIST/blob/master/help/sfpegListCmp.md)**,
* the list should be set in _[Mass Selection](https://github.com/pegros/PEG_LIST/blob/master/help/sfpegListCmp.md#row-selection-and-mass-action-handling)_ mode
* a **[sfpegAction](https://github.com/pegros/PEG_LIST/blob/master/help/sfpegActionBarCmp.md)** metadata should
be configured are registered as `header action` to the list with a notification action of `action` type.

Hereafter is provided an configuration example of such an `export` action:
* the `Notification Channel` is `sfpegExcelExport` and should be the one the **sfpegExcelExporter** component
is listening to in the Utility bar
* all Opportunity records selected in the list are sent as-is for export
* the output Excel file is named `Export-CurrentPageRecordName.xlsx`
* The Opportunity records are put in an `Opportunities` tab in the Excel spreadsheet
* Rows contain the values for the `Name`, `StageName`, `CloseDate` and `Owner.Name`columns

```
{
    "name": "exportExcel",
    "iconName": "utility:download",
    "label": "Export",
    "title": "Export as Excel",
    "action": {
        "type": "action",
        "channel": "sfpegExcelExport",
        "params": {
            "fileName": "Export-{{{RCD.Name}}}.xlsx",
            "tabName": "Opportunities",
            "header":["Name","StageName","CloseDate","Owner.Name"]
        },
        "selection": {
            "all": true
        }
    }
}
```

⚠️ All values exported in the Excel spreadsheet should be available record list fetched by the **sfpegListCmp**
component (even if not displayed in the data table or tile list).


## Technical Details

The LWC component is available for deployment in the **force-app/sfpegExcelExporter** folder.

This component relies on:
* the **[SheetJs](https://sheetjs.com/)** Javascript library provided as static resource by the **[sfpegExcel-loader](/help/sfpegExcelLoader.md)** package
* the `sfpegCustomAction` custom notification provided by the **[sfpegList-core](https://github.com/pegros/PEG_LIST/blob/master/help/sfpegListPkgCore.md)** package 


## Release Notes

### December 2025 - v1.1.0

First version with the new unlocked package structure.

Prerequisites are:
* the `November 2025` version of the **[sfpegList-core](https://github.com/pegros/PEG_LIST/blob/master/help/sfpegListPkgCore.md#november-2025---v110)**
* the `December 2025` version of the **[sfpegExcel-loader](/help/sfpegExcelLoader.md#december-2025---v110)**

Install it:
* from [here ⬇️](https://login.salesforce.com/packaging/installPackage.apexp?p0=04tJ7000000xIlzIAE) for production orgs,
* from [here ⬇️](https://test.salesforce.com/packaging/installPackage.apexp?p0=04tJ7000000xIlzIAE) for sandboxes,
* or by adding the following relative URL to your Org domain: `/packaging/installPackage.apexp?p0=04tJ7000000xIlzIAE`
