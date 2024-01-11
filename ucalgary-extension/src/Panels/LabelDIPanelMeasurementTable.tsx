import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { MeasurementTable, Dialog, Input, useViewportGrid, Button } from '@ohif/ui';
import ActionButtons from './ActionButtons';
import debounce from 'lodash.debounce';
import ResultChart from '../external-algorithm/resultChart/ResultChart';
import ConfigPoint from 'config-point';
import ResultReportItem from '../external-algorithm/resultReport/ResultReportItem';
import { useExternalAlgorithm } from '../contexts';
import { blue } from '@mui/material/colors';
import Label from '../../../../platform/ui/src/components/Label/Label';
import { light } from '@mui/material/styles/createPalette';
// Custom Panel Measurement Table for LabelDI

// tools with measurements to display inside the panel
const MEASUREMENT_TOOLS = [
  'EllipticalROI',
  'RectangleROI',
  'Length',
  'Bidirectional',
  'PlanarFreehandROI',
  'Fiducial',
  'ArrowAnnotate',
];

export default function LabelDIPanelMeasurementTable({
  servicesManager,
  commandsManager,
  extensionManager,
}) {
  const [viewportGrid, viewportGridService] = useViewportGrid();
  const { MeasurementService, UIDialogService } = servicesManager.services;
  const [displayMeasurements, setDisplayMeasurements] = useState([]);
  const [{ reports = [], sortInfo: reportsSortInfo }] = useExternalAlgorithm([]);

  useEffect(() => {
    const debouncedSetDisplayMeasurements = debounce(setDisplayMeasurements, 100);
    // ~~ Initial
    setDisplayMeasurements(_getMappedMeasurements(MeasurementService));

    // ~~ Subscription
    const added = MeasurementService.EVENTS.MEASUREMENT_ADDED;
    const addedRaw = MeasurementService.EVENTS.RAW_MEASUREMENT_ADDED;
    const updated = MeasurementService.EVENTS.MEASUREMENT_UPDATED;
    const removed = MeasurementService.EVENTS.MEASUREMENT_REMOVED;
    const cleared = MeasurementService.EVENTS.MEASUREMENTS_CLEARED;
    const subscriptions = [];

    [added, addedRaw, updated, removed, cleared].forEach(evt => {
      subscriptions.push(
        MeasurementService.subscribe(evt, () => {
          debouncedSetDisplayMeasurements(_getMappedMeasurements(MeasurementService));
        }).unsubscribe
      );
    });

    return () => {
      subscriptions.forEach(unsub => {
        unsub();
      });
      debouncedSetDisplayMeasurements.cancel();
    };
  }, []);

  const jumpToImage = ({ uid, isActive }) => {
    MeasurementService.jumpToMeasurement(viewportGrid.activeViewportIndex, uid);
    const measurement = MeasurementService.getMeasurement(uid);

    if (!measurement.blackListActions || !measurement.blackListActions.includes('activate')) {
      onMeasurementItemClickHandler({ uid, isActive });
    }
  };

  const onMeasurementItemEditHandler = ({ uid, isActive }) => {
    const measurement = MeasurementService.getMeasurement(uid);
    //Todo: why we are jumping to image?
    // jumpToImage({ id, isActive });

    const onSubmitHandler = ({ action, value }) => {
      switch (action.id) {
        case 'save': {
          MeasurementService.update(
            uid,
            {
              ...measurement,
              ...value,
            },
            true
          );
        }
      }
      UIDialogService.dismiss({ id: 'enter-annotation' });
    };

    UIDialogService.create({
      id: 'enter-annotation',
      centralize: true,
      isDraggable: false,
      showOverlay: true,
      content: Dialog,
      contentProps: {
        title: 'Custom Label',
        noCloseButton: true,
        value: { label: measurement.label || '' },
        body: ({ value, setValue }) => {
          const onChangeHandler = event => {
            event.persist();
            setValue(value => ({ ...value, label: event.target.value }));
          };

          const onKeyPressHandler = event => {
            if (event.key === 'Enter') {
              onSubmitHandler({ value, action: { id: 'save' } });
            }
          };
          return (
            <div className="bg-primary-dark p-4">
              <Input
                autoFocus
                className="border-primary-main mt-2 bg-black"
                type="text"
                containerClassName="mr-2"
                value={value.label}
                onChange={onChangeHandler}
                onKeyPress={onKeyPressHandler}
              />
            </div>
          );
        },
        actions: [
          // temp: swap button types until colors are updated
          { id: 'cancel', text: 'Cancel', type: 'primary' },
          { id: 'save', text: 'Save', type: 'secondary' },
        ],
        onSubmit: onSubmitHandler,
      },
    });
  };

  const onMeasurementItemClickHandler = ({ uid, isActive }) => {
    commandsManager.runCommand('setMeasurementsActiveProp', {
      uids: [uid],
      value: !isActive,
    });
  };

  const onChangeVisibilityHandler = ({ uid }, valueTypes) => {
    commandsManager.runCommand('toggleMeasurementsVisibility', {
      uids: uid ? [uid] : undefined,
      valueTypes,
    });
  };

  const onMeasurementDeleteHandler = ({ uid }) => {
    commandsManager.runCommand('deleteMeasurement', {
      uid,
      showConfirmationModal: true,
    });
  };

  //PHASELABEL TB
  const handleInputChange = e => {
    // Ensure that the input only allows integers
    const value = e.target.value.replace(/[^0-9]/g, '');
    setInputValue(value);
  };
  const handleInputChange2 = e => {
    // Ensure that the input only allows integers
    const value = e.target.value.replace(/[^0-9]/g, '');
    setInputValue2(value);
  };

  const aiResultsProps = _mapReportToDisplay(reports, reportsSortInfo);
  const [inputValue, setInputValue] = useState(''); //PHASELABELBUTTON TB
  const [inputValue2, setInputValue2] = useState(''); //PHASELABELBUTTON TB

  return (
    <>
      <div
        className={`${
          aiResultsProps?.items?.length ? 'flex-grow ' : ''
        }overflow-x-hidden invisible-scrollbar overflow-y-auto`}
        data-cy={'measurements-panel'}
      >
        <MeasurementTable
          title="Labels"
          amount={displayMeasurements.length}
          data={displayMeasurements}
          onClick={jumpToImage}
          onEdit={onMeasurementItemEditHandler}
          onChangeVisibility={onChangeVisibilityHandler}
          onDelete={onMeasurementDeleteHandler}
        />
      </div>
      <div className="bg-secondary-main flex justify-between px-2 py-1">
        <span className="text-base font-bold uppercase tracking-widest text-white">
          {'LabelDi Phases'}
        </span>
      </div>

      <div>
        <Label
          children="End-Diastole:"
          color="hoverless"
          size="small"
          rounded="small"
          variant="text"
          fullWidth={false}
        />
        <input
          type="text"
          id="integerInput"
          value={inputValue}
          onChange={handleInputChange}
          maxLength={2}
          min={0}
          autoFocus={true}
          size={6}
        />

        <Label
          children="End-Systole:"
          color="hoverless"
          disabled={true}
          size="small"
          rounded="small"
          variant="text"
          fullWidth={false}
        />
        <input
          type="text"
          id="integerInput"
          value={inputValue2}
          onChange={handleInputChange2}
          maxLength={2}
          min={0}
          autoFocus={true}
          size={6}
        />
      </div>

      <div className="flex flex-grow-0 justify-center p-4">
        <ActionButtons commandsManager={commandsManager} servicesManager={servicesManager} />
      </div>

      {(aiResultsProps?.items?.length || aiResultsProps?.reportInfos?.length) && (
        <div className="text-primary-light flex flex-grow-0 justify-center p-2 uppercase">
          Results
        </div>
      )}
      {aiResultsProps?.items?.length && (
        <div className="invisible-scrollbar flex-grow overflow-y-auto overflow-x-hidden">
          <ResultChart {...aiResultsProps}></ResultChart>
        </div>
      )}
      {aiResultsProps?.reportInfos?.length && (
        <div className="flex-grow-0">
          <ResultReportItem {...aiResultsProps}></ResultReportItem>
        </div>
      )}
    </>
  );
}

