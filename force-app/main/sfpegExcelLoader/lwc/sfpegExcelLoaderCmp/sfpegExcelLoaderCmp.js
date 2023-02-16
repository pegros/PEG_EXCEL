/***
* @author P-E GROS
* @date   Nov 2022
* @description  LWC Component to upsert data from an .xlsx Excel file directly within a 
*               Lightning page. It leverages some capabilities provided by the SheetJs
*               opensource library (mini version)
* @see PEG_EXCEL package (https://github.com/pegros/PEG_EXCEL)
* @see SheetJs library (https://sheetjs.com/)
*
* Legal Notice
* 
* MIT License
* 
* Copyright (c) 2022 pegros
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in all
* copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
* SOFTWARE.
***/

/***
* SheetJS Community Edition -- https://sheetjs.com/
*
* Copyright (C) 2012-present   SheetJS LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
***/

import { LightningElement, api, track, wire } from 'lwc';
import { getObjectInfo }    from 'lightning/uiObjectInfoApi';
import { loadScript }       from 'lightning/platformResourceLoader';
import { NavigationMixin } from 'lightning/navigation';
import sheetjs              from '@salesforce/resourceUrl/sfpegSheetJs';
import getExternalIdFields  from '@salesforce/apex/sfpegExcelLoader_CTL.getExternalIdFields';
import importRecords        from '@salesforce/apex/sfpegExcelLoader_CTL.importRecords';
import CURRENCY             from '@salesforce/i18n/currency';

import IMPORT_BUTTON_LABEL  from '@salesforce/label/c.sfpegExcelLoaderImportLabel';
import IMPORT_BUTTON_TITLE  from '@salesforce/label/c.sfpegExcelLoaderImportTitle';
import BACK_BUTTON_TITLE    from '@salesforce/label/c.sfpegExcelLoaderBackTitle';
import INFO_BUTTON_TITLE    from '@salesforce/label/c.sfpegExcelLoaderInfoTitle';
import UPLOAD_BUTTON_LABEL  from '@salesforce/label/c.sfpegExcelLoaderUploadLabel';
import SELECT_BUTTON_LABEL  from '@salesforce/label/c.sfpegExcelLoaderSelectLabel';
import DOWNLOAD_BUTTON_TITLE  from '@salesforce/label/c.sfpegExcelLoaderDownloadTitle';
import NO_DATA_MESSAGE      from '@salesforce/label/c.sfpegExcelLoaderNoDataMessage';
import FAILURES_LABEL       from '@salesforce/label/c.sfpegExcelLoaderFailuresLabel';
import CREATIONS_LABEL      from '@salesforce/label/c.sfpegExcelLoaderCreationsLabel';
import UPDATES_LABEL        from '@salesforce/label/c.sfpegExcelLoaderUpdatesLabel';
import ROW_COUNT_MESSAGE    from '@salesforce/label/c.sfpegExcelLoaderRowCountMessage';
import EXT_ID_MESSAGE       from '@salesforce/label/c.sfpegExcelLoaderExternalIdMessage';
import MAX_ROW_WARNING      from '@salesforce/label/c.sfpegExcelLoaderMaxRowWarning';
import HELP_TITLE           from '@salesforce/label/c.sfpegExcelLoaderHelpTitle';
import HELP_OBJECT_LABEL    from '@salesforce/label/c.sfpegExcelLoaderHelpObject';
import HELP_LOOKUP_LABEL    from '@salesforce/label/c.sfpegExcelLoaderHelpLookup';
import HELP_MODE_LABEL      from '@salesforce/label/c.sfpegExcelLoaderHelpMode';
import HELP_FIELDS_LABEL    from '@salesforce/label/c.sfpegExcelLoaderHelpFields';
import HELP_MAX_ROWS_LABEL  from '@salesforce/label/c.sfpegExcelLoaderHelpMaxRows';
import HELP_EXTENSIONS_LABEL    from '@salesforce/label/c.sfpegExcelLoaderHelpExtensions';
import HELP_NO_LOOKUP_MSG   from '@salesforce/label/c.sfpegExcelLoaderHelpNoLookupMessage';
import HELP_ALL_FIELDS_MSG  from '@salesforce/label/c.sfpegExcelLoaderHelpAllFieldsMessage';
import HELP_EXCEL_EXT_MSG   from '@salesforce/label/c.sfpegExcelLoaderHelpExcelExtensionMessage';

