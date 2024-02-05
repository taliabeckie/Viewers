import supportedTools from './constants/supportedTools';

// interface CustomToolFactory {
//   toAnnotation: (data: any) => any;
//   toMeasurement: (data: any) => any;
//   getMatchingCriteriaArray: () => Array<any>;
// }

interface CustomToolFactory {
  toAnnotation: (data: any) => any; // Update the types as needed
  toMeasurement: (
    csToolsAnnotation: any, // Update the types as needed
    displaySetService: any, // Update the types as needed
    cornerstoneViewportService: any, // Update the types as needed
    getValueTypeFromToolType: (toolName: string) => string
  ) => any;
  getMatchingCriteriaArray: (measurementService: MeasurementService) => Array<any>; // Update the types as needed
}

/**
 * Object to store registered Custom Tools Factory.
 */
const customToolsMappingFactory: { [toolName: string]: CustomToolFactory } = {};

/**
 * Ensure customToolFactory is a valid one.
 * It validates if object has the methods: toAnnotation, toMeasurement and getMatchingCriteriaArray
 *
 * @param {CustomToolFactory} customToolFactory
 * @returns boolean whether factory is valid or not.
 */
function assertCustomToolMappingFactory(customToolFactory: CustomToolFactory): boolean {
  const hasMethod = (methodName: keyof CustomToolFactory) =>
    methodName in customToolFactory && typeof customToolFactory[methodName] === 'function';
  return (
    hasMethod('toAnnotation') && hasMethod('toMeasurement') && hasMethod('getMatchingCriteriaArray')
  );
}

/**
 * Add the toolName to the list of supportedTools
 * @param {string} toolName
 */
function registerSupportedTool(toolName: string): void {
  if (!supportedTools.includes(toolName)) {
    supportedTools.push(toolName);
    console.log('SUPPORTED TOOL: ');
    console.log(toolName);
  }
}

/**
 * Register a new customToolFactory associated to the given toolName.
 *
 * @param {string} toolName
 * @param {CustomToolFactory} factoryToAdd
 * @returns boolean whether operation succeeds or not.
 */
function registerCustomToolsMappingFactory(
  toolName: string,
  factoryToAdd: CustomToolFactory
): boolean {
  if (assertCustomToolMappingFactory(factoryToAdd)) {
    registerSupportedTool(toolName);
    console.log('MAPPING FACTORY REGISTERED FOR: ');
    console.log(toolName);
    customToolsMappingFactory[toolName] = factoryToAdd;

    return true;
  }

  return false;
}

function getCustomToolsMappingFactory(): { [toolName: string]: CustomToolFactory } {
  console.log('CUSTOM TOOL MAPPING FACTORY: ');
  console.log(customToolsMappingFactory);
  return { ...customToolsMappingFactory };
}

export { registerCustomToolsMappingFactory, getCustomToolsMappingFactory };
