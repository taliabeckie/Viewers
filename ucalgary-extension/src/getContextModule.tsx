import React from 'react';
import {
  ExternalAlgorithmContext,
  ExternalAlgorithmContextProvider,
  useExternalAlgorithm,
} from './contexts';

function getContextModule({ servicesManager }) {
  const { ExternalAlgorithmService } = servicesManager.services;

  return [
    {
      name: 'ExternalAlgorithmContext',
      context: ExternalAlgorithmContext,
      provider: ({ children, ...props }) => (
        <ExternalAlgorithmContextProvider service={ExternalAlgorithmService} {...props}>
          {children}
        </ExternalAlgorithmContextProvider>
      ),
    },
  ];
}

export { useExternalAlgorithm };
export default getContextModule;
