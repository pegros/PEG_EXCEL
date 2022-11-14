/***
* @description  Test class for the sfpegExcelLoader_CTL class.
* @author       P-E GROS
* @date         Nov. 2022
* @see          sfpegExcelLoader_CTL
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

@isTest
@SuppressWarnings('PMD.ClassNamingConventions')
public class sfpegExcelLoader_TST {
    
    /***
	* @description Initializes the test context.
	***/
	@testSetup
	static void testSetup() {
		System.debug('testSetup: START');

		String currentUserId = UserInfo.getUserId();
		System.debug('testSetup: currentUserId fetched ' + currentUserId);

		Map<ID,PermissionSet> sfpegPSets = new Map<ID,PermissionSet>([SELECT Id, Name FROM PermissionSet WHERE Name LIKE 'sfpeg%']);
		System.debug('testSetup: sfpegPSets fetched ' + sfpegPSets);

		List<PermissionSetAssignment> currentAssignments = [	select PermissionSetId from PermissionSetAssignment
																where AssigneeId = :currentUserId and PermissionSetId in :sfpegPSets.keySet()];
		System.debug('testSetup: currentAssignments fetched ' + currentAssignments);
		for (PermissionSetAssignment iter : currentAssignments) {
			System.debug('testSetup: removing PermissionSet ' + iter.PermissionSetId);
			sfpegPSets.remove(iter.PermissionSetId);
		}
		System.debug('testSetup: sfpegPSets revised ' + sfpegPSets);

		List<PermissionSetAssignment> newAssignments = new List<PermissionSetAssignment>();
		for (PermissionSet iter : sfpegPSets.values()) {
			System.debug('testSetup: sfpegPSets processing PSet ' + iter);
			newAssignments.add(new PermissionSetAssignment(AssigneeId = currentUserId, PermissionSetId = iter.Id));
		}
		System.debug('testSetup: newAssignments init ' + newAssignments);

		insert newAssignments;
		System.debug('testSetup: newAssignments inserted ' + newAssignments);

		System.debug('testSetup: END');
	}


	/***
	* @description  Test method for the sfpegExcelLoader_CTL class, checking the "getExternalIdFields" method
	*               including all error cases. 
	***/
	@isTest
	static void testGetExternalIdFields() {
		System.debug('testGetExternalIdFields: START');
		Test.startTest();

		try {
			sfpegExcelLoader_CTL.getExternalIdFields(null);
			System.debug(LoggingLevel.Error,'testGetExternalIdFields: no exception raised for no object name');
			System.assert(false);
		}
		catch (Exception e) {
			System.debug('testGetExternalIdFields: proper exception raised for no object name ' + e.getMessage());
			System.assert(true);
		}

        try {
			sfpegExcelLoader_CTL.getExternalIdFields('DUMMY_OBJECT');
			System.debug(LoggingLevel.Error,'testGetExternalIdFields: no exception raised for invalid object name');
			System.assert(false);
		}
		catch (Exception e) {
			System.debug('testGetExternalIdFields: proper exception raised for invalid object name ' + e.getMessage());
			System.assert(true);
		}

		try {
			List<String> extIdFields = sfpegExcelLoader_CTL.getExternalIdFields('Account');
			System.debug('testGetExternalIdFields: fields found for standard Account object found ' + extIdFields);
			System.assert(true);
		}
		catch (Exception e) {
			System.debug(LoggingLevel.Error,'testGetExternalIdFields: fields ID for standard Account object not found ' + e.getMessage());
			System.assert(false);
		}

		Test.stopTest();
		System.debug('testGetExternalIdFields: END');
	}


	/***
	* @description  Test method for the sfpegExcelLoader_CTL class, checking the "importRecords" method
    *               including all error cases.
	***/

	@isTest
	static void testImportRecords() {
		System.debug('testImportRecords: START');
		Test.startTest();

        // Empty list case
		System.debug('testImportRecords: TEST OK - empty case');

        try {
			Map<String,Object> result = sfpegExcelLoader_CTL.importRecords(null,false,null,null);
			System.assertEquals(null,result,'testImportRecords: result on empty record list import is not null');
			System.debug('testExecuteDML: result on empty record list should is null');
		}
		catch (Exception e) {
			System.debug(LoggingLevel.Error,'testImportRecords: unexpected error raised on empty upsert ' + e.getMessage());
			System.assert(false);
		}


		// Standard allOrNone case
		System.debug('testImportRecords: TEST OK - allOrNon case');

		List<sObject> rcdList = new List<sObject>();
		sfpegTestObject__c newRcd1 = new sfpegTestObject__c(Name = 'Test #1', ExternalId__c = 'Test #1');
		rcdList.add(newRcd1);
		sfpegTestObject__c newRcd2 = new sfpegTestObject__c(Name = 'Test #2', ExternalId__c = 'Test #2');
		rcdList.add(newRcd2);

		try {
			Map<String,Object> result = sfpegExcelLoader_CTL.importRecords(rcdList, false, 'Name', null);
			System.assertEquals(null,result?.get('errors'),'testImportRecords: result on record list contains errors');
			System.debug('testImportRecords: result on record list contains no error');
		}
		catch (Exception e) {
			System.debug(LoggingLevel.Error,'testImportRecords: unexpected error raised on record list import ' + e.getMessage());
			System.assert(false);
		}


		// Error with bad external Id field
		System.debug('testImportRecords: TEST KO - Bad External ID field');

		rcdList = new List<sObject>();
		newRcd1 = new sfpegTestObject__c(Name = 'Test #1');
		rcdList.add(newRcd1);
		newRcd2 = new sfpegTestObject__c(Name = 'Test #2');
		rcdList.add(newRcd2);

		try {
			Map<String,Object> result = sfpegExcelLoader_CTL.importRecords(rcdList, true, 'Name', 'CreatedDate');
			System.debug(LoggingLevel.Error,'testImportRecords: no error raised with wrong external ID field');
			System.assert(false);
		}
		catch (Exception e) {
			System.debug('testImportRecords: error properly raised with bad external ID field ' + e.getMessage());
			System.assert(true);
		}



		// bestEffort case with external Id field
		System.debug('testImportRecords: TEST OK - best effort case');

		rcdList = new List<sObject>();
		newRcd1 = new sfpegTestObject__c(Name = 'Test #1', ExternalId__c = 'Test #1');
		rcdList.add(newRcd1);
		newRcd2 = new sfpegTestObject__c(Name = 'Test #2', ExternalId__c = 'Test #2');
		rcdList.add(newRcd2);
		sfpegTestObject__c newRcd3 = new sfpegTestObject__c(Name = 'Test #3', ExternalId__c = 'Test #3');
		rcdList.add(newRcd3);
		sfpegTestObject__c newRcd4 = new sfpegTestObject__c(Name = 'sfpegExcelLoaderError', ExternalId__c = 'Test #4');
		rcdList.add(newRcd4);

		try {
			Map<String,Object> result = sfpegExcelLoader_CTL.importRecords(rcdList, false, 'Name', 'ExternalId__c');
			System.debug('testImportRecords: result on record list contains no error');
			System.assert(true);
		}
		catch (Exception e) {
			System.debug(LoggingLevel.Error,'testImportRecords: unexpected error raised on record list import (with ext ID) ' + e.getMessage());
			System.assert(false);
		}

		// Error with DML exception (allOrNone)
		System.debug('testImportRecords: TEST KO - DML Exception with allOrNone');

		rcdList = new List<sObject>();
		newRcd1 = new sfpegTestObject__c(Name = 'Test #1', ExternalId__c = 'Test #1');
		rcdList.add(newRcd1);
		newRcd4 = new sfpegTestObject__c(Name = 'sfpegExcelLoaderError', ExternalId__c = 'Test #4');
		rcdList.add(newRcd4);

		try {
			Map<String,Object> result = sfpegExcelLoader_CTL.importRecords(rcdList, true, 'Name', 'ExternalId__c');
			System.debug(LoggingLevel.Error,'testImportRecords: no error raised on allOrNone DML error');
			System.assert(false);
		}
		catch (Exception e) {
			System.debug('testImportRecords: error properly raised on allOrNone DML error ' + e.getMessage());
			System.assert(true);
		}

		Test.stopTest();
		System.debug('testImportRecords: END');
	}

}
