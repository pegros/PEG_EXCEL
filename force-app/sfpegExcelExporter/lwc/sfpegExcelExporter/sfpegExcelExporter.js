/***
* @author P-E GROS
* @date   Sept. 2024
* @description  LWC Component to handle PEG_LIST notifications to export a 
*               list of elements in an Excel spreadsheet.
*               It leverages some capabilities provided by the SheetJs
*               opensource library (mini version)
* @see PEG_EXCEL package (https://github.com/pegros/PEG_EXCEL)
* @see SheetJs library (https://sheetjs.com/)
* @see PEG_LIST package (https://github.com/pegros/PEG_LIST)
*
* Legal Notice
* 
* MIT License
* 
* Copyright (c) 2024-present pegros
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

import { LightningElement,api,wire } from 'lwc';
// To load Excel JS library
import { loadScript }   from 'lightning/platformResourceLoader';
import sheetjs          from '@salesforce/resourceUrl/sfpegSheetJs';
// To receive the notifications
import { subscribe, unsubscribe, MessageContext } from 'lightning/messageService';
import sfpegCustomAction    from '@salesforce/messageChannel/sfpegCustomAction__c';     // for custom LWC component invocation (outgoing)
// To display errors
import toast    from 'lightning/toast';


export default class SfpegExcelExporter extends LightningElement {

    //----------------------------------------------------------------
    // Main configuration fields (for App Builder)
    //----------------------------------------------------------------
    @api notifChannel;
    @api isDebug = false;       // Debug mode activation

    //----------------------------------------------------------------
    // Internal technical properties
    //----------------------------------------------------------------
    
    // To receive notification    
    notificationSubscription = null;
    @wire(MessageContext)
    messageContext;

    //----------------------------------------------------------------
    // Component Initialisation
    //----------------------------------------------------------------

    async connectedCallback(){
        if (this.isDebug) console.log('connected: START ExcelExporter with ', this.notifChannel);

        if (this.isDebug) console.log('connected: before await ', Date.now());
        await loadScript(this, sheetjs);
        if (this.isDebug) console.log('connected: after await ', Date.now());
        if (this.isDebug) console.log('connected: SheetJs version fetched ', XLSX.version);

        this.notifChannel = this.notifChannel || 'sfpegExcelExport';
        if (this.isDebug) console.log('connected: subscribing to notification channel ');
        if (!this.notificationSubscription) {
            this.notificationSubscription = subscribe(
                this.messageContext,
                sfpegCustomAction,
                (message) => this.handleNotification(message));
                //{ scope: APPLICATION_SCOPE });
        }
         else {
            if (this.isDebug) console.log('connected: notification channel already subscribed ');
        }

        if (this.isDebug) console.log('connected: END ExcelExporter');
    }

    disconnectedCallback() {
        if (this.isDebug) console.log('disconnected: START ExcelExporter with ',this.notifChannel);

        if (this.notificationSubscription) {
            if (this.isDebug) console.log('disconnected: unsubscribing notification channel');
            unsubscribe(this.notificationSubscription);
            this.notificationSubscription = null;
        }
        else {
            if (this.isDebug) console.log('disconnected: no notification channel to unsubscribe');
        }

        if (this.isDebug) console.log('disconnected: END ExcelExporter');
    }

    //----------------------------------------------------------------
    // Event Handlers
    //----------------------------------------------------------------
    
    handleNotification(message) {
        if (this.isDebug) console.log('handleNotification: START ExcelExporter with message ',JSON.stringify(message));

        if (message.channel) {
            if (message.channel === this.notifChannel) {
                if (this.isDebug) console.log('handleNotification: triggering export');
                this.handleExport(message.action,message.context);
                if (this.isDebug) console.log('handleNotification: END ExcelExporter');
            }
            else {
                if (this.isDebug) console.log('handleNotification: END ExcelExporter / ignoring notification ');
            }
        }
        else {
            console.warn('handleNotification: END KO ExcelExporter / no channel specified in notification');
        }
    }       

    //----------------------------------------------------------------
    // Utilities
    //----------------------------------------------------------------
    
    handleExport = function(configuration,records) {
        if (this.isDebug) console.log('handleExport: START with config ', JSON.stringify(configuration));
        if (this.isDebug) console.log('handleExport: and #records ', records?.length);

        if ((!configuration) || (!records)) {
            console.warn('handleExport: END KO / invalid configuration ',configuration);
            console.warn('handleExport: or no record transmission ',records);
            toast.show({
                label: 'Configuration failure',
                message: 'Incorrect Excel export configuration or record selection',
                mode: 'dismissible',
                variant: 'error'
            }, this);
            return;
        }

        if (!records?.length) {
            console.warn('handleExport: END KO / no record');
            toast.show({
                label: 'Export failure',
                message: 'There is no record to export',
                mode: 'dismissible',
                variant: 'warning'
            }, this);
            return;
        }

        if (this.isDebug) console.log('handleExport: exporting records ', JSON.stringify(records));

        let options = (configuration?.header ? {header: configuration?.header} : null);
        if (this.isDebug) console.log('handleExport: options init ', JSON.stringify(options));
        
        let worksheet = XLSX.utils.json_to_sheet(records, options);
        if (this.isDebug) console.log('handleExport: worksheet data init ', JSON.stringify(worksheet));

        let workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, (configuration.tabName || "Records"));
        if (this.isDebug) console.log('handleExport: worksheet appended to workbook', workbook);

        //type: 'array',
        XLSX.writeFile(workbook, (configuration.fileName || "Export.xlsx"), { bookType: "xlsx",  compression: true });
        if (this.isDebug) console.log('handleExport: END / workbook exported');
    }
}