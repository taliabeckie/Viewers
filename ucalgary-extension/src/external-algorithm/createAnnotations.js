import { metaData, utilities } from '@cornerstonejs/core';
import { PlanarFreehandROITool } from '@cornerstonejs/tools';
import { FIDUCIAL_TOOL_NAME } from '../tools/FiducialTool';

const PLANAR_FREEHAND_ROI_TOOL_NAME = PlanarFreehandROITool.toolName;

const { worldToImageCoords } = utilities;

const createAnnotations = ({ servicesManager }) => {
  const { MeasurementService } = servicesManager.services;
  const measurements = MeasurementService.getMeasurements();
  const annotations = [];

  measurements.forEach(measurement => {
    const toolName = measurement.metadata.toolName;
    let annotation;

    switch (toolName) {
      case FIDUCIAL_TOOL_NAME:
        annotation = createFiducialAnnotation(measurement);

        break;
      case PLANAR_FREEHAND_ROI_TOOL_NAME:
        annotation = createPlanarFreehandROIAnnotation(measurement);

        break;
      default:
        console.warn(`Unrecognised tool name ${toolName}`);
    }

    if (annotation !== undefined) {
      annotations.push(annotation);
    }
  });

  return annotations;
};

const createFiducialAnnotation = measurement => {
  const annotation = createTemplateAnnotation(measurement);
  const { data, metadata } = measurement;
  const { points } = data.handles;
  const { referencedImageId } = metadata;
  const imagePoints = worldToImagePoints(points, referencedImageId);

  annotation.points = imagePoints;

  return annotation;
};

const createPlanarFreehandROIAnnotation = measurement => {
  const annotation = createTemplateAnnotation(measurement);
  const { data, metadata } = measurement;
  const { referencedImageId } = metadata;
  const { isOpenContour, polyline } = data;
  const imagePoints = worldToImagePoints(polyline, referencedImageId);

  annotation.points = imagePoints;
  annotation.isOpenContour = isOpenContour;

  return annotation;
};

const worldToImagePoints = (worldPoints, referencedImageId) => {
  const imagePoints = [];

  worldPoints.forEach(worldPoint => {
    const imagePoint = worldToImageCoords(referencedImageId, worldPoint);

    imagePoints.push(...imagePoint);
  });

  return imagePoints;
};

const createTemplateAnnotation = measurement => {
  const { uid, label, findingSite, finding, metadata } = measurement;
  const { toolName, referencedImageId } = metadata;

  const generalSeriesModule = metaData.get('generalSeriesModule', referencedImageId);

  const sopCommonModule = metaData.get('sopCommonModule', referencedImageId);

  const location = {
    sopInstanceUID: sopCommonModule.sopInstanceUID,
    seriesInstanceUID: generalSeriesModule.seriesInstanceUID,
    studyInstanceUID: generalSeriesModule.studyInstanceUID,
  };

  const templateAnnotation = {
    uid,
    location,
    displayText: label,
    findingSite,
    finding,
    type: toolName,
  };

  return templateAnnotation;
};

export default createAnnotations;