import INIT_FAILURE_MSG     from '@salesforce/label/c.sfpegExcelLoaderInitFailure';
import UPLOAD_SUCCESS_MSG   from '@salesforce/label/c.sfpegExcelLoaderUploadSuccess';
import UPLOAD_INFO_MSG      from '@salesforce/label/c.sfpegExcelLoaderUploadMessage';
import IMPORT_FAILURE_MSG   from '@salesforce/label/c.sfpegExcelLoaderImportFailure';
import IMPORT_PARTIAL_FAILURE_MSG   from '@salesforce/label/c.sfpegExcelLoaderImportPartialFailure';
import IMPORT_SUCCESS_MSG   from '@salesforce/label/c.sfpegExcelLoaderImportSuccess';

import SUMMARY_STATUS       from '@salesforce/label/c.sfpegExcelLoaderSummaryStatus';
import SUMMARY_DETAILS      from '@salesforce/label/c.sfpegExcelLoaderSummaryDetails';
import SUMMARY_TAB          from '@salesforce/label/c.sfpegExcelLoaderSummaryTab';

// for CSV result exports
const SFPEG_EXCEL_LOADER = {
    fieldDelimiter : ",",
    valueDelimiter : "\"",
    lineDelimiter  : "\r\n"
};

export default class SfpegExcelLoaderCmp extends NavigationMixin(LightningElement) {

    //----------------------------------------------------------------
    // Main configuration fields (for App Builder)
    //----------------------------------------------------------------
    @api cardTitle;                 // Title of the wrapping Card
    @api cardIcon;                  // Icon of the wrapping Card
    @api cardClass;                 // CSS Classes for the wrapping card div (slds-card slds-card_boundary)

    @api objectName;                // Object API Name for which data should be imported
    @api lookupField;               // API Name of the lookup field in which the current page record Id should be added upon import
    
    @api importMode = 'insert'      // Insert or upsert mode. Imports are always done with upsert DMLs,
                                    // but upsert mode ensures an external ID field is present on import
                                    // and specifies it when triggering the DML.
    @api allowedFields;             // Stringified JSON List of field API Names allowed for import (empty / null meaning no control)
    @api maxRows;                   // Max rows allowed for import (0 / null meaning no limit)
    @api isAllOrNone = false;       // Boolean to control import handling of failed records

    @api isDebug = false;           // Flag to activate debug information (and console logs)

    //----------------------------------------------------------------
    // Internal technical parameters
    //----------------------------------------------------------------
    // Context injected properties
    @api recordId;                  // ID of current page record (if any)

    // Baseline properties
    sheetJsVersion = "???";         // start with ???
    processStep = 1;                // Current process step (1 - upload, 2 - select, 3 - import summary)
    showHelp = false;               // Help display flag

    // Main message display properties
    isError = false;                // Flag controlling the displayed icon and its color
    messageTitle;                   // Message main content displayed in bold
    messageDetails;                 // Message additional information displayed in standard / small

    // Uploaded file properties
    fileInfo;                       // Details about the last imported file
    fileData;                       // Raw data read from the file
    sheetDataJson;                  // Data extracted as JSON from the file (via XLSX utility)
    sheetData;                      // Data per sheet reworked for display in the component

    // Import properties
    allowedFieldList;   // JSON parsing of allowedFields string variable
    selectedData;       // Data selected upon last import
    importStatus;       // Result data of last import
    importKey;          // Key field used at last import

    //Data table Rendering optimisation (Summer22)
    //renderConfig = {bufferSize: 10};
    renderConfig = {virtualize: 'vertical'};

