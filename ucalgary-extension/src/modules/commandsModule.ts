import OHIF from '@ohif/core';
import * as cornerstone3D from '@cornerstonejs/core';
import createExternalAlgorithm from '../external-algorithm';
import { _getViewport } from '../utils/getViewport';
import createReportAsync from '../utils/exportSR/createReportAsync';
import { readSR } from '../utils/importSR';
import { addMeasurements } from '../utils/adapters';
import { importAnnotationsFromAIPrediction } from '../utils/aiBackendIO';
import ConfigPoint from 'config-point';
import { FIDUCIAL_TOOL_NAME } from '../tools/FiducialTool';
import createReportDialogPrompt from '../modals/createReportDialogPrompt';
import labelPhasesDialogPrompt from '../modals/labelPhasesDialogPrompt';

const { metaData, utilities } = cornerstone3D;
const { log, DicomMetadataStore } = OHIF;

const commandsModule = props => {
  const { actions: mlActions, definitions: mlDefinitions } = createExternalAlgorithm(props);

  const { servicesManager, commandsManager, extensionManager } = props;

  const { UIDialogService } = servicesManager.services || {};

  const actions = {
    openCreateReportDialog: () => {
      try {
        createReportDialogPrompt(UIDialogService).then((promptResult = {}) => {
          const { value: SeriesDescription } = promptResult;

          if (SeriesDescription) {
            commandsManager.runCommand('createReport', {
              SeriesDescription,
            });
          }
        });
      } catch (e) {
        console.warn('Something went wrong while creating report from dialog', e);
      }
    },

    createReport: (props = {}) => {
      const { MeasurementService } = servicesManager.services;
      const measurements = MeasurementService.getMeasurements();

      const dataSources = extensionManager.getDataSources();
      const dataSource = dataSources[0];

      // TODO seriesNumber still needs to be calculated
      const { SeriesDescription = 'SR', SeriesNumber = '1001' } = props;

      const studyUID = measurements[0].referenceStudyUID;
      const studyMeta = DicomMetadataStore.getStudy(studyUID);
      const instanceMeta = studyMeta.series[0].instances[0];
      const { StudyID } = instanceMeta;

      createReportAsync(servicesManager, commandsManager, dataSource, measurements, {
        SeriesDescription,
        SeriesNumber,
        StudyID,
      });
    },

    importReport: async ({ study, seriesInstanceUid }) => {
      const measurementByAnnotationType = await readSR(
        { servicesManager, extensionManager },
        { study, seriesInstanceUid }
      );

      if (measurementByAnnotationType) {
        // If we have found and SR and extracted measurements, add them to
        // the measurement service.
        addMeasurements(
          { commandsManager, extensionManager, servicesManager },
          measurementByAnnotationType
        );
      }
    },

    importAnnotationsFromAIPrediction: ({ aiPredictionResult }) => {
      importAnnotationsFromAIPrediction(
        { commandsManager, servicesManager, extensionManager },
        aiPredictionResult
      );
    },

    /**
     *
     * @param reportData dcmjs report data object to store.
     * @param dataSource The dataSource that you wish to use to persist the data.
     */
    storeMeasurements: async ({ naturalizedReport, dataSource }) => {
      // TODO -> Eventually use the measurements directly and not the dcmjs adapter,
      // But it is good enough for now whilst we only have cornerstone as a datasource.
      log.info('[DICOMSR] storeMeasurements');

      if (!dataSource || !dataSource.store || !dataSource.store.dicom) {
        log.error('[DICOMSR] datasource has no dataSource.store.dicom endpoint!');
        return Promise.reject({});
      }

      try {
        const { StudyInstanceUID } = naturalizedReport;

        await dataSource.store.dicom(naturalizedReport);

        if (StudyInstanceUID) {
          dataSource.deleteStudyMetadataPromise(StudyInstanceUID);
        }
      } catch (error) {
        console.warn(error);
        log.error(`[DICOMSR] Error while saving the measurements: ${error.message}`);
        throw new Error(error.message || 'Error while saving the measurements.');
      }
    },
    applyFindingSiteSpecificAnnotationProperties: ({ measurement }) => {
      const { toolName, findingSite, data, metadata: measurementMetadata } = measurement;

      if (findingSite === undefined) {
        // No finding site assigned, return early.
        return;
      }

      const { codingValues } = ConfigPoint.getConfig('contextMenus');
      const codingValue = codingValues[findingSite.ref];

      if (codingValue === undefined) {
        console.warn(
          'Unrecognised coding value on measurement, skipping findingSite specific annotation logic.'
        );
        console.warn(measurement);
        return;
      }

      switch (toolName) {
        // case PLANAR_FREEHAND_ROI_TOOL_NAME:
        //   const { joinedOpenContour } = codingValue;

        //   data.isOpenUShapeContour = !!joinedOpenContour;

        //   break;
        case FIDUCIAL_TOOL_NAME:
          //seriesLabel
          const { seriesLabel } = codingValue;

          if (seriesLabel === true) {
            // Whilst we are still using fiducials for the series labels,
            // make sure these labels cannot be placed outside the image.
            // Place them at the center of the image instead.
            const { referencedImageId } = measurementMetadata;
            const imagePlaneModule = metaData.get('imagePlaneModule', referencedImageId);
            const { rows, columns } = imagePlaneModule;
            const centerPixel = [Math.round(columns / 2), Math.round(rows / 2)];
            const worldPosOfCenter = utilities.imageToWorldCoords(referencedImageId, centerPixel);

            data.handles.points[0] = worldPosOfCenter;
          }
        default:
          // No checks for this tool type.
          break;
      }
    },
    getToolDataActiveCanvasPoints: ({ toolData = {} }) => {
      const { metadata, data } = toolData;
      if (data === undefined || metadata === undefined) {
        return;
      }

      let worldPoints;

      switch (metadata?.toolName) {
        case PLANAR_FREEHAND_ROI_TOOL_NAME:
          worldPoints = data?.polyline;
          break;
        default:
          worldPoints = data?.handles?.points;
          break;
      }

      return commandsManager.runCommand('worldPointsToActiveCanvas', {
        worldPoints,
      });
    },
    getContextMenuCustomActions: () => {
      const onSetSeriesLabel = (item, itemRef, props) => {
        const { nearbyToolData } = props;
        commandsManager.runCommand('iterateToolGroups', {
          item,
          iteratee: (_, toolGroup, currentElement) => {
            const enabledElement = commandsManager.runCommand('getActiveEnabledElement');

            if (!enabledElement || currentElement !== enabledElement) {
              return;
            }

            const viewportEnabledElement = commandsManager.runCommand(
              'getActiveViewportEnabledElement'
            );

            if (!viewportEnabledElement) {
              return;
            }

            const { findingSite, finding, findingUpdates } = itemRef;
            const color = (finding || findingSite || {}).color;

            const updates = {
              ...findingUpdates,
              color,
              findingSite,
              finding,
            };

            // for non selected tool flow
            // we have to create a fiducial and associate the series label with that
            if (!nearbyToolData) {
              if (updates.findingSite) {
                updates.findingSites = [updates.findingSite];
                delete updates.findingSite;
              }
              const worldPoints = commandsManager.runCommand('canvasPointsToWorld', {
                enabledElement: viewportEnabledElement,
                canvasPoints: [[0, 0]],
              });

              if (!worldPoints.length) {
                return;
              }

              const annotationToolData = toolGroup
                .getToolInstance('Fiducial')
                .newAnnotationFromPoints(enabledElement, [
                  {
                    world: worldPoints[0],
                  },
                ]);

              const measurementByAnnotationType = {
                Fiducial: [{ annotation: annotationToolData, ...updates }],
              };

              return addMeasurements(
                { commandsManager, extensionManager, servicesManager },
                measurementByAnnotationType
              );
            } else {
              // for selected tool flow
              // we have update the selected fiducial to series label fiducial (ie. set it hidden, ...)
              const measurement = servicesManager.services.MeasurementService.getMeasurement(
                nearbyToolData.annotationUID
              );

              const updatedMeasurement = Object.assign({}, measurement, updates);

              commandsManager.runCommand(
                'applyFindingSiteSpecificAnnotationProperties',
                {
                  measurement: updatedMeasurement,
                },
                'CORNERSTONE'
              );

              console.log('updatedMeasurement=', updatedMeasurement);

              servicesManager.services.MeasurementService.update(
                updatedMeasurement.uid,
                updatedMeasurement,
                true
              );
            }
          },
        });
      };

      return {
        onSetSeriesLabel,
      };
    },

    openLabelPhasesDialogPrompt: () => {
      try {
        labelPhasesDialogPrompt(UIDialogService).then((promptResult = {}) => {
          const { value: SeriesDescription } = promptResult;
          if (SeriesDescription) {
            //save phase values somewhere!
            console.log(SeriesDescription);
          }
          // if (phase1) {
          //  commandsManager.runCommand('createReport', {
          //     phase1,
          //   });
          //  }
        });
      } catch (e) {
        console.warn('Something went wrong while getting phase number from dialog', e);
      }
    },
    ...mlActions,
  };

  const definitions = {
    autoScroll: {
      commandFn: actions.autoScroll,
      storeContexts: [],
      options: { direction: 1 },
    },
    labelDIStoreMeasurements: {
      commandFn: actions.storeMeasurements,
      storeContexts: [],
      options: {},
    },
    applyFindingSiteSpecificAnnotationProperties: {
      commandFn: actions.applyFindingSiteSpecificAnnotationProperties,
      storeContexts: [],
      options: {},
    },
    createReport: {
      commandFn: actions.createReport,
      storeContexts: [],
      options: {},
    },
    importReport: {
      commandFn: actions.importReport,
      storeContexts: [],
      options: {},
    },
    importAnnotationsFromAIPrediction: {
      commandFn: actions.importAnnotationsFromAIPrediction,
      storeContexts: [],
      options: {},
    },
    getToolDataActiveCanvasPoints: {
      commandFn: actions.getToolDataActiveCanvasPoints,
      storeContexts: [],
      options: {},
    },
    openCreateReportDialog: {
      commandFn: actions.openCreateReportDialog,
      storeContexts: [],
      options: {},
    },
    getContextMenuCustomActions: {
      commandFn: actions.getContextMenuCustomActions,
      storeContexts: [],
      options: {},
    },
    openLabelPhasesDialogPrompt: {
      commandFn: actions.openLabelPhasesDialogPrompt,
      storeContexts: [],
      options: {},
    },
    ...mlDefinitions,
  };

  return {
    actions,
    definitions,
    defaultContext: 'CORNERSTONE',
  };
};

export default commandsModule;
