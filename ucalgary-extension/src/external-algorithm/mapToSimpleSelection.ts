import _viewportToSelection from "./viewportToSelection";

export default (view, selectionCodes) => {
  const selection = _viewportToSelection(view);
  return {
    imageId: [selection.imageId],
    selectionCodes: [...selectionCodes]
  };
};
