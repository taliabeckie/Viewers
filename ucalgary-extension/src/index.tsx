import configureTools from './configureTools';
import getContextModule from './getContextModule';
//import getPanelModule from './getPanelModule';
import { id } from './id';
import commandsModule from './modules/commandsModule';
//import registerListenerForAutomaticSRLoad from './registerListenerForAutomaticSRLoad';
import ExternalAlgorithmService from './services/ExternalAlgorithmService';

export default {
  id,

  preRegistration: ({ servicesManager, commandsManager, configuration = {} }) => {
    servicesManager.registerService(ExternalAlgorithmService);
    configureTools();
    //registerListenerForAutomaticSRLoad({ commandsManager });
  },

  // getPanelModule: ({ servicesManager, commandsManager, extensionManager }) => {},

  getCommandsModule: ({ servicesManager, commandsManager, extensionManager }) => {
    return commandsModule({
      servicesManager,
      commandsManager,
      extensionManager,
    });
  },

  getContextModule,
};
