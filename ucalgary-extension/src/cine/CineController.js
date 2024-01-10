function assertDefined(value) {
  return value !== undefined
}

function assertArray(value) {
  return assertDefined(value) && Array.isArray(value) && value.length > 0;
}
/**
 * Cine Controller data structure support.
 * It holds the information for all running cine clip and also each viewport present.
 *
 * It uses a double map strategy which each does:
 * - First map stores all cine clip Id (opId) and all viewport indexes for each clipId. On this map it is also stored the playOptions.
 * - Second map is a reverse mapping, which each viewport index maps to a opId.
 */
class CineControllerMap {
  constructor() {
    // map opIds to viewport indexes
    this.opIdMap = new Map();
    // map viewport index to opId
    this.viewportIndexMap = new Map();
  }

  /**
   * Get opId that the given viewport index is associated with.
   *
   * @param {number} viewportIndex.
   * @returns {number | undefined} opId value or undefined if there isn't any association.
   */
  getViewportOpId(viewportIndex) {
    return this.viewportIndexMap.get(viewportIndex);
  }

  /**
   * Get opId's associated content value by viewport index. The content is a list of associated viewport indexes and the playOptions.
   *
   * @param {number} viewportIndex.
   * @returns {Object | undefined} opId's associated content value or undefined if there isn't any association.
   */
  getOpValueByViewportIndex(viewportIndex) {

    const opId = this.viewportIndexMap.get(viewportIndex);
    const { viewports = [], playOptions } = this.viewportIndexMap.get(opId) || {};

    if (viewports.length === 0 || !playOptions) {
      return;
    }

    const viewport = viewports.find(({ viewportIndex: viewportIndexToCompare }) => viewportIndexToCompare === viewportIndex);

    return { playOptions, viewport };
  }

  /**
   * Get opId's associated content value by op id. The content is a list of associated viewport indexes and the playOptions.
   *
   * @param {number} opId - operation id.
   * @returns {Object | undefined} opId's associated content value or undefined if there isn't any association.
   */
  getOpValueByOpId(opId) {
    return this.opIdMap.get(opId);
  }

  /**
   * Sets a new opId associated with viewports and playOptions.
   *
   * @param {number} opId - operation id.
   * @param {Object[]} viewports - list of viewports to be associated with this operation.
   * @param {Object} playOptions - options to be associated with this operation.
   */
  setOpId(opId, viewports, playOptions) {
    this.deleteByOpId(opId);
    this.opIdMap.set(opId, { viewports, playOptions });

    viewports.forEach(({ viewportIndex }) => this.viewportIndexMap.set(viewportIndex, opId));
  }

  /**
   * It deletes opId from records. It ensures no viewport index points to it.
   *
   * @param {number} opId - operation id.
   * @returns {boolean} Boolean whether operation succeeds or not.
   */
  deleteByOpId(opId) {

    if (this.opIdMap.has(opId)) {

      const { viewports = [] } = this.opIdMap.get(opId);
      this.opIdMap.delete(opId);
      viewports.forEach(({ viewportIndex }) => this.viewportIndexMap.delete(viewportIndex));

      return true;
    }

    return false;
  }

  /**
   * It deletes viewport index from records. It ensures the given viewport index is also removed from any opId association.
   *
   * @param {number} viewportIndex.
   * @returns {boolean} Boolean whether operation succeeds or not.
   */
  deleteByViewportIndex(viewportIndex) {

    if (this.viewportIndexMap.has(viewportIndex)) {
      const opId = this.viewportIndexMap.get(viewportIndex);

      this.viewportIndexMap.delete(viewportIndex);
      const { viewports, ...rest } = this.opIdMap.get(opId);

      // remove viewport index from any opId association.
      const newViewports = viewports.filter(({ viewportIndex: viewportIndexToCompare }) => viewportIndexToCompare !== viewportIndex);
      this.opIdMap.set(opId, { viewports: newViewports, ...rest });

      return true;

    }

    return false;

  }
}

export default class CineController {
  constructor(getNumberOfFrames, autoPlayCallback, minFramesToPlay = 2) {
    this.cineControllerMap = new CineControllerMap();
    this.getNumberOfFrames = getNumberOfFrames;
    this.autoPlayCallback = autoPlayCallback;
    this.minFramesToPlay = minFramesToPlay;
  }

