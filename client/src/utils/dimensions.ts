// The standard DPI for printing
const DPI = 300;
// Conversion factor from inches to millimeters
const MM_PER_INCH = 25.4;
// How many pixels are in one millimeter at our target DPI
const PIXELS_PER_MM = DPI / MM_PER_INCH; // This is approx 11.81

// Standard paper sizes in millimeters
export const A4_DIMENSIONS_MM = { width: 210, height: 297 };
export const A3_DIMENSIONS_MM = { width: 297, height: 420 };
export const A2_DIMENSIONS_MM = { width: 420, height: 594 };

// Real-world dimensions of a Size L adult t-shirt in millimeters
export const REAL_TSHIRT_SIZE_L_MM = { width: 550, height: 750 }; // Size L t-shirt (flat lay)
export const REAL_TSHIRT_PRINT_AREA_MM = { width: 280, height: 380 }; // Maximum safe print area on chest

// This will be set dynamically based on the actual t-shirt image
let CANVAS_TSHIRT_DIMENSIONS = { width: 800, height: 900 };
let CANVAS_PRINT_AREA = { width: 350, height: 450, offsetX: 225, offsetY: 200 };
let SCALE_FACTOR = { x: 1, y: 1 }; // px per mm

/**
 * Updates the canvas dimensions based on the actual canvas size
 */
export const updateTshirtImageDimensions = (canvasWidth: number, canvasHeight: number) => {
  // Since the canvas is now sized exactly to the t-shirt, 
  // the canvas dimensions ARE the t-shirt dimensions
  CANVAS_TSHIRT_DIMENSIONS = { width: canvasWidth, height: canvasHeight };
  
  // Calculate scale factor based on actual displayed t-shirt size vs real t-shirt
  SCALE_FACTOR = {
    x: canvasWidth / REAL_TSHIRT_SIZE_L_MM.width,   // px/mm for width
    y: canvasHeight / REAL_TSHIRT_SIZE_L_MM.height  // px/mm for height
  };
  
  
  // Calculate print area based on real-world dimensions
  const printAreaWidth = REAL_TSHIRT_PRINT_AREA_MM.width * SCALE_FACTOR.x;
  const printAreaHeight = REAL_TSHIRT_PRINT_AREA_MM.height * SCALE_FACTOR.y;
  
  // Print area should be centered on the t-shirt chest area
  // The chest print area typically starts around 150-180mm from the top on a real shirt
  // to avoid being too close to the collar
  const chestStartMM = 160; // 160mm from top of shirt (about 6.3 inches)
  const chestStartPx = chestStartMM * SCALE_FACTOR.y;
  
  CANVAS_PRINT_AREA = {
    width: printAreaWidth,
    height: printAreaHeight,
    offsetX: (canvasWidth - printAreaWidth) / 2, // Center horizontally on t-shirt
    offsetY: chestStartPx  // Position based on real measurements
  };
  
};

/**
 * Converts millimeters to pixels based on the standard DPI.
 * @param mm The value in millimeters.
 * @returns The equivalent value in pixels.
 */
export const mmToPixels = (mm: number): number => {
  return mm * PIXELS_PER_MM;
};

/**
 * Calculates the dimensions of the print area on the canvas based on actual scale factor.
 * @param printSize The selected paper size ('A4', 'A3', or 'A2').
 * @returns The width and height of the print area in canvas pixels.
 */
export const getPrintAreaOnCanvas = (printSize: 'A4' | 'A3' | 'A2') => {
  let dimensions;
  switch (printSize) {
    case 'A4':
      dimensions = A4_DIMENSIONS_MM;
      break;
    case 'A3':
      dimensions = A3_DIMENSIONS_MM;
      break;
    case 'A2':
      dimensions = A2_DIMENSIONS_MM;
      break;
    default:
      dimensions = A3_DIMENSIONS_MM;
  }
  
  // Show actual paper sizes without any scaling
  // This gives users a realistic understanding of the paper size differences
  // Even if they overflow the canvas, that's OK - it shows the real size
  const paperWidth = dimensions.width;
  const paperHeight = dimensions.height;
  
  
  return {
    width: paperWidth * SCALE_FACTOR.x,   // mm * (px/mm) = px
    height: paperHeight * SCALE_FACTOR.y  // mm * (px/mm) = px
  };
};

/**
 * Gets the position where the print area should be placed on the canvas
 * Same top position for all sizes, but horizontally centered
 */
export const getPrintAreaPosition = (printSize?: 'A4' | 'A3' | 'A2') => {
  if (!printSize) {
    // Return the base print area position
    return {
      left: CANVAS_PRINT_AREA.offsetX,
      top: CANVAS_PRINT_AREA.offsetY,
    };
  }
  
  // Get the dimensions of the selected paper size
  const paperDimensions = getPrintAreaOnCanvas(printSize);
  
  // Center horizontally, but always start from the same top position (chest area)
  // This shows the actual size differences - larger papers will extend down further
  return {
    left: (CANVAS_TSHIRT_DIMENSIONS.width - paperDimensions.width) / 2,
    top: CANVAS_PRINT_AREA.offsetY,
  };
};
