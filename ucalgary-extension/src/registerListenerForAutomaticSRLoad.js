import { DicomMetadataStore } from '@ohif/core';

function onAllInstancesLoaded({ commandsManager }, { study }) {
  commandsManager.runCommand(
    'importReport',
    {
      study,
    },
    'CORNERSTONE'
  );
}

export default function registerListenerForAutomaticSRLoad({
  commandsManager,
}) {
  DicomMetadataStore.subscribe(
    DicomMetadataStore.EVENTS.ALL_INSTANCES_LOADED,
    evtDetail => onAllInstancesLoaded({ commandsManager }, evtDetail)
  );
}