    //----------------------------------------------------------------
    // Custom Labels
    //----------------------------------------------------------------
    importButtonLabel = IMPORT_BUTTON_LABEL;
    importButtonTitle = IMPORT_BUTTON_TITLE;
    backButtonTitle = BACK_BUTTON_TITLE;
    infoButtonTitle = INFO_BUTTON_TITLE;
    downloadButtonTitle = DOWNLOAD_BUTTON_TITLE;
    uploadButtonLabel = UPLOAD_BUTTON_LABEL;
    selectButtonLabel = SELECT_BUTTON_LABEL;
    noDataMessage = NO_DATA_MESSAGE;
    failuresLabel = FAILURES_LABEL;
    creationsLabel = CREATIONS_LABEL;
    updatesLabel = UPDATES_LABEL;
    helpTitle = HELP_TITLE;
    helpObjectLabel = HELP_OBJECT_LABEL;
    helpLookupLabel = HELP_LOOKUP_LABEL;
    helpModeLabel = HELP_MODE_LABEL;
    helpFieldsLabel = HELP_FIELDS_LABEL;
    helpMaxRowsLabel = HELP_MAX_ROWS_LABEL;
    helpExtensionsLabel = HELP_EXTENSIONS_LABEL;
    helpNoLookupMessage = HELP_NO_LOOKUP_MSG;
    helpAllFieldsMessage = HELP_ALL_FIELDS_MSG;
    helpExcelExtensionMessage = HELP_EXCEL_EXT_MSG;
    

    //----------------------------------------------------------------
    // Custom Getters
    //----------------------------------------------------------------
    get isStep1() {
        return this.processStep == 1;
    }
    get isStep2() {
        return this.processStep == 2;
    }
    get isStep3() {
        return this.processStep == 3;
    }
    get isStep2or3() {
        return this.processStep == 2 || this.processStep == 3;
    }
    get extIdFieldList() {
        return JSON.stringify(this.externalIdFields?.data);
    }
    get maxRowWarning() {
        return MAX_ROW_WARNING.replace('{0}',this.maxRows);
    }

    
    //----------------------------------------------------------------
    // Context Loading
    //----------------------------------------------------------------
    objectInfo;     // Standard Lightning description ot the imported Object
    rtMap;          // Reverse map of all Object record types (RT IDs by DeveloperName)
    @wire(getObjectInfo, { objectApiName: '$objectName' })
    wiredObject({ error, data }) {
        if (this.isDebug) console.log('wiredObject: START ');

        if (error) {
            this.messageTitle = INIT_FAILURE_MSG;
            this.messageDetails = JSON.stringify(error);
            this.isError = true;
            this.processStep = 0;
            console.warn('wiredObject: END KO / error raised ',error);
            return;
        }

        if (!data) {
            console.warn('wiredObject: END KO / no data');
            return;
        }

        if (this.isDebug) console.log('wiredObject: data fetched ',data);
        this.messageTitle = null;
        this.messageDetails = null;
        this.isError = false;
        this.processStep = 1;
        this.objectInfo = data;

        let rtMap = {};
        for (let iterRT in data.recordTypeInfos) {
            if (this.isDebug) console.log('wiredObject: registering RT ',iterRT);
            let iterRTdata = (data.recordTypeInfos)[iterRT];
            rtMap[iterRTdata.name] = iterRT;
        }
        this.rtMap = rtMap;
        if (this.isDebug) console.log('wiredObject: rtMap init ',this.rtMap);
    }    

    @wire(getExternalIdFields, { objectName: '$objectName' })
    externalIdFields;

    //----------------------------------------------------------------
    // Component Initialisation
    //----------------------------------------------------------------
    async connectedCallback() {
        if (this.isDebug) console.log('connectedCallback: START');

        if (this.isDebug) console.log('connectedCallback: before await ', Date.now());
        await loadScript(this, sheetjs);
        if (this.isDebug) console.log('connectedCallback: after await ', Date.now());
        this.sheetJsVersion = XLSX.version;
        if (this.isDebug) console.log('connectedCallback: SheetJs version fetched ', this.sheetJsVersion);

        if (this.isDebug) console.log('connectedCallback: objectInfo init ', JSON.stringify(this.objectInfo));
        if (this.isDebug) console.log('connectedCallback: externalIdFields init ',JSON.stringify(this.externalIdFields));

        if (this.allowedFields) {
            this.allowedFieldList = JSON.parse(this.allowedFields);
            if (this.isDebug) console.log('connectedCallback: allowedFieldList init ',JSON.stringify(this.allowedFieldList));
        }

        if (this.isDebug) console.log('connectedCallback: END');
    }

    //----------------------------------------------------------------
    // Event Handlers
    //----------------------------------------------------------------
 
    toggleHelp(event){
        if (this.isDebug) console.log('handleChange: START with showHelp ',this.showHelp);
        this.showHelp = !this.showHelp;
        if (this.isDebug) console.log('handleChange: END with showHelp ',this.showHelp);
    }

