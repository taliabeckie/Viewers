import React from 'react';
import { LabelDIPanelMeasurementTable, LabelDIWrappedPanelStudyBrowser } from './Panels';

function getPanelModule({ commandsManager, servicesManager, extensionManager }) {
  const wrappedWorkspacePanel = () => {
    return (
      <LabelDIPanelMeasurementTable
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
      />
    );
  };
  const wrappedStudyBrowserPanel = () => {
    return (
      <LabelDIWrappedPanelStudyBrowser
        commandsManager={commandsManager}
        servicesManager={servicesManager}
        extensionManager={extensionManager}
      />
    );
  };

  return [
    {
      name: 'measure',
      iconName: 'list-bullets',
      iconLabel: '',
      label: 'Workspace',
      component: wrappedWorkspacePanel,
    },
    {
      name: 'seriesList',
      iconName: 'group-layers',
      iconLabel: 'Studies',
      label: 'Studies',
      component: wrappedStudyBrowserPanel,
    },
  ];
}

export default getPanelModule;
