const imageIdExtractor = /studies\/([^/]*)\/series\/([^/]*)\/instances\/([^/]*)\/frames\/([^/]*)/

export default (displayArea) => {
  const { viewport } = displayArea;

  if (!viewport) return null;
  const imageId = viewport.getCurrentImageId();
  if (!imageId) {
    console.log("No image id found for", viewport);
    return null;
  }
  const match = imageId.match(imageIdExtractor);
  if (!match) {
    console.log("No image id match found for", imageId);
    return null;
  }
  const [overall, studyInstanceUID, seriesInstanceUID, sopInstanceUID, frame] = match;

  return {
    overall, studyInstanceUID, seriesInstanceUID, sopInstanceUID, frame,
    imageId
  }
};
