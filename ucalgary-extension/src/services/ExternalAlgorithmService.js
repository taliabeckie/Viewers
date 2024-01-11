const name = 'ExternalAlgorithmService';

const publicAPI = {
  name,
  getState: _getState,
  setExternalAlgorithmResult: _setExternalAlgorithmResult,
  clearResults: _clearResults,
  setServiceImplementation,
};

const serviceImplementation = {
  _getState: () => console.warn('getState() NOT IMPLEMENTED'),
  _setExternalAlgorithmResult: () =>
    console.warn('setExternalAlgorithmResult() NOT IMPLEMENTED'),
  _clearResults: () =>
    console.warn('clearResults() NOT IMPLEMENTED'),
};

function _getState() {
  return serviceImplementation._getState();
}

function _setExternalAlgorithmResult(result) {
  return serviceImplementation._setExternalAlgorithmResult(result);
}

function _clearResults(result) {
  return serviceImplementation._clearResults(result);
}

function setServiceImplementation({
  getState: getStateImplementation,
  setExternalAlgorithmResult: setExternalAlgorithmResultImplementation,
  clearResults: clearResultsImplementation,
}) {
  if (getStateImplementation) {
    serviceImplementation._getState = getStateImplementation;
  }
  if (setExternalAlgorithmResultImplementation) {
    serviceImplementation._setExternalAlgorithmResult = setExternalAlgorithmResultImplementation;
  }
  if (clearResultsImplementation) {
    serviceImplementation._clearResults = clearResultsImplementation;
  }
}

export default {
  name,
  create: ({ configuration = {} }) => {
    return publicAPI;
  },
};