    handleChange(event) {
        if (this.isDebug) console.log('handleChange: START with ',event);
        if (this.isDebug) console.log('handleChange: target ', JSON.stringify(event.target));
        if (this.isDebug) console.log('handleChange: detail ', JSON.stringify(event.detail));
        if (this.isDebug) console.log('handleChange: files ', JSON.stringify(event.files));
        if (this.isDebug) console.log('handleChange: value ', JSON.stringify(event.value));

        let spinner = this.template.querySelector('lightning-spinner');
        if (this.isDebug) console.log('handleChange: spinner fetched ', spinner);
        spinner.classList.remove('slds-hide');


        this.isError = false;
        this.messageTitle = null;
        this.messageDetails = null;

        let fileInput = this.template.querySelector('lightning-input[data-name="fileInput"]');
        if (this.isDebug) console.log('handleChange: fileInput fetched ', fileInput);
        if (this.isDebug) console.log('handleChange: fileInput value ', fileInput.value);
        if (this.isDebug) console.log('handleChange: fileInput files ', fileInput.files);

        let file = fileInput.files[0];
        this.fileInfo = file;
        if (this.isDebug) console.log('handleChange: fileInfo set ',this.fileInfo);

        let reader = new FileReader();
        reader.onload = () => {
            if (this.isDebug) console.log('handleChange: load done ', reader);
            if (this.isDebug) console.log('handleChange: result ', reader.result);
            this.fileData = reader.result.split(',')[1];
            if (this.isDebug) console.log('handleChange: fileData set ', this.fileData);
    
            this.sheetDataJson = XLSX.read(this.fileData, {cellDates: true});
            if (this.isDebug) console.log('handleChange: sheetDataJson set ', this.sheetDataJson);
    
            this.sheetData  = [];
            this.sheetDataJson.SheetNames.forEach(iter => {
                if (this.isDebug) console.log('handleChange: processing sheet ', iter);
                let iterDesc = this.extractSheet(iter);
                this.sheetData.push(iterDesc);
                if (this.isDebug) console.log('handleChange: iterDesc registered ', iterDesc);
            });
            if (this.isDebug) console.log('handleChange: sheetData init ', JSON.stringify(this.sheetData));

            this.isError = false;
            this.messageTitle = UPLOAD_SUCCESS_MSG.replace('{0}', file.name);
            this.messageDetails = UPLOAD_INFO_MSG;
            this.processStep = 2;
            spinner.classList.add('slds-hide');
            if (this.isDebug) console.log('handleChange: END');
        };
        if (this.isDebug) console.log('handleChange: triggering readAsDataURL ', reader);
        try {
            reader.readAsDataURL(file);
            if (this.isDebug) console.log('handleChange: file reading triggered');
        }
        catch (error) {
            this.isError = true;
            this.messageTitle = INIT_FAILURE_MSG;
            this.messageDetails = this.formatError(error);
            spinner.classList.add('slds-hide');
            console.error('handleChange: END KO / file read error ', JSON.stringify(error));
        }
    }

    handleTabActive(event) {
        /*if (this.isDebug) console.log('handleTabActive: START with ', event);
        if (this.isDebug) console.log('handleTabActive: target ', event.target);
        if (this.isDebug) console.log('handleTabActive: END');*/
    }

    handleBack(event) {
        if (this.isDebug) console.log('handleBack: START with ',event);

        this.processStep = 1;
        this.isError = false;
        this.messageTitle = null;
        this.messageDetails = null;
        this.importStatus = null;

        if (this.isDebug) console.log('handleBack: END');
    }

