import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import PropTypes from 'prop-types';
import cloneDeep from 'lodash.clonedeep';

const DEFAULT_STATE = {
  // measurements are sorted by default by score
  reports: [],
  sortInfo: {
    method: mostLikelySort,
    desc: 'Most likely diagnosis',
  },
};

function sortDataBy(array, compareMethod) {
  return array.sort(compareMethod);
}

function mostLikelySort(itemA, itemB) {
  return itemB.score - itemA.score;
}

const ExternalAlgorithmContext = createContext(DEFAULT_STATE);

export default function ExternalAlgorithmContextProvider({
  children,
  service,
}) {
  const reducer = (state, action) => {
    switch (action.type) {
      case 'SET_EXTERNAL_ALGORITHM_RESULT': {
        // TODO once there is api integration we can handle it properly as per React concerns.
        const { structuredReport } = action.payload;

        const previousState = cloneDeep(state);
        const previousReports = cloneDeep(previousState.reports);
        const latestReport = cloneDeep(structuredReport);

        sortDataBy(latestReport.measurements, mostLikelySort);

        return {
          ...previousState,
          reports: [latestReport, ...previousReports],
        };
      }
      case 'CLEAR_RESULTS': {
        const defaultState = cloneDeep(DEFAULT_STATE);

        return {
          ...defaultState,
        };
      }
      default:
        return action.payload;
    }
  };

  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);

  const getState = useCallback(() => state, [state]);

  const setExternalAlgorithmResult = useCallback(
    result =>
      dispatch({
        type: 'SET_EXTERNAL_ALGORITHM_RESULT',
        payload: {
          ...result,
        },
      }),
    [dispatch]
  );

  const clearResults = useCallback(
    () =>
      dispatch({
        type: 'CLEAR_RESULTS',
      }),
    [dispatch]
  );

  /**
   * Sets the implementation of a modal service that can be used by extensions.
   *
   * @returns void
   */
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({
        getState,
        setExternalAlgorithmResult,
        clearResults,
      });
    }
  }, [getState, service, setExternalAlgorithmResult, clearResults]);

  const api = {
    getState,
    setExternalAlgorithmResult,
    clearResults,
  };

  return (
    <ExternalAlgorithmContext.Provider value={[state, api]}>
      {children}
    </ExternalAlgorithmContext.Provider>
  );
}

ExternalAlgorithmContextProvider.propTypes = {
  children: PropTypes.any,
  service: PropTypes.shape({
    setServiceImplementation: PropTypes.func,
  }).isRequired,
};

const useExternalAlgorithm = () => useContext(ExternalAlgorithmContext);

export {
  ExternalAlgorithmContext,
  ExternalAlgorithmContextProvider,
  useExternalAlgorithm,
};
