import React from 'react';
import { DicomMetadataStore } from '@ohif/core';

import * as cornerstone3D from '@cornerstonejs/core';
import dcmjs from 'dcmjs';
import { ConfigPoint } from 'config-point';
import getFilteredCornerstoneToolState from '../../../../ucalgary-extension/src/utils/getFilteredCornerstoneToolState';

const { MeasurementReport } = dcmjs.adapters.Cornerstone3D;
const { metaData, utilities } = cornerstone3D;

/**
 *
 * @param measurementData An array of measurements from the measurements service
 * that you wish to serialize.
 * @param options Naturalized DICOM JSON headers to merge into the displaySet.
 *
 */

/**
 *
 * @param {*} servicesManager
 * @param {*} dataSource
 * @param {*} measurements
 * @param {*} options
 * @returns {string[]} displaySetInstanceUIDs
 */
async function createReportAsync({
  servicesManager,
  // commandsManager,
  // dataSource,
  getReport,
  // measurements,
  reportType = 'measurement',
  //options,
  storeAPI,
}) {
  const { displaySetService, uiNotificationService, uiDialogService } = servicesManager.services;
  const loadingDialogId = uiDialogService.create({
    showOverlay: true,
    isDraggable: false,
    centralize: true,
    content: Loading,
  });

  try {
    const naturalizedReport = await getReport(); //does the same thing as _generateReport in V2

    // The "Mode" route listens for DicomMetadataStore changes
    // When a new instance is added, it listens and
    // automatically calls makeDisplaySets
    DicomMetadataStore.addInstances([naturalizedReport], true);

    const displaySet = displaySetService.getMostRecentDisplaySet();

    const displaySetInstanceUID = displaySet.displaySetInstanceUID;

    const { storeToAPI = true, storeToDICOM = true } = ConfigPoint.getConfig('reportStorage') || {};

    if (!storeToAPI && !storeToDICOM) {
      throw new Error('Report storage not configured ');
    }

    if (storeToAPI) {
      await storeAPI();
    }

    // if (storeToAPI) {
    //   commandsManager.runCommand('initiateExternalAlgorithm', {
    //     name: 'Store Results to backend API',
    //     endpointName: 'StoreReport',
    //     algorithm: {
    //       algorithmName: 'StoreReport',
    //       version: '0.0.1',
    //     },
    //     seriesInstanceUID: SeriesInstanceUID,
    //     sopInstanceUID: SOPInstanceUID,
    //   });
    // }

    // if (storeToDICOM) { //does the same thing as storeMeasurements in cornerstone-dicom-sr commandsModule 'storeMeasurements'
    //   await commandsManager.runCommand(
    //     'labelDIStoreMeasurements', //In the ucalgary-extension commandsModule. Calls storeMeasurements
    //     {
    //       naturalizedReport,
    //       dataSource,
    //     },
    //     'CORNERSTONE'
    //   );
    // }

    uiNotificationService.show({
      title: 'Save Report',
      message: `${reportType} saved successfully to DICOM store`,
      type: 'success',
    });

    return [displaySetInstanceUID];
  } catch (error) {
    uiNotificationService.show({
      title: 'Save Report',
      message: error.message || `Failed to store ${reportType}`,
      type: 'error',
    });
  } finally {
    uiDialogService.dismiss({ id: loadingDialogId });
  }
}

function Loading() {
  return <div className="text-primary-active">Loading...</div>;
}

export default createReportAsync;