    handleImport(event) {
        if (this.isDebug) console.log('handleImport: START with ',event);

        let spinner = this.template.querySelector('lightning-spinner');
        if (this.isDebug) console.log('handleChange: spinner fetched ', spinner);
        spinner.classList.remove('slds-hide');

        this.isError = false;
        this.messageTitle = null;
        this.messageDetails = null;
        this.importStatus = null;

        let tabset = this.template.querySelector('lightning-tabset');
        if (this.isDebug) console.log('handleImport: tabset fetched ',tabset);

        let selectedSheet = tabset.activeTabValue;
        if (this.isDebug) console.log('handleImport: selectedSheet determined ',selectedSheet);

        let selectedData = this.sheetData.find(item => item.name === selectedSheet);
        this.selectedData = selectedData;
        if (this.isDebug) console.log('handleImport: selectedData found ',selectedData);

        if (selectedData.hasMultiExtId) {
            if (this.isDebug) console.log('handleImport: handling multi External ID Fields case');
            let extIdSelector = this.template.querySelector('lightning-combobox[data-name="' + selectedData.name + '"]');
            if (this.isDebug) console.log('handleImport: extIdSelector found ', extIdSelector);
            selectedData.extIdField = extIdSelector.value;
            if (this.isDebug) console.log('handleImport: extIdField updated with selection ', selectedData.extIdField);
        }

        let selectedValues = (this.maxRows ? (selectedData.values).slice(0, this.maxRows) : selectedData.values);
        if (this.isDebug) console.log('handleImport: selectedValues extracted with #items ', selectedValues.length);
        
        let importedValues = [];
        selectedValues.forEach(item => {
            if (this.isDebug) console.log('handleImport: processing item ',item);
            let newItem = {sobjectType: this.objectName};

            if (selectedData.hasRtLookup) {
                let rtName = item['RecordType.DeveloperName'];
                if (this.isDebug) console.log('handleImport: Looking for RecordType Developer Name ', rtName);
                newItem.RecordTypeId = this.rtMap[rtName];
                if (this.isDebug) console.log('handleImport: recordTypeId set ',item.RecordTypeId);
            }

            if ((this.lookupField) && (this.recordId)) {
                if (this.isDebug) console.log('handleImport: initialising lookupField ', this.lookupField);
                newItem[this.lookupField] = this.recordId;
            }

            selectedData.stdFields.forEach(iterField => {
                if (this.isDebug) console.log('handleImport: cloning iterField ',iterField);
                newItem[iterField] = item[iterField];
            });

            selectedData.relations.forEach(iterField => {
                if (item[iterField.name]) {
                    if (this.isDebug) console.log('handleImport: setting relation field ',iterField.name);
                    newItem[iterField.relation] = {sobjectType: iterField.object}
                    newItem[iterField.relation][iterField.externalId] = item[iterField.name];
                    if (newItem[iterField.lookup]) {
                        if (this.isDebug) console.log('handleImport: removing direct lookup field ',iterField.lookup);
                        delete newItem[iterField.lookup];
                    }
                }
                else {
                    if (this.isDebug) console.log('handleImport: ignoring null value relation field ',iterField.name);
                }
            });

            
            importedValues.push(newItem);
            if (this.isDebug) console.log('handleImport: newItem registered ', newItem);
        });
        if (this.isDebug) console.log('handleImport: importedValues init ', importedValues.length);

        let importRequest = {records: importedValues, allOrNone: this.isAllOrNone, keyField : selectedData.key};
        if ((selectedData.extIdField) && (this.importMode === 'upsert')) {
            importRequest.externalIdfield = selectedData.extIdField;
        }
        if (this.isDebug) console.log('handleImport: importRequest ready ', importRequest);
        this.importKey = selectedData.key;

        importRecords(importRequest)
        .then( (results) => {
            if (this.isDebug) console.log('handleImport: results received ', results);
            this.importStatus = results;
            this.isError = results.hasError;
            if (this.isDebug) console.log('handleImport: hasError ? ', results.hasError);

            if (results.hasError) {
                if (this.isDebug) console.log('handleImport: import failure');
                this.messageTitle = ((results.inserted || results.updated) ? IMPORT_PARTIAL_FAILURE_MSG : IMPORT_FAILURE_MSG);
            }
            else {
                if (this.isDebug) console.log('handleImport: import full success');
                this.messageTitle = IMPORT_SUCCESS_MSG;
            }

            this.processStep = 3;
            spinner.classList.add('slds-hide');
            if (this.isDebug) console.log('handleImport: END OK');
        })
        .catch( error => {
            this.messageTitle = IMPORT_FAILURE_MSG;
            this.messageDetails = this.formatError(error);
            this.isError = true;
            this.processStep = 3;
            spinner.classList.add('slds-hide');
            console.warn('handleImport: END KO ',error);
        });

        if (this.isDebug) console.log('handleImport: triggering import');
    }

