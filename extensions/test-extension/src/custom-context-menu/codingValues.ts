/**
 * Coding values is a map of simple string coding values to a set of
 * attributes associated with the coding value.
 *
 * The simple string is in the format `<codingSchemeDesignator>:<codingValue>`
 * That allows extracting the DICOM attributes from the designator/value, and
 * allows for passing around the simple string.
 * The additional attributes contained in the object include:
 *       * text - this is the coding scheme text display value, and may be language specific
 *       * type - this defines a named type, typically 'site'.  Different names can be used
 *                to allow setting different findingSites values in order to define a hierarchy.
 *       * color - used to apply annotation color
 * It is also possible to define additional attributes here, used by custom
 * extensions.
 *
 * See https://dicom.nema.org/medical/dicom/current/output/html/part16.html
 * for definitions of SCT and other code values.
 */
const codingValues = {
  id: 'codingValues',

  // Findings
  'SCT:371861004': {
    text: 'Mild intimal coronary irregularities',
    color: 'green',
  },
  'SCT:194983005': {
    text: 'Aortic insufficiency',
    color: 'darkred',
  },
  'SegmentationCardiac:4ch': {
    text: '4-chamber',
    color: '#000000',
    seriesLabel: true,
  },
  'SegmentationCardiac:3ch': {
    text: '3-chamber',
    color: '#000000',
    seriesLabel: true,
  },
  'SCT:399232001': {
    text: '2-chamber',
    color: '#000000',
    seriesLabel: true,
  },
  'SCT:103340004': {
    text: 'SAX',
    color: '#000000',
    seriesLabel: true,
  },
  'SegmentationCardiac:av': {
    text: 'AV',
    color: '#000000',
    seriesLabel: true,
  },
  'SCT:91134007': {
    text: 'MV',
    color: '#000000',
    seriesLabel: true,
  },
  'SCT:122972007': {
    text: 'PV',
    color: '#000000',
    seriesLabel: true,
  },
  'SegmentationCardiac:ao_cc': {
    text: 'Aorta - candycane',
    color: '#000000',
    seriesLabel: true,
  },
  'SCT:24422004': {
    text: 'Axial',
    color: '#000000',
    seriesLabel: true,
  },
  'SCT:81654009': {
    text: 'Coronal',
    color: '#000000',
    seriesLabel: true,
  },
  'SCT:30730003': {
    text: 'Sagittal',
    color: '#000000',
    seriesLabel: true,
  },
  'SegmentationCardiac:other': {
    text: 'Other',
    color: '#000000',
    seriesLabel: true,
  },

  // fiducial
  'SegmentationCardiac:20000101': {
    text: 'RVI site - AHA',
    color: '#191970',
  },
  'SegmentationCardiac:20000102': {
    text: 'RVI site - other',
    color: '#0000FF',
  },
  'SegmentationCardiac:20000201': {
    text: 'AV mid',
    color: '#4169E1',
  },
  'SegmentationCardiac:20000202': {
    text: 'AV RCC',
    color: '#7B68EE',
  },
  'SegmentationCardiac:20000203': {
    text: 'AV LCC',
    color: '#6495ED',
  },
  'SegmentationCardiac:20000204': {
    text: 'AV NCC',
    color: '#1E90FF',
  },
  'SegmentationCardiac:20000301': {
    text: 'MV mid',
    color: '#00BFFF',
  },
  'SegmentationCardiac:20000401': {
    text: 'PV mid',
    color: '#87CEEB',
  },
  'SegmentationCardiac:20000501': {
    text: 'TV mid',
    color: '#87CEFA',
  },
  'SegmentationCardiac:20000601': {
    text: 'LM ostium',
    color: '#B0E0E6',
  },
  'SegmentationCardiac:20000602': {
    text: 'RCA ostium',
    color: '#F0F8FF',
  },
  'SegmentationCardiac:20000603': {
    text: 'LCx ostium',
    color: '#B0C4DE',
  },
  'SegmentationCardiac:20000701': {
    text: 'Other',
    color: '#8A2BE2',
  },

  // contour
  'SegmentationCardiac:10000101': {
    text: 'LV endo',
    color: 'red',
    joinedOpenContour: true,
  },
  'SegmentationCardiac:10000102': {
    text: 'LV epi',
    color: 'green',
  },
  'SegmentationCardiac:10000201': {
    text: 'RV endo',
    color: 'blue',
  },
  'SegmentationCardiac:10000202': {
    text: 'RV epi',
    color: '#ADD8E6',
  },
  'SegmentationCardiac:10000301': {
    text: 'LA endo',
    color: 'orange',
    joinedOpenContour: true,
  },
  'SegmentationCardiac:10000401': {
    text: 'RA endo',
    color: 'purple',
    joinedOpenContour: true,
  },
  'SegmentationCardiac:10000501': {
    text: 'Aorta desc',
    color: 'violet',
  },
};

export default codingValues;
