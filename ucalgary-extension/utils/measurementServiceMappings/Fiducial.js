import { annotation as csToolsAnnotation } from '@cornerstonejs/tools';
import { extensionUtils as csExtensionUtils } from '@ohif/extension-cornerstone';
import ConfigPoint from 'config-point';

function isColorInvisible(color) {
  return color === '#000000';
}
/**
 * It updates a Fiducial annotatimeasuon data by the given measurement service format.
 * It uses measurement.uid to seek for the related annotation and apply the changes.
 * @typedef {function(Object)} ToAnnotationMethod
 *
 * @param {Object} measurement measurement service format
 */

/**
 * Maps cornerstone annotation event data to measurement service format.
 * @typedef {function(Object)} ToMeasurementMethod
 * @param {Object} csToolsEventDetail imaging library toolsEvent detail object.
 * @param {Object} DisplaySetService OHIF display service.
 * @param {Object} Cornerstone3DViewportService OHIF Cornerstone3DViewportService.
 * @param {function(string): string} getValueTypeFromToolType Method to get a value type for given tool.
 * @returns {Object} measurement measurement service format
 */

/**
 * Maps cornerstone annotation event data to measurement service format.
 * @typedef {function(Object)} GetMatchingCriteriaArray
 * @param {Object} MeasurementService OHIF measurement service.
 * @returns {Object[]} list of matching criteria to determine uniqueness of this mapping.
 */

/**
 * Measurement Mapping Service object for Fiducial tool.
 * See {@link CustomTools.FiducialTool} to see imaging annotation tool format.
 *
 * @typedef {Object}
 * @property {ToAnnotationMethod} toAnnotation
 * @property {ToMeasurementMethod} toMeasurement
 * @property {GetMatchingCriteriaArray} getMatchingCriteriaArray
 */
const Fiducial = {
  toAnnotation: measurement => {
    const annotationUID = measurement.uid;
    const annotation = csToolsAnnotation.state.getAnnotation(annotationUID);

    if (!annotation) {
      return;
    }

    // side effect, cs should provide api to prevent changing by ref.
    annotation.data.label = measurement.label;
    annotation.data.findingSite = measurement.findingSite;
    annotation.data.finding = measurement.finding;

    const invisibleColor =
      isColorInvisible(measurement.findingSite?.color) ||
      isColorInvisible(measurement.finding?.color);

    csExtensionUtils.annotation.setAnnotationColor(
      annotation.annotationUID,
      measurement.color,
      invisibleColor
    );

    let visibility = measurement.visible;

    // For findings with a a series label, always set them invisible.
    const { codingValues = {} } = ConfigPoint.getConfig('contextMenus');
    const codingValue = codingValues[measurement?.findingSite?.ref];

    if (codingValue?.seriesLabel === true) {
      visibility = false;
    }

    csExtensionUtils.annotation.setAnnotationVisibility(annotation.annotationUID, visibility);
    csExtensionUtils.annotation.setAnnotationSelected(annotation.annotationUID, measurement.active);
  },

  toMeasurement: (
    csToolsEventDetail,
    DisplaySetService,
    Cornerstone3DViewportService,
    getValueTypeFromToolType
  ) => {
    const { annotation: cs3DAnnotation, viewportId } = csToolsEventDetail;
    const { metadata, data, annotationUID, isVisible } = cs3DAnnotation;

    if (!metadata || !data) {
      console.warn('Fiducial tool: Missing metadata or data');
      return null;
    }

    const { toolName, referencedImageId, FrameOfReferenceUID } = metadata;

    const active = csExtensionUtils.annotation.isAnnotationSelected(annotationUID);
    const color = csExtensionUtils.annotation.getAnnotationColor(annotationUID);

    const { SOPInstanceUID, SeriesInstanceUID, StudyInstanceUID } =
      csExtensionUtils.getSOPInstanceAttributes(
        referencedImageId,
        Cornerstone3DViewportService,
        viewportId
      );

    let displaySet;

    if (SOPInstanceUID) {
      displaySet = DisplaySetService.getDisplaySetForSOPInstanceUID(
        SOPInstanceUID,
        SeriesInstanceUID
      );
    } else {
      displaySet = DisplaySetService.getDisplaySetsForSeries(SeriesInstanceUID);
    }

    const { points } = data.handles;

    const mappedAnnotations = getMappedAnnotations(cs3DAnnotation, DisplaySetService);

    const displayText = getDisplayText(mappedAnnotations);
    const getReport = () => _getReport(mappedAnnotations, points, FrameOfReferenceUID);

    return {
      uid: annotationUID,
      SOPInstanceUID,
      FrameOfReferenceUID,
      points,
      metadata,
      referenceSeriesUID: SeriesInstanceUID,
      referenceStudyUID: StudyInstanceUID,
      toolName: metadata.toolName,
      displaySetInstanceUID: displaySet.displaySetInstanceUID,
      label: data.label || metadata.label, // TODO -> Resolve issues on the base layer. There is a discrepency between CS3D and dcmjs.
      displayText: displayText,
      data: data,
      type: getValueTypeFromToolType(toolName),
      getReport,
      visible: isVisible,
      findingSite: data.findingSite,
      finding: data.finding,
      active,
      color,
      blackListActions: ['activate'],
    };
  },

  getMatchingCriteriaArray: measurementService => {
    return [
      {
        valueType: measurementService.VALUE_TYPES.POINT,
        points: 1,
      },
    ];
  },
};

/**
 * It maps an imaging library annotation to a list of simplified annotation properties.
 *
 * @param {Object} annotationData
 * @param {Object} DisplaySetService
 * @returns
 */
function getMappedAnnotations(annotationData, DisplaySetService) {
  const { metadata, data } = annotationData;
  const { label } = data;
  const { referencedImageId } = metadata;

  const annotations = [];

  const { SOPInstanceUID: _SOPInstanceUID, SeriesInstanceUID: _SeriesInstanceUID } =
    csExtensionUtils.getSOPInstanceAttributes(referencedImageId) || {};

  if (!_SOPInstanceUID || !_SeriesInstanceUID) {
    return annotations;
  }

  const displaySet = DisplaySetService.getDisplaySetForSOPInstanceUID(
    _SOPInstanceUID,
    _SeriesInstanceUID
  );

  const { SeriesNumber, SeriesInstanceUID } = displaySet;

  annotations.push({
    SeriesInstanceUID,
    SeriesNumber,
    label,
  });

  return annotations;
}

/**
 * TBD
 * This function is used to convert the measurement data to a format that is suitable for the report generation (e.g. for the csv report).
 * The report returns a list of columns and corresponding values.
 * @param {*} mappedAnnotations
 * @param {*} points
 * @param {*} FrameOfReferenceUID
 * @returns Object representing the report's content for this tool.
 */
function _getReport(mappedAnnotations, points, FrameOfReferenceUID) {
  const columns = [];
  const values = [];

  return {
    columns,
    values,
  };
}

function getDisplayText(mappedAnnotations) {
  return '';
}

export default Fiducial;