LabelDIPanelMeasurementTable.propTypes = {
  servicesManager: PropTypes.shape({
    services: PropTypes.shape({
      MeasurementService: PropTypes.shape({
        getMeasurements: PropTypes.func.isRequired,
        subscribe: PropTypes.func.isRequired,
        EVENTS: PropTypes.object.isRequired,
        VALUE_TYPES: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired,
  }).isRequired,
  commandsManager: PropTypes.shape({
    runCommand: PropTypes.func.isRequired,
  }).isRequired,
};

function _getMappedMeasurements(MeasurementService) {
  const measurements = MeasurementService.getMeasurements();
  // filter out measurements whose toolName is not in MEASUREMENT_TOOLS
  const measurementTools = measurements.filter(measurement =>
    MEASUREMENT_TOOLS.includes(measurement.toolName)
  );

  const mappedMeasurements = measurementTools.map((m, index) =>
    _mapMeasurementToDisplay(m, index, MeasurementService.VALUE_TYPES)
  );

  return mappedMeasurements;
}

function _mapMeasurementToDisplay(measurement, index, types) {
  const {
    uid,
    label,
    type,
    displayText, // Reference IDs
    active,
    visible,
    finding,
    findingSite,
    color,
  } = measurement;

  const getFindingText = (...params) => {
    const [first, ...rest] = params || [];
    const otherTexts = rest.filter(value => !!value);

    if (!first || !first.text) {
      if (otherTexts && otherTexts.length) {
        return getFindingText(...otherTexts);
      }

      return;
    }

    return first.text + (!otherTexts.length ? '' : ` /${getFindingText(...otherTexts)}`);
  };

  const _findingText = getFindingText(finding, findingSite);
  const _label = label || _findingText || '(empty)';

  const prefix = (_findingText && label && [_findingText]) || [];
  const _displayText = [...prefix, ...(displayText || [])];

  return {
    uid,
    label: _label,
    measurementType: type,
    color: color,
    displayText: _displayText,
    active,
    visible,
  };
}

function _mapReportToDisplay(reports = [], reportsSortInfo = {}) {
  const { results = {} } = ConfigPoint.getConfig('externalAlgorithm') || {};
  const { colorify } = results;
  const latestPredictions = reports[0] || {};
  const { label: predictionLabel, measurements: predictionItems } = latestPredictions;

  /**
   * Returns the most valuable report. I.e the first item on predictionItems
   * @param predictionItems
   * @param sortInfo
   * @returns
   */
  function mostValuableReport(predictionItems = [], sortInfo = {}) {
    const mostlyItem = predictionItems[0];

    if (!mostlyItem) {
      return [];
    }

    return [
      {
        label: sortInfo.desc,
        values: [mostlyItem.text || mostlyItem.label],
        valuesClassName: 'text-yellow-400',
      },
      {
        label: 'Probability',
        values: [mostlyItem.score],
        valuesClassName: 'text-yellow-400',
      },
      { label: 'Trained from', values: [...(mostlyItem.trainedFrom || [])] },
    ];
  }

  return {
    colorify,
    title: predictionLabel,
    items: predictionItems,
    reportInfos: mostValuableReport(predictionItems, reportsSortInfo),
  };
}
