import * as cornerstone3D from '@cornerstonejs/core';
import * as cornerstone3DTools from '@cornerstonejs/tools';
import dcmjs from 'dcmjs';
import getLatestSRInstanceFromStudy from './getLatestSRInstanceFromStudy';
import FiducialTool from '../../tools/FiducialTool';

const PROBE_TOOL_NAME = cornerstone3DTools.ProbeTool.toolName;
const FIDUCIAL_TOOL_NAME = FiducialTool.toolName;
// Note: this doesn't cover everything, but it captures what we currently need.
const IMAGING_MODALITIES = ['MR', 'CT', 'PT', 'NM'];

const { MeasurementReport } = dcmjs.adapters.Cornerstone3D;

function getDisplaySetBySeriesInstanceUid(
  DisplaySetService,
  seriesInstanceUid
) {
  const displaySets = DisplaySetService.getDisplaySetsForSeries(
    seriesInstanceUid
  );

  return displaySets[0];
}

export default async function readSR(
  { extensionManager, servicesManager },
  { study, seriesInstanceUid }
) {
  const { DisplaySetService } = servicesManager.services;
  // If the seriesInstanceUid is specified, grab that series, otherwise get the latest SR.
  const dataset =
    seriesInstanceUid !== undefined
      ? getDisplaySetBySeriesInstanceUid(DisplaySetService, seriesInstanceUid)
      : getLatestSRInstanceFromStudy(study);

  if (!dataset) {
    // No SRs, so don't load one!
    return;
  }

  // dcm4chee and other PACS don't return full GraphicData in the header requests (bulk data URIs in each), so we need to fetch the full SR from PACS by instance.
  const dataSources = extensionManager.getDataSources();

  if (!dataSources.length) {
    throw new Error('datasource not found');
  }

  // Assume only one datasource, as that is all this is supported in OHIF right now.
  const dataSource = dataSources[0];

  const { StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID } = dataset;

  // Sanity check if seriesInstanceUid was specified.
  if (
    seriesInstanceUid !== undefined &&
    seriesInstanceUid !== SeriesInstanceUID
  ) {
    console.warn(
      'The instance found has a different SeriesInstanceUID to the one specified.'
    );
  }

  const srDataset = await dataSource.retrieve.instance.part10({
    StudyInstanceUID,
    SeriesInstanceUID,
    SOPInstanceUID,
  });

  const sopInstanceUIDToImageIdMap = getSOPInstanceUIDToImageIdMap(
    DisplaySetService,
    study
  );

  const storedMeasurementByAnnotationType = MeasurementReport.generateToolState(
    srDataset,
    // NOTE: we need to pass in the imageIds to dcmjs since the we use them
    // for the imageToWorld transformation. The following assumes that the order
    // that measurements were added to the display set are the same order as
    // the measurementGroups in the instance.
    sopInstanceUIDToImageIdMap, // TODO JAMES -> We need to swap how this is done to use a map.
    cornerstone3D.utilities.imageToWorldCoords,
    cornerstone3D.metaData
  );

  // Map probe to Fiducial
  if (storedMeasurementByAnnotationType[PROBE_TOOL_NAME]) {
    const fiducialData = storedMeasurementByAnnotationType[PROBE_TOOL_NAME];

    fiducialData.forEach(data => {
      data.annotation.metadata.toolName = FIDUCIAL_TOOL_NAME;
    });

    storedMeasurementByAnnotationType[FIDUCIAL_TOOL_NAME] = fiducialData;
    delete storedMeasurementByAnnotationType[PROBE_TOOL_NAME];
  }

  return storedMeasurementByAnnotationType;
}

function getSOPInstanceUIDToImageIdMap(DisplaySetService, study) {
  const { series } = study;
  const sopInstanceUIDToImageIdMap = {};

  const imagingSeries = series.filter(aSeries =>
    IMAGING_MODALITIES.includes(aSeries.Modality)
  );

  imagingSeries.forEach(aSeries => {
    const displaySet = DisplaySetService.getDisplaySetsForSeries(
      aSeries.SeriesInstanceUID
    );

    // Note: we don't currently have multiple imageSets for any
    // imaging displaySet.
    const imageSet = displaySet[0];

    imageSet.images.forEach(image => {
      sopInstanceUIDToImageIdMap[image.SOPInstanceUID] = image.imageId;
    });
  });

  return sopInstanceUIDToImageIdMap;
}
