import { PlanarFreehandROITool } from '@cornerstonejs/tools';
import { metaData, utilities } from '@cornerstonejs/core';
import dcmjs from 'dcmjs';
import { FIDUCIAL_TOOL_NAME } from '../../tools/FiducialTool';
import { addMeasurements } from '../adapters';

const { CodeScheme: Cornerstone3DCodingScheme } = dcmjs.adapters.Cornerstone3D;

const { imageToWorldCoords } = utilities;

const PLANAR_FREEHAND_ROI_TOOL_NAME = PlanarFreehandROITool.toolName;

export default function importAnnotationsFromAIPrediction(
  { commandsManager, servicesManager, extensionManager },
  { structuredReport }
) {
  if (!structuredReport) {
    return;
  }
  const { DisplaySetService, MeasurementService } = servicesManager.services;

  // Remove current measurements using the measurement service.
  MeasurementService.clearMeasurements();

  const { annotations } = structuredReport;

  const seriesInstanceUIDs = [];

  // Find all referenced series in annotations
  annotations.forEach((annotation) => {
    const { seriesInstanceUID } = annotation.location;

    if (!seriesInstanceUIDs.includes(seriesInstanceUID)) {
      seriesInstanceUIDs.push(seriesInstanceUID);
    }
  });

  // Find series displaysets relating to each annotation
  const displaySetsBySeriesInstanceUID = {};
  seriesInstanceUIDs.forEach((seriesInstanceUID) => {
    const displaySet =
      DisplaySetService.getDisplaySetsForSeries(seriesInstanceUID)[0]; // Note: All of our current displaySets have only one displaySet per series.

    displaySetsBySeriesInstanceUID[seriesInstanceUID] = displaySet;
  });

  // Create Cornerstone3D annotations for each prediction annotation
  const measurementData = {};

  measurementData[FIDUCIAL_TOOL_NAME] = [];
  measurementData[PLANAR_FREEHAND_ROI_TOOL_NAME] = [];

  annotations.forEach((annotation) => {
    const { seriesInstanceUID, sopInstanceUID } = annotation.location;
    const displaySet = displaySetsBySeriesInstanceUID[seriesInstanceUID];

    const image = displaySet.images.find(
      (image) => image.SOPInstanceUID === sopInstanceUID
    );

    const { imageId } = image;

    appendCornerstoneAnnotation(measurementData, annotation, imageId);
  });

  addMeasurements(
    { commandsManager, extensionManager, servicesManager },
    measurementData
  );
}

function appendCornerstoneAnnotation(
  measurementData,
  predictionAnnotation,
  imageId
) {
  const { type } = predictionAnnotation;
  let annotation;

  switch (type) {
    case FIDUCIAL_TOOL_NAME:
      annotation = getFiducialAnnotation(predictionAnnotation, imageId);
      break;
    case PLANAR_FREEHAND_ROI_TOOL_NAME:
      annotation = getPlanarFreehandROIAnnotation(
        predictionAnnotation,
        imageId
      );
      break;
    default:
      throw new Error(`No handler for annotation type: ${type}`);
  }

  measurementData[type].push(annotation);
}

function getFiducialAnnotation(predictionAnnotation, imageId) {
  const cornerstone3DAnnotation = getTemplateAnnotation(
    predictionAnnotation,
    imageId
  );

  const { points } = predictionAnnotation;
  const worldPoints = pointsToWorldPoints(points, imageId);

  cornerstone3DAnnotation.annotation.data = {
    handles: {
      points: worldPoints,
      activeHandleIndex: null,
      textBox: {
        hasMoved: false,
      },
    },
  };

  return cornerstone3DAnnotation;
}

function pointsToWorldPoints(points, imageId) {
  const worldPoints = [];

  for (let i = 0; i < points.length; i += 2) {
    const point = imageToWorldCoords(imageId, [points[i], points[i + 1]]);

    worldPoints.push(point);
  }

  return worldPoints;
}

function getPlanarFreehandROIAnnotation(predictionAnnotation, imageId) {
  const cornerstone3DAnnotation = getTemplateAnnotation(
    predictionAnnotation,
    imageId
  );

  const { points, isOpenContour } = predictionAnnotation;
  const worldPoints = pointsToWorldPoints(points, imageId);

  cornerstone3DAnnotation.annotation.data = {
    polyline: worldPoints,
    isOpenContour,
    handles: {
      points: isOpenContour
        ? [worldPoints[0], worldPoints[worldPoints.length - 1]]
        : [],
      activeHandleIndex: null,
      textBox: {
        hasMoved: false,
      },
    },
  };

  return cornerstone3DAnnotation;
}

function getTemplateAnnotation(predictionAnnotation, imageId) {
  const label = predictionAnnotation.displayText[0];
  const { uid, finding, findingSite } = predictionAnnotation;

  const { frameOfReferenceUID: FrameOfReferenceUID } = metaData.get(
    'imagePlaneModule',
    imageId
  );

  let cornerstoneFindingSites = [
    {
      CodeValue: Cornerstone3DCodingScheme.codeValues.CORNERSTONEFREETEXT,
      CodingSchemeDesignator: Cornerstone3DCodingScheme.CodingSchemeDesignator,
      CodeMeaning: label,
    },
  ];
  let cornerstoneFinding;

  if (finding) {
    cornerstoneFinding = labelDILabellingSchemaToCornerstoneLabellingSchema(
      finding
    );
  }

  if (findingSite) {
    cornerstoneFindingSites.push(
      labelDILabellingSchemaToCornerstoneLabellingSchema(findingSite)
    );
  }

  const cornerstone3DAnnotation = {
    annotation: {
      annotationUID: uid,
      metadata: {
        toolName: predictionAnnotation.type,
        referencedImageId: imageId,
        FrameOfReferenceUID,
        label,
      },
      data: {},
    },
    finding: cornerstoneFinding,
    findingSites: cornerstoneFindingSites,
    description: label,
  };

  return cornerstone3DAnnotation;
}

function labelDILabellingSchemaToCornerstoneLabellingSchema(
  findingOrFindingSite
) {
  const ref = findingOrFindingSite.ref.split(':');

  return {
    CodingSchemeDesignator: ref[0],
    CodeValue: ref[1],
    CodeMeaning: findingOrFindingSite.text,
  };
}
