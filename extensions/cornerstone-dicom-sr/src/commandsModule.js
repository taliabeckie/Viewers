import React from 'react';
import { metaData, utilities } from '@cornerstonejs/core';
import OHIF, { DicomMetadataStore } from '@ohif/core';
import dcmjs from 'dcmjs';
import { adaptersSR } from '@cornerstonejs/adapters';
import ProgressBar from '../../../ucalgary-extension/src/external-algorithm/ProgressBar';
import getFilteredCornerstoneToolState from './utils/getFilteredCornerstoneToolState';
import _viewportToSelection from '../../../ucalgary-extension/src/external-algorithm/viewportToSelection';
import _mapToSimpleSelection from '../../../ucalgary-extension/src/external-algorithm/mapToSimpleSelection';
import _getAllViewports from '../../../ucalgary-extension/src/utils/getAllViewports';
import { _getViewport } from '../../../ucalgary-extension/src/utils/getViewport';
import _getViewportEnabledElement from '../../../ucalgary-extension/src/utils/getViewportEnabledElement';
import { FIDUCIAL_TOOL_NAME } from '../../../ucalgary-extension/src/tools/FiducialTool';
import ConfigPoint from 'config-point';
import { addMeasurements } from '../../../ucalgary-extension/src/utils/adapters';
import _createAnnotations from '../../../ucalgary-extension/src/external-algorithm/createAnnotations';
import { PlanarFreehandROITool } from '@cornerstonejs/tools';
import { once } from 'lodash';
import { Dialog } from '@ohif/ui';
import { importAnnotationsFromAIPrediction } from '../../../ucalgary-extension/src/utils/aiBackendIO';
import { readSR } from '../../../ucalgary-extension/src/utils/importSR';
import setExternalAlgorithmResult from '../../../ucalgary-extension/src/contexts/ExternalAlgorithmContext';
const PLANAR_FREEHAND_ROI_TOOL_NAME = PlanarFreehandROITool.toolName;
const { MeasurementReport } = adaptersSR.Cornerstone3D;
const { log } = OHIF;
/**
 *
 * @param measurementData An array of measurements from the measurements service
 * that you wish to serialize.
 * @param additionalFindingTypes toolTypes that should be stored with labels as Findings
 * @param options Naturalized DICOM JSON headers to merge into the displaySet.
 *
 */
const _generateReport = (measurementData, additionalFindingTypes, options = {}) => {
  const filteredToolState = getFilteredCornerstoneToolState(
    measurementData,
    additionalFindingTypes
  );

  const report = MeasurementReport.generateReport(
    filteredToolState,
    metaData,
    utilities.worldToImageCoords,
    options
  );

  const { dataset } = report;

  // Set the default character set as UTF-8
  // https://dicom.innolitics.com/ciods/nm-image/sop-common/00080005
  if (typeof dataset.SpecificCharacterSet === 'undefined') {
    dataset.SpecificCharacterSet = 'ISO_IR 192';
  }
  return dataset;
};