    handleNavigate(event) {
        if (this.isDebug) console.log('handleNavigate: START with ',event);
        if (this.isDebug) console.log('handleNavigate: ID fetched ',event.target.value);
        
        let targetPage = {
            type: 'standard__recordPage',
            attributes: {
                objectApiName: this.objectName,
                recordId: event.target.value,
                actionName: 'view'
            }
        };
        if (this.isDebug) console.log('handleNavigate: targetPage init ',targetPage);

        this[NavigationMixin.Navigate](targetPage);
        if (this.isDebug) console.log('handleNavigate: END / navigation triggered');
    }

    handleDownload(event){
        if (this.isDebug) console.log('handleDownload: START with file name ', this.fileInfo?.name);
        if (this.isDebug) console.log('handleDownload: last importStatus ', this.importStatus);
        if (this.isDebug) console.log('handleDownload: last importKey ', this.importKey);

        if ((!this.fileInfo?.name) || (!this.importStatus)) {
            console.warn('handleDownload: END KO / invalid context');
            return;
        }

        let workbook = XLSX.utils.book_new();
        if (this.isDebug) console.log('handleDownload: selectedData to export ', JSON.stringify(this.selectedData));

        /*if (this.selectedData.values) {
            let selectedValues = (this.maxRows ? (this.selectedData.values).slice(0, this.maxRows) : this.selectedData.values);
            if (this.isDebug) console.log('handleDownload: adding selection tab ', JSON.stringify(selectedValues));
            let worksheet2 = XLSX.utils.json_to_sheet(selectedValues);
            XLSX.utils.book_append_sheet(workbook, worksheet2, "Source");
        }*/
        let results = [...this.selectedData.values];
        if (this.importStatus.creations) {
            if (this.isDebug) console.log('handleDownload: adding creation tab ', JSON.stringify(this.importStatus.creations));
            this.importStatus.creations.forEach(item => {
                if (this.isDebug) console.log('handleDownload: processing item ', JSON.stringify(item));
                let itemResult = results.find(itemR => itemR[this.importKey] === item.name);
                if (this.isDebug) console.log('handleDownload: itemResult found ', JSON.stringify(itemResult));
                itemResult[SUMMARY_STATUS] = 'inserted';
                itemResult[SUMMARY_DETAILS] = itemResult.id;
                if (this.isDebug) console.log('handleDownload: itemResult updated ', JSON.stringify(itemResult));
            });
            //let worksheet2 = XLSX.utils.json_to_sheet(this.importStatus.creations);
            //XLSX.utils.book_append_sheet(workbook, worksheet2, "Creations");
        }
        if (this.importStatus.updates) {
            if (this.isDebug) console.log('handleDownload: adding updates tab ', JSON.stringify(this.importStatus.updates));
            this.importStatus.updates.forEach(item => {
                if (this.isDebug) console.log('handleDownload: processing item ', JSON.stringify(item));
                let itemResult = results.find(itemR => itemR[this.importKey] === item.name);
                if (this.isDebug) console.log('handleDownload: itemResult found ', JSON.stringify(itemResult));
                itemResult[SUMMARY_STATUS] = 'updated';
                itemResult[SUMMARY_DETAILS] = item.id;
                if (this.isDebug) console.log('handleDownload: itemResult updated ', JSON.stringify(itemResult));
            });
            //let worksheet2 = XLSX.utils.json_to_sheet(this.importStatus.updates);
            //XLSX.utils.book_append_sheet(workbook, worksheet2, "Updates");
        }
        if (this.importStatus.failures) {
            if (this.isDebug) console.log('handleDownload: adding failure tab ', JSON.stringify(this.importStatus.failures));
            this.importStatus.failures.forEach(item => {
                if (this.isDebug) console.log('handleDownload: processing item ', JSON.stringify(item));
                let itemResult = results.find(itemR => itemR[this.importKey] === item.name);
                if (this.isDebug) console.log('handleDownload: itemResult found ', JSON.stringify(itemResult));
                itemResult[SUMMARY_STATUS] = 'failed';
                itemResult[SUMMARY_DETAILS] = item.error;
                if (this.isDebug) console.log('handleDownload: itemResult updated ', JSON.stringify(itemResult));
            });
            //let worksheet2 = XLSX.utils.json_to_sheet(this.importStatus.failures);
            //XLSX.utils.book_append_sheet(workbook, worksheet2, "Failures");
        }
        let worksheet = XLSX.utils.json_to_sheet(results);
        XLSX.utils.book_append_sheet(workbook, worksheet, SUMMARY_TAB);
        if (this.isDebug) console.log('handleDownload: workbook ready ', workbook);



        let outputFile = (this.fileInfo.name).replace(/\.[^/.]+$/, "") + '-status.xlsx';
        if (this.isDebug) console.log('handleDownload: outputFile name init ', outputFile);

        XLSX.writeFile(workbook, outputFile, { compression: true });
        if (this.isDebug) console.log('handleDownload: END / workbook exported');
    }

