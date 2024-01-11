import { toolNames } from './initCornerstoneTools';
import { registerCustomToolsMappingFactory } from './utils/measurementServiceMappings/customToolsMappingFactory';
import * as csTools from '@cornerstonejs/tools';

const { BaseTool } = csTools;

/**
 * Object to store registered Custom Tools (classes)
 */
const customTools = {};

/**
 * Auxiliary class to store original customTools/toolNames to be restore on a fallback approach.
 */
class CustomToolCache {
  constructor() {
    this.customTools = {};
    this.toolNames = {};
  }

  setTo(toolName, from, to) {
    if (from[toolName]) {
      to[toolName] = from[toolName];
    }
  }

  addToCache(CustomTool) {
    const { toolName } = CustomTool;

    this.setTo(toolName, customTools, this.customTools);
    this.setTo(toolName, toolNames, this.toolNames);
  }

  revertFromCache() {
    const { toolName } = CustomTool;

    this.setTo(toolName, this.customTools, customTools);
    this.setTo(toolName, this.toolNames, toolNames);
  }
}

/**
 * Used to revert the process of registering a custom tool.
 */
const customToolCache = new CustomToolCache();

/**
 * Ensure CustomTool class is valid to be considered.
 * A CustomToolClass has to be an class that inherits from cs3d BaseTool.
 * @param {*} CustomToolClass
 * @returns
 */
function assertValidCustomCS3DTool(CustomToolClass, toolName) {
  if (
    !CustomToolClass ||
    !(CustomToolClass.prototype instanceof Object) ||
    typeof CustomToolClass.constructor !== 'function' ||
    CustomToolClass.toolName !== toolName
  ) {
    return false;
  }
  const entity = new CustomToolClass();

  return entity instanceof BaseTool;
}

/**
 * Stores the custom cornerstone tool and also set the name available at list of possible tools (to be used on the cs3d tools configuration).
 * In case there is a cursor it will already set up it at cs3d layer (which does not cause any impact if custom tool is not set up)
 * @param {Object} CustomTool
 * @param {string} toolName
 * @param {Object} cursor
 * @returns
 */
function addCustomTool(CustomTool, toolName, cursor) {
  if (assertValidCustomCS3DTool(CustomTool, toolName)) {
    customToolCache.addToCache(CustomTool);
    customTools[toolName] = CustomTool;
    toolNames[toolName] = CustomTool.toolName;

    if (cursor) {
      csTools.cursors.registerCursor(toolName, cursor.icon, cursor.viewBox);
    }

    return true;
  }

  return false;
}

/**
 * Returned any existing custom cornerstone tools.
 * @returns Object where property key is the tool name and property value is the tool class.
 */
function getCustomCornerstoneTools() {
  return { ...customTools };
}

/**
 * Register a list of custom tool item. The registration process occurs as following:
 * - Register Custom Cornerstone Tool Class. (it will not set up it right away at cs3d layer, it  will only ensure the tool is considered whenever that happens).
 * - Register Custom Tool Factory.
 *
 * @param {Object[]} tools List of custom tools to be registered.
 */
function registerCustomTools(tools = []) {
  tools.forEach(toolItem => {
    let result = addCustomTool(
      toolItem.CustomTool,
      toolItem.toolName,
      toolItem.cursor
    );

    if (result) {
      result = registerCustomToolsMappingFactory(
        toolItem.toolName,
        toolItem.CustomToolMappingFactory
      );
    }

    if (!result) {
      customToolCache.revertFromCache(toolItem.CustomTool);
      console.warn(
        `Custom tool: ${toolItem.CustomTool.toolName} failed to be registered`
      );
    }
  });
}

export { getCustomCornerstoneTools };

export default registerCustomTools;
