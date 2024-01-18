import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { utils, ServicesManager } from '@ohif/core';
import { MeasurementTable, Dialog, Input, useViewportGrid, ButtonEnums } from '@ohif/ui';
import ActionButtons from './ActionButtons';
import debounce from 'lodash.debounce';
import ConfigPoint from 'config-point';
import Label from '../../../../platform/ui/src/components/Label/Label';
import { useExternalAlgorithm } from '../contexts';

import createReportDialogPrompt, {
  CREATE_REPORT_DIALOG_RESPONSE,
} from './createReportDialogPrompt';
import createReportAsync from '../Actions/createReportAsync';
import findSRWithSameSeriesDescription from '../utils/findSRWithSameSeriesDescription';

const { downloadCSVReport } = utils;

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

export default function PanelMeasurementTable({
  servicesManager,
  commandsManager,
  extensionManager,
}): React.FunctionComponent {
  const { t } = useTranslation('MeasurementTable');

  const [viewportGrid, viewportGridService] = useViewportGrid();
  const { activeViewportId, viewports } = viewportGrid;
  const { measurementService, uiDialogService, uiNotificationService, displaySetService } = (
    servicesManager as ServicesManager
  ).services;
  const [displayMeasurements, setDisplayMeasurements] = useState([]);

  useEffect(() => {
    const debouncedSetDisplayMeasurements = debounce(setDisplayMeasurements, 100);
    // ~~ Initial
    setDisplayMeasurements(_getMappedMeasurements(measurementService));

    // ~~ Subscription
    const added = measurementService.EVENTS.MEASUREMENT_ADDED;
    const addedRaw = measurementService.EVENTS.RAW_MEASUREMENT_ADDED;
    const updated = measurementService.EVENTS.MEASUREMENT_UPDATED;
    const removed = measurementService.EVENTS.MEASUREMENT_REMOVED;
    const cleared = measurementService.EVENTS.MEASUREMENTS_CLEARED;
    const subscriptions = [];

    [added, addedRaw, updated, removed, cleared].forEach(evt => {
      subscriptions.push(
        measurementService.subscribe(evt, () => {
          debouncedSetDisplayMeasurements(_getMappedMeasurements(measurementService));
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

  async function exportReport() {
    const measurements = measurementService.getMeasurements();

    downloadCSVReport(measurements, measurementService);
  }

  async function clearMeasurements() {
    measurementService.clearMeasurements();
  }

  async function createReport(): Promise<any> {
    // filter measurements that are added to the active study
    const activeViewport = viewports.get(activeViewportId);
    const measurements = measurementService.getMeasurements();
    const displaySet = displaySetService.getDisplaySetByUID(
      activeViewport.displaySetInstanceUIDs[0]
    );
    const trackedMeasurements = measurements.filter(
      m => displaySet.StudyInstanceUID === m.referenceStudyUID
    );

    if (trackedMeasurements.length <= 0) {
      uiNotificationService.show({
        title: 'No Measurements',
        message: 'No Measurements are added to the current Study.',
        type: 'info',
        duration: 3000,
      });
      return;
    }

    const promptResult = await createReportDialogPrompt(uiDialogService, {
      extensionManager,
    });

    if (promptResult.action === CREATE_REPORT_DIALOG_RESPONSE.CREATE_REPORT) {
      const dataSources = extensionManager.getDataSources(promptResult.dataSourceName);
      const dataSource = dataSources[0];

      const SeriesDescription =
        // isUndefinedOrEmpty
        promptResult.value === undefined || promptResult.value === ''
          ? 'Research Derived Series' // default
          : promptResult.value; // provided value

      // Reuse an existing series having the same series description to avoid
      // creating too many series instances.
      const options = findSRWithSameSeriesDescription(SeriesDescription, displaySetService);

      const getReport = async () => {
        return commandsManager.runCommand(
          'storeMeasurements',
          {
            measurementData: trackedMeasurements,
            dataSource,
            additionalFindingTypes: ['ArrowAnnotate'],
            options,
          },
          'CORNERSTONE_STRUCTURED_REPORT'
        );
      };

      return createReportAsync({ servicesManager, getReport });
    }
  }

  const jumpToImage = ({ uid, isActive }) => {
    measurementService.jumpToMeasurement(viewportGrid.activeViewportId, uid);

    onMeasurementItemClickHandler({ uid, isActive });
  };

  const onMeasurementItemEditHandler = ({ uid, isActive }) => {
    const measurement = measurementService.getMeasurement(uid);
    //Todo: why we are jumping to image?
    // jumpToImage({ id, isActive });

    const onSubmitHandler = ({ action, value }) => {
      switch (action.id) {
        case 'save': {
          measurementService.update(
            uid,
            {
              ...measurement,
              ...value,
            },
            true
          );
        }
      }
      uiDialogService.dismiss({ id: 'enter-annotation' });
    };

    uiDialogService.create({
      id: 'enter-annotation',
      centralize: true,
      isDraggable: false,
      showOverlay: true,
      content: Dialog,
      contentProps: {
        title: 'Annotation',
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
            <Input
              label="Enter your annotation"
              labelClassName="text-white text-[14px] leading-[1.2]"
              autoFocus
              id="annotation"
              className="border-primary-main bg-black"
              type="text"
              value={value.label}
              onChange={onChangeHandler}
              onKeyPress={onKeyPressHandler}
            />
          );
        },
        actions: [
          { id: 'cancel', text: 'Cancel', type: ButtonEnums.type.secondary },
          { id: 'save', text: 'Save', type: ButtonEnums.type.primary },
        ],
        onSubmit: onSubmitHandler,
      },
    });
  };

  const onMeasurementItemClickHandler = ({ uid, isActive }) => {
    if (!isActive) {
      const measurements = [...displayMeasurements];
      const measurement = measurements.find(m => m.uid === uid);

      measurements.forEach(m => (m.isActive = m.uid !== uid ? false : true));
      measurement.isActive = true;
      setDisplayMeasurements(measurements);
    }
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

  const handleCheckMarkClick = () => {
    // Handle checkmark click event
    setIsCheckMarkSelected(!isCheckMarkSelected);
    setIsEditSelected(false);
  };
  const handleCheckMarkClick2 = () => {
    // Handle checkmark click event
    setIsCheckMarkSelected2(true);
    setIsEditSelected2(false);
  };

  const handleEditClick = () => {
    // Handle edit click
    setIsEditSelected(true); //disable the edit icon and enable Input editing
    setIsCheckMarkSelected(false);
  };
  const handleEditClick2 = () => {
    // Handle edit click
    setIsEditSelected2(true); //disable the edit icon and enable Input editing
    setIsCheckMarkSelected2(false);
  };

  //const aiResultsProps = _mapReportToDisplay(reports, reportsSortInfo);
  const [inputValue, setInputValue] = useState(''); //PHASELABELBUTTON TB
  const [inputValue2, setInputValue2] = useState(''); //PHASELABELBUTTON TB
  const [isCheckMarkSelected, setIsCheckMarkSelected] = useState(false);
  const [isCheckMarkSelected2, setIsCheckMarkSelected2] = useState(false);
  const [isEditSelected, setIsEditSelected] = useState(false);
  const [isEditSelected2, setIsEditSelected2] = useState(false);

  return (
    <>
      <div
        className="ohif-scrollbar overflow-y-auto overflow-x-hidden"
        data-cy={'measurements-panel'}
      >
        <MeasurementTable
          title={t('Labels')}
          servicesManager={servicesManager}
          amount={displayMeasurements.length}
          data={displayMeasurements}
          onClick={jumpToImage}
          onEdit={onMeasurementItemEditHandler}
          onChangeVisibility={onChangeVisibilityHandler}
          onDelete={onMeasurementDeleteHandler}
        />
      </div>
      <div className="bg-secondary-main flex justify-between px-2 py-1">
        <span className="text-base font-bold uppercase tracking-widest text-white">{'Phases'}</span>
      </div>

      <div>
        <Label
          autofocus
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
          disabled={inputValue !== '' && isCheckMarkSelected}
          style={{
            height: '18px',
            borderRadius: '3px',
            fontFamily: 'sans-serif',
            width: '40px',
            fontSize: '13px',
            fontWeight: '400',
            textAlign: 'center',
            color: '#6fbde2',
          }}
        />
        <span
          role="img"
          aria-label="Checkmark"
          onClick={handleCheckMarkClick}
          style={{
            cursor: 'pointer',
            fontSize: '12px',
            marginLeft: '8px',
            visibility: inputValue !== '' && !isCheckMarkSelected ? 'visible' : 'hidden',
            color: '#6fbde2',
          }}
        >
          &#x2713;
        </span>
        {/* Edit symbol (pencil) - Visible when checkmark disappears */}
        {inputValue !== '' && isCheckMarkSelected && (
          <span
            role="img"
            aria-label="Edit"
            onClick={handleEditClick}
            style={{
              cursor: 'pointer',
              fontSize: '13px',
              marginLeft: '0px',
              visibility: isCheckMarkSelected && !isEditSelected ? 'visible' : 'hidden',
              color: '#6fbde2',
            }}
          >
            &#x270E;
          </span>
        )}

        <Label
          autofocus
          children="End-Systole:"
          color="hoverless"
          disabled={true}
          size="small"
          rounded="small"
          variant="text"
          fullWidth={false}
        />
        <input //add ability to disable entries
          type="text"
          id="integerInput"
          value={inputValue2}
          onChange={handleInputChange2}
          maxLength={2}
          min={0}
          autoFocus={true}
          size={6}
          disabled={isEditSelected2 ? false : inputValue2 !== '' && isCheckMarkSelected2}
          style={{
            height: '18px',
            borderRadius: '3px',
            fontFamily: 'sans-serif',
            width: '40px',
            fontSize: '13px',
            fontWeight: '400',
            textAlign: 'center',
            color: '#6fbde2',
          }}
        />
        <span
          role="img"
          aria-label="Checkmark"
          onClick={handleCheckMarkClick2}
          style={{
            cursor: 'pointer',
            fontSize: '13px',
            marginLeft: '8px',
            visibility: inputValue2 !== '' && !isCheckMarkSelected2 ? 'visible' : 'hidden',
            color: '#6fbde2',
          }}
        >
          &#x2713;
        </span>

        {/* Edit symbol (pencil) - Visible when checkmark disappears */}
        {inputValue2 !== '' && isCheckMarkSelected2 && (
          <span
            role="img"
            aria-label="Edit"
            onClick={handleEditClick2}
            style={{
              cursor: 'pointer',
              fontSize: '12px',
              marginLeft: '0px',
              visibility: isCheckMarkSelected2 && !isEditSelected2 ? 'visible' : 'hidden',
              color: '#6fbde2',
            }}
          >
            &#x270E;
          </span>
        )}
      </div>

      <div className="flex justify-center p-4">
        <ActionButtons
          onExportClick={exportReport}
          onClearMeasurementsClick={clearMeasurements}
          onCreateReportClick={createReport}
        />
      </div>
    </>
  );
}

PanelMeasurementTable.propTypes = {
  servicesManager: PropTypes.instanceOf(ServicesManager).isRequired,
};

function _getMappedMeasurements(measurementService) {
  const measurements = measurementService.getMeasurements();

  const mappedMeasurements = measurements.map((m, index) =>
    _mapMeasurementToDisplay(m, index, measurementService.VALUE_TYPES)
  );

  return mappedMeasurements;
}

/**
 * Map the measurements to the display text.
 * Adds finding and site information to the displayText and/or label,
 * and provides as 'displayText' and 'label', while providing the original
 * values as baseDisplayText and baseLabel
 */
function _mapMeasurementToDisplay(measurement, index, types) {
  const {
    displayText: baseDisplayText,
    uid,
    label: baseLabel,
    type,
    selected,
    findingSites,
    finding,
  } = measurement;

  const firstSite = findingSites?.[0];
  const label = baseLabel || finding?.text || firstSite?.text || '(empty)';
  let displayText = baseDisplayText || [];
  if (findingSites) {
    const siteText = [];
    findingSites.forEach(site => {
      if (site?.text !== label) {
        siteText.push(site.text);
      }
    });
    displayText = [...siteText, ...displayText];
  }
  if (finding && finding?.text !== label) {
    displayText = [finding.text, ...displayText];
  }

  return {
    uid,
    label,
    baseLabel,
    measurementType: type,
    displayText,
    baseDisplayText,
    isActive: selected,
    finding,
    findingSites,
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
