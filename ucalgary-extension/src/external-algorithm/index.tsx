import _viewportToSelection from './viewportToSelection';
import _mapToSimpleSelection from './mapToSimpleSelection';
import _createAnnotations from './createAnnotations';
import _getAllViewports from '../utils/getAllViewports';
import _getViewportEnabledElement from '../utils/getViewportEnabledElement';
import { metaData } from '@cornerstonejs/core';

import { Dialog } from '@ohif/ui';
import ProgressBar from './ProgressBar';
import React from 'react';
import ConfigPoint from 'config-point';
import { once } from 'lodash';

/** Creates the External Algorithm actions and definitions:
 * runExternalAlgorithm - starts the entire process
 * initiateExternalAlgorithm - actually calls the API, returning the job ID
 * progressExternalAlgorithm - takes a job id and processes feedback messages
 * completeExternalAlgorithm - reads the final response (from the params), and updates the display to match
 */
export default function createExternalAlgorithm(props) {
  const { servicesManager, commandsManager } = props;
  const {
    ViewportGridService,
    UINotificationService,
    UIDialogService,
    ExternalAlgorithmService,
  } = servicesManager.services;

  const { apiEndpoints } = ConfigPoint.getConfig('contextMenus');
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

  const bodyList = (items, onSelectHandler) => (
    <div className="p-4 bg-primary-dark flex flex-col justify-between">
      {items.map(item => {
        let itemToDisplay = item.commandOptions.name;

        if (!!item.commandOptions?.algorithm?.version) {
          itemToDisplay += ` (v: ${item.commandOptions?.algorithm?.version})`;
        }
        return (
          <span
            key={item.id}
            className="cursor-pointer hover:bg-secondary-dark py-2 text-base text-white"
            onClick={onSelectHandler.bind(null, { item })}
          >
            {itemToDisplay}
          </span>
        );
      })}
    </div>
  );

  const runExternalAlgorithm = runProps => {
    const { items = [] } = runProps;
    if (!UIDialogService) return;
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
        body: () => bodyList(items, onSelectHandler),
        actions: [{ id: 'cancel', text: 'Cancel', type: 'primary' }],
        onSubmit: onSubmitHandler,
      },
    });

    // On ok, complete the External Algorithm
  };

  const initiateExternalAlgorithm = runProps => {
    const {
      algorithm,
      endpointName,
      name,
      seriesInstanceUID = '',
      sopInstanceUID = '',
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
    const message = {
      algorithm,
      selection,
      structuredReport,
    };
    console.log(
      'External Algorithm post data=\n',
      JSON.stringify(message, null, 2)
    );

    const xhr = new XMLHttpRequest();
    xhr.open('POST', endpointUrl, true);

    xhr.onreadystatechange = function() {
      //Call a function when the state changes.
      if (xhr.readyState == 4) {
        switch (xhr.status) {
          case 200:
          case 204:
            const results = getJSONResults(xhr);
            const { job = {} } = results;
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
  };

  const getSelection = () => {
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
  };

  /**
   * Create a progress check dialog, an initiate the value.
   * @returns
   */
  const createProgressCheck = runProps => {
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
  };

  const progressExternalAlgorithm = runProps => {
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
    const progressCheck = createProgressCheck(runProps);

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
        body: () => (
          <ProgressBar
            bgcolor="yellow"
            progressCheck={progressCheck}
            onComplete={onSubmitHandler}
            onError={onceOnError}
          />
        ),
        actions: [
          { id: 'cancel', text: 'Cancel', type: 'primary' },
          { id: 'ok', text: 'OK', type: 'secondary' },
        ],
        onSubmit: onSubmitHandler,
      },
    });
  };

  const completeExternalAlgorithm = runProps => {
    const { results, algorithm } = runProps;
    const { algorithmName } = algorithm;
    // TODO -> It would be good for an application to register key value pairs for
    // the algorithmName and the command to delegate to.

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
        // TODO -> It would be nice in the the future we didn't need this for the AI Predicitons,
        // and we can somehow put all these within the MeasurementService, but we aren't there yet with OHIF.
        // TODO -> This should probs be calling a command which then calls the ExternalAlgorithmService
        console.log('Update Disease prediction result from', results);
        ExternalAlgorithmService.setExternalAlgorithmResult(results);
        break;
      case 'StoreReport':
        // do nothing with result.
        break;
      default:
        throw new Error(
          `No handler for algorithm results for ${algorithmName}`
        );
    }
  };

  const getJSONResults = (xhr: XMLHttpRequest) => {
    let results;
    try {
      results = JSON.parse(xhr.response);
    } catch {
      results = xhr.response;
    }
    return results;
  };

  const actions = {
    runExternalAlgorithm,
    initiateExternalAlgorithm,
    progressExternalAlgorithm,
    completeExternalAlgorithm,
  };

  const definitions = {
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
    progressExternalAlgorithm: {
      commandFn: actions.progressExternalAlgorithm,
      storeContexts: [],
      options: {},
    },
    completeExternalAlgorithm: {
      commandFn: actions.completeExternalAlgorithm,
      storeContexts: [],
      options: {},
    },
  };

  return { actions, definitions };
}