    //----------------------------------------------------------------
    // Utilities
    //----------------------------------------------------------------

    extractSheet = function(sheet) {
        if (this.isDebug) console.log('extractSheet: START for sheet ', sheet);

        let sheetDesc = {name:sheet};
        let sheetData = XLSX.utils.sheet_to_json(this.sheetDataJson.Sheets[sheet]);
        if (this.isDebug) console.log('extractSheet: sheetData extracted ', sheetData);

        if(sheetData?.length) {
            if (this.isDebug) console.log('extractSheet: registering sheet details ');
            let fieldDescs = this.getFieldDesc((sheetData)[0],sheetData.length);
            if (this.isDebug) console.log('extractSheet: fieldDescs extracted ',fieldDescs);

            sheetDesc = {
                ...sheetDesc,
                ...fieldDescs,
                values : sheetData,
                class : ((sheetData.length > 10) ? 'dataContainerLimit' : ''),
                countMsg : ROW_COUNT_MESSAGE.replace('{0}',sheetData.length)
            };

            if (sheetDesc.extIdField) {
                sheetDesc.extIdMsg = EXT_ID_MESSAGE.replace('{0}',sheetDesc.extIdField);
            }
        }
        else {
            if (this.isDebug) console.log('extractSheet: no sheet details to provide ');
        }
        if (this.isDebug) console.log('extractSheet: END with ', JSON.stringify(sheetDesc));
        return sheetDesc;
    }