  /**
   * Clear all viewport indexes (of the given viewports) from any existing cine clip.
   * It will clean any operation id if all viewport association is removed for each viewport's opId association.
   *
   * @param {Object[]} viewports - list of viewports to be cleared from any existing cine clip.
   */
  clearAutoPlay(viewports) {
    const opIdsMarkedToRemoved = [];

    // phase 1. delete viewportId map and remove from opId references
    for (const viewport of viewports) {

      const { viewportIndex } = viewport;
      const opId = this.cineControllerMap.getViewportOpId(viewportIndex);

      if (opId) {
        const result = this.cineControllerMap.deleteByViewportIndex(viewportIndex);
        if (result) {
          opIdsMarkedToRemoved.push(opId);
        }
      }
    }

    // phase 2. delete opIds map and clear interval
    for (const opId of opIdsMarkedToRemoved) {
      const opIdValue = this.cineControllerMap.getOpValueByOpId(opId);

      // this should be necessarily true otherwise there is a viewport which is not properly clean up on phase 1.
      if (opIdValue && opIdValue.viewports && opIdValue.viewports.length === 0) {
        const result = this.cineControllerMap.deleteByOpId(opId);
        if (result) {
          clearInterval(opId);
        }
      }
    }
  }

  /**
   * Schedule to auto play cine clip.
   *
   * It ensures there is only one clip running per viewport index.
   * @param {number} direction - play direction value.
   * @param {Object[]} viewports - list of viewports be considered on updating the cine clip.
   * @param {Object} playOptions - options to be associated with this operation.
   */
  scheduleAutoPlay(direction, viewports, playOptions) {

    const viewportsToUpdate = this.filterViewportsToUpdate(viewports, playOptions);

    if (viewportsToUpdate.length === 0) {
      return;
    }

    this.clearAutoPlay(viewportsToUpdate);

    const { frameRate } = playOptions;
    const operationId = setInterval(() => {

      const opIdValue = this.cineControllerMap.getOpValueByOpId(operationId);

      if (!opIdValue) {
        this.cineControllerMap.deleteByOpId(operationId);
        clearInterval(operationId);
        return;
      }

      const opIdViewports = opIdValue.viewports;

      for (const opIdViewport of opIdViewports) {
        const { viewportIndex } = opIdViewport;

        const options = {};
        // allow CS3D to do the math for next index
        options.direction = direction;

        this.autoPlayCallback(viewportIndex, options);
      }
    }, 1000 / Math.abs(frameRate));

    this.cineControllerMap.setOpId(operationId, viewportsToUpdate, playOptions);
  }

  /**
   * Asserts the given playOptions and viewports are valid objects as far as this controller operations is concerned.
   *
   * @param {Object[]} viewports - list of viewports to be checked.
   * @param {Object} playOptions - options to be associated with this operation.
   * @returns {boolean} Boolean whether operation succeeds or not.
   */
  assertValidOptions(viewports, playOptions) {
    const { play } = playOptions;

    // structure test
    if (!assertDefined(play) || !assertArray(viewports)) {
      return false;
    }


    for (const { viewportIndex, displaySetInstanceUIDs } of viewports) {
      if (!assertDefined(viewportIndex) || !assertArray(displaySetInstanceUIDs)) {
        return false;
      }
    }

    return true;
  }

  /**
   * It updates a cine clip instance for the given viewports. Its a all at once operation.
   * Viewports that does not change from existing operation will not be changed, even if its listed in viewports param.
   *
   * @param {number} direction - play direction value.
   * @param {Object[]} viewports - list of viewports be considered on updating the cine clip.
   * @param {Object} playOptions - options to be associated with this operation.
   */
  update(direction, viewports, playOptions) {
    const { play } = playOptions;

    // pre validation to ensure objects has necessary properties.
    if (!this.assertValidOptions(viewports, playOptions)) {
      return;
    }

    if (!play) {
      this.clearAutoPlay(viewports);
    } else {
      this.scheduleAutoPlay(direction, viewports, playOptions);
    }
  }

  /**
   * Tells if there is the minimum of frames to play a clip.
   *
   * @param {number} viewportIndex
   * @return {boolean} tells whether has the minimum number of frames or not.
   */
  hasMinimumFrames(viewportIndex) {
    return this.getNumberOfFrames(viewportIndex) >= this.minFramesToPlay;
  }

  /**
   * It filters viewports item from the given viewport that does not changed compared to the playOptions.
   * @param {Object[]} viewports - list of viewports to be checked.
   * @param {Object} playOptions - clip's play options.
   * @returns list of viewports
   */
  filterViewportsToUpdate(viewports, playOptions) {
    const result = [];

    viewports.forEach(viewport => {

      const currentViewportOptions = this.cineControllerMap.getOpValueByViewportIndex(viewport.viewportIndex);

      if (!currentViewportOptions) {
        result.push(viewport)
      } else if (currentViewportOptions.viewport && currentViewportOptions.playOptions) {
        if (viewports) {

          if (this.hasMinimumFrames(viewport.viewportIndex) && (currentViewportOptions.playOptions.play !== playOptions.play || currentViewportOptions.playOptions.frameRate !== playOptions.frameRate || currentViewportOptions.viewport.displaySetInstanceUIDs !== currentViewportOptions.viewport.displaySetInstanceUIDs)) {
            result.push(viewport);
          }
        }
      }
    });

    return result;
  }
}
