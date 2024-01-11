import supportedTools from './constants/supportedTools';

/**
 * Object to store registered Custom Tools Factory.
 */
const customToolsMappingFactory = {};

/**
 * Ensure customToolFactory is a valid one.
 * It validates if object has the methods: toAnnotation, toMeasurement and getMatchingCriteriaArray
 *
 * @param {Object} customToolFactory
 * @returns boolean whether factory is valid or not.
 */
function assertCustomToolMappingFactory(customToolFactory = {}) {
  const hasMethod = methodName =>
    methodName in customToolFactory &&
    typeof customToolFactory[methodName] === 'function';
  return (
    hasMethod('toAnnotation') &&
    hasMethod('toMeasurement') &&
    hasMethod('getMatchingCriteriaArray')
  );
}

/**
 * Add the toolName to the list of supportedTools
 * @param {string} toolName
 */
function registerSupportedTool(toolName) {
  if (!supportedTools.includes(toolName)) {
    supportedTools.push(toolName);
  }
}

/**
 * Register a new customToolFactory associated to the given toolName.
 *
 * @param {string} toolName
 * @param {object} factoryToAdd
 * @returns boolean whether operation succeeds or not.
 */
function registerCustomToolsMappingFactory(toolName, factoryToAdd) {
  if (assertCustomToolMappingFactory(factoryToAdd)) {
    registerSupportedTool(toolName);
    customToolsMappingFactory[toolName] = factoryToAdd;

    return true;
  }

  return false;
}

function getCustomToolsMappingFactory() {
  return { ...customToolsMappingFactory };
}

export { registerCustomToolsMappingFactory, getCustomToolsMappingFactory };