    getFieldDesc = function(rowItem,rowCount) {
        if (this.isDebug) console.log('getFieldDesc: START with ', rowItem);

        let rowDesc = {columns: [], relations: [], stdFields: [], externalIds: [], ignored: [], key:null};
        for (let iter in rowItem) {
            if (this.isDebug) console.log('getFieldDesc: processing field', iter);
            if (this.isDebug) console.log('getFieldDesc: of value ', JSON.stringify(rowItem[iter]));
    
            if (iter === 'RecordType.DeveloperName') {
                if (this.isDebug) console.log('getFieldDesc: RT Name field displayed as string');
                rowDesc.columns.push({label:iter,fieldName:iter});
                rowDesc.hasRtLookup = true;
            }
            else if (iter.includes('.')) {
                if (this.isDebug) console.log('getFieldDesc: analysing relation field');

                let iterMap = {}
                let iterNameParts = iter.split('.');
                iterMap.name = iter;
                iterMap.relation = iterNameParts[0];

                let itemDesc = (Object.values(this.objectInfo.fields)).find( item => item.relationshipName === iterMap.relation);
                if (this.isDebug) console.log('getFieldDesc: itemDesc found ',itemDesc);

                if (!itemDesc) {
                    console.warn('getFieldDesc: Unknown relation name ',iter);
                    rowDesc.ignored.push({name:iter,reason:"Unknown relation name"});
                    continue;
                }
                iterMap.lookup = itemDesc.apiName;

                switch (iterNameParts.length) {
                    case 2:
                        if (this.isDebug) console.log('getFieldDesc: no object specified');
                        if (itemDesc.referenceToInfos.length != 1) {
                            console.warn('getFieldDesc: Object Name required for relation',iter);
                            rowDesc.ignored.push({name:iter,reason:"Object name required for relation"});
                            continue;
                        }
                        iterMap.object = (itemDesc.referenceToInfos)[0].apiName;
                        iterMap.externalId = iterNameParts[1];
                        break;
                    case 3:
                        if (this.isDebug) console.log('getFieldDesc: with object specified');
                        iterMap.object = iterNameParts[1];
                        iterMap.externalId = iterNameParts[2];
                        break;
                    default:
                        console.warn('getFieldDesc: Unsupported relation field name format ',iter);
                        rowDesc.ignored.push({name:iter,reason:"Wrong relation name syntax"});
                        continue;
                }
                rowDesc.relations.push(iterMap);
                if (this.isDebug) console.log('getFieldDesc: iterMap registered ',iterMap);

                rowDesc.columns.push({label:iter,fieldName:iter});
                if (this.isDebug) console.log('getFieldDesc: displayed as string');
            }
            else if (this.objectInfo.fields[iter]) {
                if (this.isDebug) console.log('getFieldDesc: matched standard field', iter);
                let iterDesc = this.objectInfo.fields[iter];
                if (this.isDebug) console.log('getFieldDesc: with desc ', iterDesc);

                if ((this.allowedFieldList) && (!this.allowedFieldList.includes(iter))) {
                    console.warn('getFieldDesc: standard field not allowed ', iter);
                    rowDesc.ignored.push({name:iter,reason:"Field not authorized"});
                    continue;
                }
                rowDesc.stdFields.push(iter);

                switch(iterDesc.dataType) {
                    case 'Boolean':
                        if (this.isDebug) console.log('getFieldDesc: displayed as boolean');
                        rowDesc.columns.push({label:iter,fieldName:iter,type:"boolean"});
                        break;
                    case 'Double':
                    case 'Integer':
                    case 'Long':
                        if (this.isDebug) console.log('getFieldDesc: displayed as numeric');
                        rowDesc.columns.push({label:iter,fieldName:iter,type:"number"});
                        break;
                    case 'Percent':
                        if (this.isDebug) console.log('getFieldDesc: displayed as percent');
                        rowDesc.columns.push({label:iter,fieldName:iter,type:"percent",typeAttributes:{step: '1'}});
                        break;
                    case 'Currency':
                        if (this.isDebug) console.log('getFieldDesc: displayed as currency');
                        rowDesc.columns.push({label:iter,fieldName:iter,type:"currency",typeAttributes:{currencyCode: CURRENCY}});
                        break;
                    case 'DateTime':
                    case 'Date':
                        if (this.isDebug) console.log('getFieldDesc: displayed as date');
                        rowDesc.columns.push({label:iter,fieldName:iter,type:"date"});
                        break;
                    default:
                        if (this.isDebug) console.log('getFieldDesc: displayed as string');
                        rowDesc.columns.push({label:iter,fieldName:iter});
                }

                if (this.isDebug) console.log('getFieldDesc: registering external ID field',this.externalIdFields);
                if (this.externalIdFields?.data?.includes(iter)) {
                    if (this.isDebug) console.log('getFieldDesc: registering external ID field');
                    rowDesc.externalIds.push({label:iter,value:iter});
                    rowDesc.key = iter;
                }
            }
            else {
                console.warn('getFieldDesc: unknown standard field', iter);
                rowDesc.ignored.push({name:iter,reason:"Field unknown"});
                continue;
            }
        }

        if (!rowDesc.key) {
            if (this.isDebug) console.log('getFieldDesc: no external ID field found');
            rowDesc.key = (rowDesc.columns)[0]?.fieldName;
            if (this.isDebug) console.log('getFieldDesc: default key set to ', rowDesc.key);
        }

        rowDesc.hasMultiExtId = ((this.importMode === 'upsert') && (rowDesc.externalIds.length > 1));
        rowDesc.extIdField = ((this.importMode === 'upsert') && (rowDesc.externalIds.length > 0) ? (rowDesc.externalIds)[0].value : null);

        rowDesc.tooManyRows = (rowCount > this.maxRows);
        rowDesc.hasWarnings = ((rowDesc.ignored.length > 0) || rowDesc.tooManyRows);

        if (this.isDebug) console.log('getFieldDesc: rowDesc init ', JSON.stringify(rowDesc));
        if (this.isDebug) console.log('getFieldDesc: END');
        return rowDesc;
    }

    formatError = function(error) {
        if (this.isDebug) console.log('formatError: START with ',error);

        let regexp = /message":"(.*?)"/gi;
        let msgList = (JSON.stringify(error)).match(regexp);
        if (this.isDebug) console.log('formatError: messageList extracted ', msgList);
  
        let errorMsg = msgList?.reduce((previous ,current) => {
            let newCurrent = current.slice(10,-1);
            if (previous) return previous + '\n' + newCurrent;
                return newCurrent;
            },'');
        if (this.isDebug) console.log('formatError: END returning ', errorMsg);
        return errorMsg;
    }
}