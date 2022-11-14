/***
* @description  Lightning controller to provide metadata information (external lookup fields) and execute upsert DMLs
*				for the sfpegExcelLoaderCmp LWC component.
* @author       P-E GROS
* @date         Nov. 2022
* @see PEG_EXCEL package (https://github.com/pegros/PEG_EXCEL)
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

@SuppressWarnings('PMD.ClassNamingConventions')
public with sharing class sfpegExcelLoader_CTL {

	/***
	* @description  Simple method to fetch the API names of all external ID fields defined on a given Object.
	* @param        objectName		API Name of the Object
	* @return       list<String>	List of API names for all external ID fields of the Object (may be empty).
	* @exception    AuraHandledException	Raised if Object not found.
	***/
	@AuraEnabled(cacheable=true)
	public static list<String> getExternalIdFields(final string objectName) {
		System.debug('getExternalIdFields: START');

		if (String.isBlank(objectName)) {
			System.debug(LoggingLevel.ERROR,'getExternalIdFields: END KO / no objectName provided');
			throw new AuraHandledException('Object API Name mandatory when fetching external ID fields!');
		}

        try {
			System.debug('getExternalIdFields: looking desc for object ' + objectName);
			Schema.SObjectType objectType = Schema.getGlobalDescribe().get(objectName);

			if (objectType == null) {
				System.debug(LoggingLevel.ERROR,'getExternalIdFields: END KO / object not found with name ' + objectName);
				throw new AuraHandledException('Object API Name mandatory when fetching external ID fields!');
			}

			Map<String,Schema.SObjectField> objectFields = objectType.getDescribe().fields.getMap();
			List<String> extIdFields= new List<String>();
			for (Schema.SObjectField iter : objectFields.values()) {
				Schema.DescribeFieldResult iterDesc = iter.getDescribe();

				if (iterDesc.isExternalId()) {
					System.debug('getExternalIdFields: registering externalId field ' + iterDesc.getName());
					extIdFields.add(iterDesc.getName());
				}
				/*else {
					System.debug(LoggingLevel.FINE,'getExternalIdFields: ignoring field ' + iterDesc.getName());
				}*/
			}
			System.debug('getExternalIdFields: externalId fields fetched ' + extIdFields);

			System.debug('getExternalIdFields: END with #fields ' + extIdFields.size());
			return extIdFields;
		}
		catch (Exception e) {
			System.debug(LoggingLevel.ERROR,'getExternalIdFields: END KO with exception ' + e.getMessage());
            throw new AuraHandledException('External ID fields fetching failed: ' + e.getMessage());
		}
	}

	/***
	* @description	Method to execute an upsert on a list of SObject with various possible variants.
	*               If allOrNone is set to true, the transaction rolls back if any error occurs (and 
	*				and Exception is raised). Otherwise, upsert is executed in best effort and the
	*				detailed status for each record is returned. 
	*				If externalIdfield is set, the upsert operation is executed with this field specified
	*				as record idenfitier (this executes a real upsert vs an insert). When multiple external
	*				ID fields are available on an object and set on records, it also defines the actual one
	*				to use for the upsert operation.
	*				
	* @param        records					List of SObject records to upsert
	* @param        allOrNone				Flag to activate rollback at first error (instead of best effort mode)
	* @param        keyField				API Name of the field used as key field (for result display) 
	* @param        externalIdfield			API Name of the field used as external ID in the upsert operation 
	* @return       Map<String,Object>		Map of results of the upsert operation : 3 possible entries respectively
	*										for creations, updates and failures, each containing a list of
	*										Maps<String, Object> with the record, the id, the name (from the keyField)
	*										and/or the error depending on the case.
	* @exception    AuraHandledException	Raised upon DML (when allOrNone set to true) or any miscellaneous processing failure
	***/
	@AuraEnabled(cacheable=false)
	public static Map<String,Object> importRecords(final List<SObject> records, final Boolean allOrNone, final String keyField, final String externalIdfield) {
		System.debug('importRecords: START with #records ' + records?.size());
		System.debug('importRecords: allOrNone provided ' + allOrNone);
		System.debug('importRecords: keyField provided ' + keyField);
		System.debug('importRecords: externalIdfield provided ' + externalIdfield);
		//System.debug('importRecords: 1st record ' + records[0]);

		if ((records == null) || (records.isEmpty())) {
			System.debug('importRecords: END OK / no record to import');
			return null;
		}

		Schema.SObjectField extIdDesc = null;
		if (String.isNotBlank(externalIdfield)) {
			Schema.SObjectType objectDesc = (records.get(0)).getSObjectType();
			System.debug('importRecords: objectDesc fetched ' + objectDesc);
			extIdDesc = objectDesc.getDescribe().fields.getMap().get(externalIdfield);
			System.debug('importRecords: extIdDesc fetched ' + extIdDesc);
		}

        try {
            //insert records;
			List<Database.upsertResult> results;
			if (extIdDesc == null) {
				System.debug('importRecords: direct insert');
				results = database.upsert(records,allOrNone);
			}
			else {
				System.debug('importRecords: upsert with externalId ');
				results = database.upsert(records,extIdDesc,allOrNone);
			}
			System.debug('importRecords: results returned ' + results);

			List<Map<String,Object>> newRecords =  new List<Map<String,Object>>();
			List<Map<String,Object>> updatedRecords =  new List<Map<String,Object>>();
			List<Map<String,Object>> failedRecords =  new List<Map<String,Object>>();
			Boolean hasError = false;
			Integer index = 0;
        	for (SObject iter : records) {
            	System.debug(LoggingLevel.FINEST,'importRecords: processing item ' + iter);
            	Database.UpsertResult iterResult = results.get(index);
            	System.debug(LoggingLevel.FINEST,'importRecords: result fetched ' + iterResult);
            	if (iterResult.isSuccess()) {
					Map<String,Object> iterMap = new Map<String,Object>{
						'record' => iter,
						'id' => iterResult.getId(),
						'name' => iter.get(keyField)
					};
					if (iterResult.isCreated()) {
						System.debug(LoggingLevel.FINEST,'importRecords: new row registered with Id ' + iterResult.getId());
						newRecords.add(iterMap);
					}
					else {
						System.debug(LoggingLevel.FINEST,'importRecords: updated row registered with Id ' + iterResult.getId());
						updatedRecords.add(iterMap);
					}            	
	            }
            	else {
					hasError = true;
                	Database.Error[] iterErrors = iterResult.getErrors();
					Map<String,Object> iterMap = new Map<String,Object>{
						'record' => iter,
						'name' => iter.get(keyField),
						'error' => (iterErrors[0]).getMessage()
					};
					failedRecords.add(iterMap);
					System.debug(LoggingLevel.FINEST,'importRecords: failed row registered with error ' + iterMap);
				}
				index += 1;
            }
			System.debug('importRecords: all results processed');

			Map<String,Object> resultMap = new Map<String,Object>{'hasError' => hasError};
			System.debug('importRecords: hasError status registered ' + hasError);
			if (!newRecords.isEmpty()) {
				resultMap.put('creations',newRecords);
				System.debug('importRecords: creations registered ' + newRecords);
			}
			if (!updatedRecords.isEmpty()) {
				resultMap.put('updates',updatedRecords);
				System.debug('importRecords: updates registered ' + updatedRecords);
			}
			if (!failedRecords.isEmpty()) {
				resultMap.put('failures',failedRecords);
				System.debug('importRecords: failures registered ' + failedRecords);
			}

            System.debug('importRecords: END OK');
			return resultMap;
        }
		catch (DmlException e) {
			System.debug(LoggingLevel.WARN, 'importRecords : DML exception raised ' + e);
			System.debug(LoggingLevel.WARN, 'importRecords : END KO / returning DML error ' + e.getDmlMessage(0));
			throw new AuraHandledException(e.getDmlMessage(0));
		}
        catch(Exception e){
            System.debug(LoggingLevel.ERROR,'importRecords: END KO with misc. exception ' + e.getMessage());
            throw new AuraHandledException(e.getMessage());
        }
    }


}
