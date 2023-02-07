---
# sfpegExcelLoaderCmp Component
---


## Introduction

The **sfpegExcelLoaderCmp** component enables to easily:
* select, upload and parse an Excel spreadsheet (_.xlsx_ extensions)
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


---
## Component Overview

The component basically provides a 3-step process to import data from an Excel spreadsheet.
1. **file selection** and content upload/parsing
![sfpegExcelLoaderCmp Step #1](/media/sfpegExcelLoaderStep1.png)

2. file tabs display and selection and **import trigger**
![sfpegExcelLoaderCmp Step #2](/media/sfpegExcelLoaderStep2.png) 

3. import result **summary**
![sfpegExcelLoaderCmp Step #3](/media/sfpegExcelLoaderStep3.png) 


A few additional buttons are available in the card header
* `download` (in step #3) to download import summary information in Excel format.
* `back` icon enables to return to the initial **file selection** step
* `information`icon enables to display a small popup with contextual information 
about the import conditions
![sfpegExcelLoaderCmp Information Popup](/media/sfpegExcelLoaderInformation.png) 


### Field Mapping

Field mapping is completely implicit (there is no user step to do it):
* spreadsheet tabs should contain the target field API names as column headers
* any spreadsheet tab column header not found in the target object metadata is ignored
* record types may be provided:
    * via a `RecordTypeId` column containing Salesforce RecordType IDs
    * via a `RecordType.DeveloperName` column containing RecordType developer names
* lookup fields may be provided:
    * via the lookup field (e.g. `Lookup__c`) column containing Salesforce IDs of related records
    * via the related external ID field (e.g. `Lookup__r.ExternalId__c`) column containing External ID values of related records
    * In case of polymorphic lookup field (e.g. `OwnerId` on some objects), the related object type should be explicitly 
    mentionned in the column name (e.g. `Owner.User.ExternalId__c`) 


### Import Modes

All imports are actually executed via an `upsert` DML to support the setting of lookups fields leveraging 
external IDs on the target records.

However, the component still provides 2 modes:
* `insert` executing the upsert DML without specifying and external ID field on the records (behaves 
more or less like an `insert` DML)
* `upsert` executing the upsert DML with a specified external ID field, the user being required to
explicitly select the applicable external ID field if multiple ones are available in the imported data

![sfpegExcelLoaderCmp External ID Selection](/media/sfpegExcelLoaderExtIdSelection.png) 


---
## Component Configuration
### App Builder Configuration

All of the configuration is done in the App (or Flow) Builder via a set of simple properties.

![sfpegExcelLoaderCmp Configuration](/media/sfpegExcelLoaderConfig.png) 

The following properties are available:
* `Card Title`, `Card Icon` and `Card CSS Class` to customise the global container
card of the component (all optional)
* `Imported Object` to define the Object API name of the records to be imported
* `Lookup Field` to define the lookup Field API name to be initialised with the current page
record ID (if any) upon import (when in App Builder mode)
* `Import Mode` to define the way records are imported (i.e. _insert_ or _upsert_ mode)
* `Max. #Rows`to limit the number of rows loaded at once (e.g. to cope with DML limits or mitigate
data corruption risks), 0 or empty meaning no limit
* `Allowed Fields` to limit the actual field API names to be imported (e.g. to mitigate data corruption
risks), set as a stringified JSON list
* `All or None?` to toggle between atomic (true) and best effort (false) error handling upon import.
    * In best effort mode all possible records are imported
    * In atomic mode all records are rejected if one gets an error. 
* `Show Debug?`to activate debug information (footer display and console logs)

_Note_: when in Flow builder, an additional `Parent Record ID` property is available to
explicitly define the value to be used to set the configured `Lookup Field`.

### User Permissions Assigment

A **sfpegExcelLoaderUsage** permission set provides access to the necessary metadata (basically
the undelying Apex controller class) to use the component.

The **sfpegExcelLoaderTest** permission set is used only within Apex test classes to ensure their
proper execution. It should not be assigned to end-users.

### Custom Label Customisation

The component relies on a set of custom labels for various labels, titles or error or information messages.
They are all prefixed as `sfpegExcelLoader...` and may easily be customised or translated via standard 
Salesforce setup.

**Beware** that some of them support token merging to inject data in the custom label content
(usually via `{0}`token).


---
## Technical Details
### Component Packaging

The component is available for deployment in the **force-app/main/sfpegExcelLoader** folder
containing all the dependencies (Apex classes, custom labels, static resource, permission sets...)
required to deploy and use it.

The **sfpegTestObject__c** custom object is provided only for test purposes and is used in the 
Apex test classes. The same object is included in various **PEG** repositories
(e.g. **[PEG_LIST](https://github.com/pegros/PEG_LIST)**) but this variant includes
special additional metadata dedicated to this component. 


### SheetJs Library

The actual **[SheetJs](https://sheetjs.com/)** Javascript library version used is the 
community **mini** version addressing only _.xlsx_ files. You may see which version number
is used by activating the debug checkbox on the component and change the version by modifying
the content of **sfpegSheetJs** static resource content used by the component.