const commandsModule = props => {
  const { servicesManager, extensionManager, commandsManager } = props;
  const { customizationService, UIDialogService, UINotificationService, ViewportGridService } =
    servicesManager.services;

  //const { apiEndpoints } = ConfigPoint.getConfig('contextMenus');
  //console.log('External API endpoints: ', apiEndpoints);
  const apiEndpoints = {
    GenerateContours: 'https://api.davincitech.ca/api/generate-contours/',
    APIPrediction: 'https://api.davincitech.ca/api/run-ai-prediction/',
    StoreReport: 'https://api.davincitech.ca/api/workspace-state/',
    ErrorTest: 'http://localhost:5000/dicomweb/api/ai-error',
    ImmediateReturn: 'http://localhost:5000/dicomweb/api/immediate-return',
  }
  console.log('External API endpoints: ', apiEndpoints);

  const _getActiveViewportEnabledElement = () => {
    const { activeViewportIndex } = ViewportGridService.getState();
    return _getViewportEnabledElement(activeViewportIndex);
  };

  const _showFailedNotification = (runProps, message, statusCode) => {
    const { name } = runProps;
    UINotificationService.show({
      title: `${name} Failed`,
      message: `${message} - status: ${statusCode}`,
      type: 'error',
    });
  };

  const actions = {
    /**
     *
     * @param measurementData An array of measurements from the measurements service
     * @param additionalFindingTypes toolTypes that should be stored with labels as Findings
     * @param options Naturalized DICOM JSON headers to merge into the displaySet.
     * as opposed to Finding Sites.
     * that you wish to serialize.
     */
    downloadReport: ({ measurementData, additionalFindingTypes, options = {} }) => {
      const srDataset = actions.generateReport(measurementData, additionalFindingTypes, options);
      const reportBlob = dcmjs.data.datasetToBlob(srDataset);

      //Create a URL for the binary.
      var objectUrl = URL.createObjectURL(reportBlob);
      window.location.assign(objectUrl);
    },

    /**
     *
     * @param measurementData An array of measurements from the measurements service
     * that you wish to serialize.
     * @param dataSource The dataSource that you wish to use to persist the data.
     * @param additionalFindingTypes toolTypes that should be stored with labels as Findings
     * @param options Naturalized DICOM JSON headers to merge into the displaySet.
     * @return The naturalized report
     */
    storeMeasurements: async ({
      measurementData,
      dataSource,
      additionalFindingTypes,
      options = {},
    }) => {
      // Use the @cornerstonejs adapter for converting to/from DICOM
      // But it is good enough for now whilst we only have cornerstone as a datasource.
      log.info('[DICOMSR] storeMeasurements');

      if (!dataSource || !dataSource.store || !dataSource.store.dicom) {
        log.error('[DICOMSR] datasource has no dataSource.store.dicom endpoint!');
        return Promise.reject({});
      }

      try {
        const naturalizedReport = _generateReport(measurementData, additionalFindingTypes, options);

        const { StudyInstanceUID, ContentSequence } = naturalizedReport;
        // The content sequence has 5 or more elements, of which
        // the `[4]` element contains the annotation data, so this is
        // checking that there is some annotation data present.
        if (!ContentSequence?.[4].ContentSequence?.length) {
          console.log('naturalizedReport missing imaging content', naturalizedReport);
          throw new Error('Invalid report, no content');
        }

        const onBeforeDicomStore =
          customizationService.getModeCustomization('onBeforeDicomStore')?.value;

        let dicomDict;
        if (typeof onBeforeDicomStore === 'function') {
          dicomDict = onBeforeDicomStore({ measurementData, naturalizedReport });
        }

        await dataSource.store.dicom(naturalizedReport, null, dicomDict);

        if (StudyInstanceUID) {
          dataSource.deleteStudyMetadataPromise(StudyInstanceUID);
        }

        // The "Mode" route listens for DicomMetadataStore changes
        // When a new instance is added, it listens and
        // automatically calls makeDisplaySets
        DicomMetadataStore.addInstances([naturalizedReport], true);

        return naturalizedReport;
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
        case PLANAR_FREEHAND_ROI_TOOL_NAME:
          const { joinedOpenContour } = codingValue;

          data.isOpenUShapeContour = !!joinedOpenContour;

          break;
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

    getJSONResults: xhr => {
      console.log('got JSON results');
      let results;
      try {
        results = JSON.parse(xhr.response);
      } catch {
        results = xhr.response;
      }
      return results;
    },

    runExternalAlgorithm: runProps => {
      const { items = [] } = runProps;
      if (!UIDialogService) {
        return;
      }
      console.log('Running External Algorithm');
      const onSubmitHandler = ({ action }) => {
        UIDialogService.dismiss({ id: dialogId });
      };

      const onSelectHandler = ({ item }) => {
        UIDialogService.dismiss({ id: dialogId });
        commandsManager.runCommand(item.commandName, item.commandOptions);
      };

      // Show the dialog
      const dialogId = 'RunExternalAlgorithm';
      UIDialogService.create({
        id: dialogId,
        centralize: true,
        isDraggable: true,
        showOverlay: true,
        content: Dialog,
        onClose: () => UIDialogService.dismiss({ id: dialogId }),
        contentProps: {
          title: 'Run External Algorithm',
          onClose: () => UIDialogService.dismiss({ id: dialogId }),
          // body: () => bodyList(items, onSelectHandler),
          actions: [{ id: 'cancel', text: 'Cancel', type: 'primary' }],
          onSubmit: onSubmitHandler,
        },
      });

      // On ok, complete the External Algorithm
    },

    initiateExternalAlgorithm: runProps => {
      const {
        algorithm,
        endpointName,
        name,
        seriesInstanceUID = '',
        sopInstanceUID = '',
        inputValue,
        inputValue2,
      } = runProps;
      console.log('External Algorithm initiate', name);
      const endpointUrl = apiEndpoints[endpointName];

      const selection = getSelection();
      const annotations = _createAnnotations({ servicesManager });

      const structuredReport = {
        label: 'alg1-sr',
        seriesInstanceUID,
        sopInstanceUID,
        annotations,
      };

      const ed = inputValue;
      const es = inputValue2;

      const phases = `End-Diastole phase: ${ed}, End-Systole phase: ${es}`;

      const message = {
        algorithm,
        selection,
        structuredReport,
        phases,
      };
      console.log('External Algorithm post data=\n', JSON.stringify(message, null, 2));

      const xhr = new XMLHttpRequest();
      xhr.open('POST', endpointUrl, true);

      let results;
      let job = {};

      xhr.onreadystatechange = function () {
        //Call a function when the state changes.
        if (xhr.readyState == 4) {
          switch (xhr.status) {
            case 200:
            case 204:
              results = commandsManager.runCommand('getJSONResults', {
                xhr: xhr,
              });
              job = results;
              const { jobId = xhr.responseText } = job;
              commandsManager.runCommand('progressExternalAlgorithm', {
                ...runProps,
                jobId,
              });
              break;
            default:
              _showFailedNotification(runProps, 'Unable to invoke', xhr.status);
          }
        }
      };
      xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
      xhr.send(JSON.stringify(message));
    },

    getSelection: () => {
      const activeViewport = _getActiveViewportEnabledElement();
      const allViewports = _getAllViewports();
      const mainSelection = _viewportToSelection(activeViewport);

      const selection = allViewports.map(selectionItem =>
        _mapToSimpleSelection(selectionItem, ['OHIF:InView'])
      );
      selection
        .filter(selectionItem => selectionItem.imageId === mainSelection.imageId)
        .forEach(selectionItem => {
          selectionItem.selectionCodes.push('OHIF:Current');
        });

      const mappedSelection = {
        selectionCodes: ['OHIF:InView'],
        studyInstanceUID: undefined,
        series: [],
      };

      selection.forEach(selectionItem => {
        const imageId = selectionItem.imageId[0];
        const generalSeriesModule = metaData.get('generalSeriesModule', imageId);

        const sopCommonModule = metaData.get('sopCommonModule', imageId);

        const { sopInstanceUID } = sopCommonModule;
        const { seriesInstanceUID, studyInstanceUID } = generalSeriesModule;

        if (mappedSelection.studyInstanceUID === undefined) {
          mappedSelection.studyInstanceUID = studyInstanceUID;
        }

        let seriesSelection = mappedSelection.series.find(
          aSeries => aSeries.seriesInstanceUID === seriesInstanceUID
        );

        if (seriesSelection === undefined) {
          // Create the seriesSelection entry
          seriesSelection = {
            seriesInstanceUID,
            instances: [],
          };
          mappedSelection.series.push(seriesSelection);
        }

        let instanceSelection = seriesSelection.instances.find(
          anInstance => anInstance.sopInstanceUID === sopInstanceUID
        );

        if (instanceSelection === undefined) {
          // Create the instanceSelection entry
          instanceSelection = {
            sopInstanceUID,
          };
          seriesSelection.instances.push(instanceSelection);
        }

        delete selectionItem.imageId;
      });

      return mappedSelection;
    },

     /**
   * Create a progress check dialog, and initiate the value.
   * @returns
   */
  createProgressCheck: runProps => {
    const { name, jobId, endpointName } = runProps;
    let completed: any = 0;
    let statusCode: any = 0;

    const checkStatus = () => {
      console.log('Starting check status at', new Date());
      const endpointUrl = apiEndpoints[endpointName];
      const slashIfNeeded = apiEndpoints[endpointName].endsWith('/') ? '' : '/';

      const xhr = new XMLHttpRequest();
      xhr.responseType = 'json';
      xhr.open('GET', `${endpointUrl}${slashIfNeeded}${jobId}/`, true);

      xhr.onreadystatechange = function() {
        //Call a function when the state changes.
        if (xhr.readyState == 4) {
          statusCode = xhr.status;
          switch (xhr.status) {
            case 200:
              const results = xhr.response;
              const { job = {} } = results;
              const { jobStatus = 'FAILED', jobProgress = 0 } = job;
              if (jobStatus === 'COMPLETE') {
                console.log('Result is COMPLETE');
                commandsManager.runCommand('completeExternalAlgorithm', {
                  ...runProps,
                  results,
                });
                completed = jobStatus;
              } else if (
                ['SUBMITTED', 'PROGRESS', 'PROCESSING'].includes(jobStatus)
              ) {
                completed = jobProgress;
                console.log('Setting next timeout, with completed=', completed);
                setTimeout(checkStatus, 100);
              } else {
                console.log('FAILED', jobStatus, jobProgress);
                completed = 'FAILED';
              }
              break;
            default:
              completed = 'FAILED';
          }
        }
      };
      xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
      xhr.send();
    };

    checkStatus();

    return () => ({ jobProgress: completed, statusCode });
  },


  progressExternalAlgorithm: runProps => {
    const { jobId, results = {}, name } = runProps;
    const { job = {} } = results;
    const { jobStatus } = job;
    console.log('Progress External Algorithm', jobId, results);
    const onSubmitHandler = () => {
      UIDialogService.dismiss({ id: dialogId });
    };

    const onErrorHandler = statusCode => {
      _showFailedNotification(
        runProps,
        `External Algorithm failed for job ${jobId}`,
        statusCode
      );
    };

    const onceOnError = once(onErrorHandler);

    // Show the dialog
    const dialogId = 'ProgressExternalAlgorithm';
    const progressCheck = commandsManager.runCommand('createProgressCheck',{
      runProps
      });

    UIDialogService.create({
      id: dialogId,
      centralize: true,
      isDraggable: true,
      showOverlay: true,
      content: Dialog,
      onClose: () => UIDialogService.dismiss({ id: dialogId }),
      contentProps: {
        title: `Progress ${name} ${jobStatus}`,
        onClose: () => UIDialogService.dismiss({ id: dialogId }),
        // body: () => (
        //   <ProgressBar
        //     bgcolor="yellow"
        //     progressCheck={progressCheck}
        //     onComplete={onSubmitHandler}
        //     onError={onceOnError}
        //   />
        // ),
        actions: [
          { id: 'cancel', text: 'Cancel', type: 'primary' },
          { id: 'ok', text: 'OK', type: 'secondary' },
        ],
        onSubmit: onSubmitHandler,
      },
    });
  },

  completeExternalAlgorithm: runProps => {
    const { results, algorithm } = runProps;
    const { algorithmName } = algorithm;

    switch (algorithmName) {
      case 'GenerateContours':
        console.log('Replace current measurements with contours from', results);
        commandsManager.runCommand(
          'importAnnotationsFromAIPrediction',
          {
            aiPredictionResult: results,
          },
          'CORNERSTONE'
        );
        break;
      case 'DiseasePrediction':
        console.log('Update Disease prediction result from', results);
        //ExternalAlgorithmService.setExternalAlgorithmResult(results);   ///////////////
        setExternalAlgorithmResult(results);
        break;
      case 'StoreReport':
        // do nothing with result.
        break;
      default:
        throw new Error(
          `No handler for algorithm results for ${algorithmName}`
        );
    }
  },

  importReport: async ({ study, seriesInstanceUid }) => {
    const measurementByAnnotationType = await readSR(
      { servicesManager, extensionManager },
      { study, seriesInstanceUid }
    );

    if (measurementByAnnotationType) {
      // If we have found an SR and extracted measurements, add them to
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


  };

  const definitions = {
    downloadReport: {
      commandFn: actions.downloadReport,
      storeContexts: [],
      options: {},
    },
    storeMeasurements: {
      commandFn: actions.storeMeasurements,
      storeContexts: [],
      options: {},
    },
    applyFindingSiteSpecificAnnotationProperties: {
      commandFn: actions.applyFindingSiteSpecificAnnotationProperties,
      storeContexts: [],
      options: {},
    },
    // createReport: {
    //   commandFn: actions.createReport,
    //   storeContexts: [],
    //   options: {},
    // },
    getToolDataActiveCanvasPoints: {
      commandFn: actions.getToolDataActiveCanvasPoints,
      storeContexts: [],
      options: {},
    },
    getContextMenuCustomActions: {
      commandFn: actions.getContextMenuCustomActions,
      storeContexts: [],
      options: {},
    },
    runExternalAlgorithm: {
      commandFn: actions.runExternalAlgorithm,
      storeContexts: [],
      options: {},
    },
    initiateExternalAlgorithm: {
      commandFn: actions.initiateExternalAlgorithm,
      storeContexts: [],
      options: {},
    },
    getJSONResults: {
      commandFn: actions.getJSONResults,
      storeContexts: [],
      options: {},
    },
    getSelection: {
      commandFn: actions.getSelection,
      storeContexts: [],
      options: {},
    },
    createProgressCheck:{
      commandFn: actions.createProgressCheck,
      storeContexts: [],
      options: {},
    },
    progressExternalAlgorithm:{
      commandFn: actions.progressExternalAlgorithm,
      storeContexts: [],
      options: {},
    },
    completeExternalAlgorithm:{
      commandFn: actions.completeExternalAlgorithm,
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
  };

  return {
    actions,
    definitions,
    defaultContext: 'CORNERSTONE_STRUCTURED_REPORT',
  };
};

export default commandsModule;
