import React from 'react';

import * as cornerstone3D from '@cornerstonejs/core';
import dcmjs from 'dcmjs';
import getFilteredCornerstoneToolState from '../getFilteredCornerstoneToolState';
import { ConfigPoint } from 'config-point';

const { MeasurementReport } = dcmjs.adapters.Cornerstone3D;
const { metaData, utilities } = cornerstone3D;

/**
 *
 * @param measurementData An array of measurements from the measurements service
 * that you wish to serialize.
 * @param options Naturalized DICOM JSON headers to merge into the displaySet.
 *
 */

const _generateReport = (measurementData, options = {}) => {
  const filteredToolState = getFilteredCornerstoneToolState(measurementData);

  const report = MeasurementReport.generateReport(
    filteredToolState,
    metaData,
    utilities.worldToImageCoords
  );

  const { dataset } = report;

  // Add in top level series options
  Object.assign(dataset, options);

  return dataset;
};

/**
 *
 * @param {*} servicesManager
 * @param {*} dataSource
 * @param {*} measurements
 * @param {*} options
 * @returns {string[]} displaySetInstanceUIDs
 */
async function createReportAsync(
  servicesManager,
  commandsManager,
  dataSource,
  measurements,
  options
): Promise<void> {
  const { UINotificationService, UIDialogService } = servicesManager.services;
  const loadingDialogId = UIDialogService.create({
    showOverlay: true,
    isDraggable: false,
    centralize: true,
    // TODO: Create a loading indicator component + zeplin design?
    content: Loading,
  });

  const naturalizedReport = _generateReport(measurements, options);
  const { SeriesInstanceUID, SOPInstanceUID } = naturalizedReport;

  const { storeToAPI = true, storeToDICOM = true } =
    ConfigPoint.getConfig('reportStorage') || {};

  try {
    if (!storeToAPI && !storeToDICOM) {
      throw new Error('Report storage not configured ');
    }

    if (storeToAPI) {
      commandsManager.runCommand('initiateExternalAlgorithm', {
        name: 'Store Results to backend API',
        endpointName: 'StoreReport',
        algorithm: {
          algorithmName: 'StoreReport',
          version: '0.0.1',
        },
        seriesInstanceUID: SeriesInstanceUID,
        sopInstanceUID: SOPInstanceUID,
      });
    }

    if (storeToDICOM) {
      await commandsManager.runCommand(
        'labelDIStoreMeasurements',
        {
          naturalizedReport,
          dataSource,
        },
        'CORNERSTONE'
      );

      UINotificationService.show({
        title: 'Save Report to DICOM store',
        message: 'Measurements saved successfully to DICOM store.',
        type: 'success',
      });
    }
  } catch (error) {
    UINotificationService.show({
      title: 'Save Report to DICOM store',
      message: error.message || 'Failed to store measurements.',
      type: 'error',
    });
  } finally {
    UIDialogService.dismiss({ id: loadingDialogId });
  }
}

function Loading() {
  return <div className="text-primary-active">Loading...</div>;
}

export default createReportAsync;
