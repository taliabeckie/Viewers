import dcmjs from 'dcmjs';
import ConfigPoint from 'config-point';

const { CodeScheme: Cornerstone3DCodingScheme } = dcmjs.adapters.Cornerstone3D;
const CORNERSTONE_3D_TOOLS_SOURCE_NAME = 'Cornerstone3DTools';
const CORNERSTONE_3D_TOOLS_SOURCE_VERSION = '0.1';

export default function addMeasurements(
  { commandsManager, extensionManager, servicesManager },
  measurementByAnnotationType
) {
  const { MeasurementService } = servicesManager.services;
  const dataSource = extensionManager.getActiveDataSource()[0];

  const mappings = MeasurementService.getSourceMappings(
    CORNERSTONE_3D_TOOLS_SOURCE_NAME,
    CORNERSTONE_3D_TOOLS_SOURCE_VERSION
  );

  if (!mappings || !mappings.length) {
    throw new Error(
      `Attempting to hydrate measurements service when no mappings present. This shouldn't be reached.`
    );
  }

  const source = MeasurementService.getSource(
    CORNERSTONE_3D_TOOLS_SOURCE_NAME,
    CORNERSTONE_3D_TOOLS_SOURCE_VERSION
  );

  Object.keys(measurementByAnnotationType).forEach((annotationType) => {
    const toolDataForAnnotationType =
      measurementByAnnotationType[annotationType];

    toolDataForAnnotationType.forEach((toolData) => {
      // Add the measurement to toolState
      const { annotation } = toolData;
      const id = annotation.annotationUID;

      const matchingMapping = mappings.find(
        (m) => m.annotationType === annotationType
      );

      const measurementId = MeasurementService.addRawMeasurement(
        source,
        annotationType,
        { annotation, id },
        matchingMapping.toMeasurementSchema,
        dataSource
      );

      assignFindingsAndFindSitesToMeasurement(
        { commandsManager, servicesManager },
        toolData,
        measurementId
      );
    });
  });
}

function setFindingProperties(sourceObj, sourceStr, targetObj) {
  if (!sourceObj || !targetObj || !sourceStr) {
    return;
  }

  const ref = sourceObj.ref || `${sourceObj.CodingSchemeDesignator}:${sourceObj.CodeValue}`;
  const color = findColorFromCodeRef(ref);
  const text = sourceObj.text || sourceObj.CodeMeaning;

  targetObj.color = color;
  targetObj.findingText = text;
  targetObj[sourceStr] = {
    color,
    ref,
    text,
  }

}

function assignFindingsAndFindSitesToMeasurement(
  { commandsManager, servicesManager },
  toolData,
  measurementId
) {
  const { MeasurementService } = servicesManager.services;
  const { annotation, finding, findingSites = [] } = toolData;
  const id = annotation.annotationUID || measurementId;
  let updates = {};


  if (findingSites.length) {
    // Filter out the cornerstone3D labels to get the actual finding site.
    const actualFindingSites = findingSites.filter(
      (fs) =>
        fs.CodingSchemeDesignator !==
        Cornerstone3DCodingScheme.CodingSchemeDesignator
    );

    if (actualFindingSites.length) {
      const findingSite = actualFindingSites[0];

      setFindingProperties(findingSite, 'findingSite', updates);
    }
  }

  if (finding) {
    setFindingProperties(finding, 'finding', updates);
  }

  const measurement = MeasurementService.getMeasurement(id);

  const updatedMeasurement = Object.assign({}, measurement, updates);

  commandsManager.runCommand(
    'applyFindingSiteSpecificAnnotationProperties',
    {
      measurement: updatedMeasurement,
    },
    'CORNERSTONE'
  );

  MeasurementService.update(updatedMeasurement.uid, updatedMeasurement, true);
}

function findColorFromCodeRef(ref) {
  const { codingValues } = ConfigPoint.getConfig('contextMenus');
  const codingValue = codingValues[ref];

  if (!codingValue) {
    console.warn(`unrecognised coding value reference: ${ref}`);
    return;
  }

  return codingValue.color;
}
