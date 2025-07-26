import React, { useEffect, useRef, useState } from 'react';
import * as fabric from 'fabric';
import { Upload, Type, RotateCw, Download, RotateCcw } from 'lucide-react';
import PropertiesPanel from '../components/mockupStudio/PropertiesPanel';
import { getPrintAreaOnCanvas, getPrintAreaPosition, updateTshirtImageDimensions } from '../utils/dimensions';

const MockupStudio: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
  const printAreaGuideRef = useRef<fabric.Rect | null>(null);
  
  const [printSize, setPrintSize] = useState<'A4' | 'A3' | 'A2'>('A3');
  const [tshirtColor, setTshirtColor] = useState<string>('#FFFFFF');
  
  // Map colors to t-shirt image filenames (using AVIF format for all colors)
  const getTshirtImageName = (color: string, view: 'front' | 'back') => {
    const colorMap: Record<string, string> = {
      '#FFFFFF': 'white',
      '#000000': 'black',
      '#1E3A8A': 'navy',
      '#DC2626': 'red',
      '#6B7280': 'gray',
      '#059669': 'green',
      '#F59E0B': 'yellow',
      '#7C3AED': 'purple'
    };
    
    const colorName = colorMap[color] || 'white';
    
    // Use AVIF for all colors including white
    return `/${view}-${colorName}.avif`;
  };
  const [currentView, setCurrentView] = useState<'front' | 'back'>('front');
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  
  // Store designs for each view
  const [frontDesigns, setFrontDesigns] = useState<fabric.Object[]>([]);
  const [backDesigns, setBackDesigns] = useState<fabric.Object[]>([]);
  
  // Position options similar to Customize page
  const frontPositions = [
    { value: 'center', label: 'Center', icon: '◼' },
    { value: 'left', label: 'Left Chest', icon: '◀' },
    { value: 'right', label: 'Right Chest', icon: '▶' },
    { value: 'bottom', label: 'Center Bottom', icon: '▼' }
  ];

  const backPositions = [
    { value: 'center', label: 'Center', icon: '◼' },
    { value: 'bottom', label: 'Center Bottom', icon: '▼' }
  ];
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize canvas and calibrate dimensions based on front-white image
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Cleanup any existing canvas first
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.dispose();
      fabricCanvasRef.current = null;
      printAreaGuideRef.current = null;
    }
    
    // First, load the front-white image to get real dimensions
    const calibrationImg = new Image();
    calibrationImg.onload = () => {
      console.log(`T-shirt image dimensions: ${calibrationImg.width}x${calibrationImg.height}px`);
      
      // Ensure canvas element exists and hasn't been initialized already
      if (!canvasRef.current || fabricCanvasRef.current) return;
      
      // Get initial container size
      const container = canvasRef.current.parentElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        canvasRef.current.width = rect.width || 800;
        canvasRef.current.height = rect.height || 900;
      }
      
      // Now create the canvas with transparent background
      const canvas = new fabric.Canvas(canvasRef.current, {
        backgroundColor: 'rgba(255, 255, 255, 0.01)', // Very subtle background to make it visible
        preserveObjectStacking: true,
        renderOnAddRemove: true,
        width: canvasRef.current.width,
        height: canvasRef.current.height
      });
      fabricCanvasRef.current = canvas;

      // Don't add print area guide yet - wait for canvas to be properly sized
      
      console.log('Canvas created, waiting for resize to add print guide');
      
      // After adding objects to canvas, ensure print guide is on top
      canvas.on('object:added', () => {
        if (printAreaGuideRef.current && fabricCanvasRef.current) {
          fabricCanvasRef.current.bringObjectToFront(printAreaGuideRef.current);
        }
      });

      // Handle selection events
      canvas.on('selection:created', (e) => {
        if (e.selected && e.selected[0]) {
          setSelectedObject(e.selected[0]);
        }
      });

      canvas.on('selection:updated', (e) => {
        if (e.selected && e.selected[0]) {
          setSelectedObject(e.selected[0]);
        }
      });

      canvas.on('selection:cleared', () => {
        setSelectedObject(null);
      });

      // Handle canvas resize for responsiveness
      const handleResize = () => {
        if (!canvasRef.current || !fabricCanvasRef.current) return;
        
        const container = document.getElementById('tshirt-container');
        const tshirtImg = container?.querySelector('img');
        if (!container || !tshirtImg) {
          console.log('Container or t-shirt image not found');
          return;
        }
        
        // Get container dimensions first
        const containerRect = container.getBoundingClientRect();
        
        // Wait for t-shirt image to be fully loaded and rendered
        const updateCanvasToImageSize = () => {
          // Since image is set to object-contain, we need to calculate its actual rendered size
          const imgNaturalWidth = tshirtImg.naturalWidth;
          const imgNaturalHeight = tshirtImg.naturalHeight;
          
          if (!imgNaturalWidth || !imgNaturalHeight) {
            console.log('T-shirt image not loaded yet, retrying...');
            setTimeout(handleResize, 100);
            return;
          }
          
          // Calculate the scale to fit within container while maintaining aspect ratio
          const containerWidth = containerRect.width;
          const containerHeight = containerRect.height;
          const scale = Math.min(
            containerWidth / imgNaturalWidth,
            containerHeight / imgNaturalHeight
          );
          
          // Calculate actual rendered dimensions
          const imgWidth = imgNaturalWidth * scale;
          const imgHeight = imgNaturalHeight * scale;
          
          console.log(`Container: ${containerWidth}x${containerHeight}, Image rendered: ${imgWidth}x${imgHeight}`);
          
          // Set both the canvas element attributes and fabric dimensions
          canvasRef.current!.width = imgWidth;
          canvasRef.current!.height = imgHeight;
          
          // Center the canvas in the container
          const leftOffset = (containerWidth - imgWidth) / 2;
          const topOffset = (containerHeight - imgHeight) / 2;
          
          canvasRef.current!.style.width = `${imgWidth}px`;
          canvasRef.current!.style.height = `${imgHeight}px`;
          canvasRef.current!.style.left = `${leftOffset}px`;
          canvasRef.current!.style.top = `${topOffset}px`;
          
          // Set fabric canvas to match - only if it exists
          if (fabricCanvasRef.current) {
            fabricCanvasRef.current.setDimensions({
              width: imgWidth,
              height: imgHeight
            });
          }
          
          // Update dimension calculations based on actual t-shirt size
          updateTshirtImageDimensions(imgWidth, imgHeight);

          // Create or update print area guide with correct dimensions
          if (!printAreaGuideRef.current) {
            // First time - create the guide
            const printArea = getPrintAreaOnCanvas(printSize);
            const printPosition = getPrintAreaPosition(printSize);
            
            console.log(`Creating print area guide: ${printArea.width}x${printArea.height} at (${printPosition.left}, ${printPosition.top})`);
            
            const guideRect = new fabric.Rect({
              left: printPosition.left,
              top: printPosition.top,
              width: printArea.width,
              height: printArea.height,
              fill: 'rgba(59, 130, 246, 0.1)', // Light blue fill for visibility
              stroke: '#2563eb',
              strokeWidth: 3,
              strokeDashArray: [8, 4],
              selectable: false,
              evented: false,
              excludeFromExport: true,
              hasControls: false,
              hasBorders: false
            });
            printAreaGuideRef.current = guideRect;
            fabricCanvasRef.current!.add(guideRect);
          } else {
            // Update existing guide
            const printArea = getPrintAreaOnCanvas(printSize);
            const printPosition = getPrintAreaPosition(printSize);
            
            console.log(`Updating print area guide to: ${printArea.width}x${printArea.height} at (${printPosition.left}, ${printPosition.top})`);
            
            printAreaGuideRef.current.set({
              left: printPosition.left,
              top: printPosition.top,
              width: printArea.width,
              height: printArea.height,
            });
          }
          
          // Bring guide to front and ensure it's visible
          if (fabricCanvasRef.current) {
            fabricCanvasRef.current.bringObjectToFront(printAreaGuideRef.current);
            fabricCanvasRef.current.requestRenderAll();
          }
        
        // Re-position all existing objects to match new t-shirt position
        const objects = fabricCanvasRef.current.getObjects();
        objects.forEach(obj => {
          if (obj !== printAreaGuideRef.current && obj.left !== undefined && obj.top !== undefined) {
            // This is a design object that needs repositioning
            // For now, just trigger a re-render
          }
        });
        
          if (fabricCanvasRef.current) {
            fabricCanvasRef.current.renderAll();
          }
        };
        
        // Check if image is already loaded
        if (tshirtImg.complete && tshirtImg.naturalWidth > 0) {
          updateCanvasToImageSize();
        } else {
          // Wait for image to load
          tshirtImg.onload = updateCanvasToImageSize;
        }
      };
      
      // Initial resize - delay to ensure DOM is ready
      setTimeout(() => {
        console.log('Attempting initial resize...');
        handleResize();
        // Try again after a longer delay if still not sized
        setTimeout(() => {
          console.log('Attempting second resize...');
          handleResize();
        }, 1000);
      }, 200);
      
      // Add resize observer
      const resizeObserver = new ResizeObserver(handleResize);
      if (canvasRef.current.parentElement) {
        resizeObserver.observe(canvasRef.current.parentElement);
      }
      
      // Also listen to window resize
      window.addEventListener('resize', handleResize);

      // Render canvas
      canvas.renderAll();
      
      // Cleanup function
      return () => {
        resizeObserver.disconnect();
        window.removeEventListener('resize', handleResize);
      };
    };
    
    // Try to load front-white.avif first, fallback to front.png
    calibrationImg.onerror = () => {
      console.log('Loading fallback front.png for calibration');
      calibrationImg.src = '/front.png';
    };
    calibrationImg.src = '/front-white.avif';

    return () => {
      if (fabricCanvasRef.current) {
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
      }
    };
  }, []); // Empty dependency - only run once

  // Update print area when size changes or canvas scale changes
  useEffect(() => {
    if (fabricCanvasRef.current && printAreaGuideRef.current) {
      const printArea = getPrintAreaOnCanvas(printSize);
      const printPosition = getPrintAreaPosition(printSize);
      
      printAreaGuideRef.current.set({
        width: printArea.width,
        height: printArea.height,
        left: printPosition.left,
        top: printPosition.top,
      });
      fabricCanvasRef.current.renderAll();
    }
  }, [printSize, canvasScale]);

  // Update designs when view changes
  useEffect(() => {
    if (!fabricCanvasRef.current) return;

    // Hide all designs
    [...frontDesigns, ...backDesigns].forEach(obj => {
      obj.visible = false;
    });

    // Show current view's designs
    const currentDesigns = currentView === 'front' ? frontDesigns : backDesigns;
    currentDesigns.forEach(obj => {
      obj.visible = true;
    });

    fabricCanvasRef.current.renderAll();
  }, [currentView, frontDesigns, backDesigns]);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      
      if (imageUrl && fabricCanvasRef.current) {
        fabric.Image.fromURL(imageUrl).then((img) => {
          const printArea = getPrintAreaOnCanvas(printSize);
          const printPosition = getPrintAreaPosition(printSize);
          
          // Scale image to fit within print area
          const scale = Math.min(
            printArea.width / (img.width || 1), 
            printArea.height / (img.height || 1)
          ) * 0.8;
          
          img.scale(scale);
          
          // Center the image in the print area
          img.set({
            left: printPosition.left + (printArea.width - img.getScaledWidth()) / 2,
            top: printPosition.top + (printArea.height - img.getScaledHeight()) / 2,
          });
          
          // Add custom property to track which view it belongs to
          (img as any).viewType = currentView;
          
          fabricCanvasRef.current!.add(img);
          fabricCanvasRef.current!.setActiveObject(img);
          fabricCanvasRef.current!.renderAll();
          
          // Add to appropriate designs array
          if (currentView === 'front') {
            setFrontDesigns([...frontDesigns, img]);
          } else {
            setBackDesigns([...backDesigns, img]);
          }
        });
      }
    };
    
    reader.readAsDataURL(file);
  };

  const addText = () => {
    if (fabricCanvasRef.current) {
      const printArea = getPrintAreaOnCanvas(printSize);
      const printPosition = getPrintAreaPosition(printSize);
      
      const text = new fabric.IText('Enter Text', {
        left: printPosition.left + (printArea.width / 2) - 50,
        top: printPosition.top + (printArea.height / 2) - 20,
        fontSize: 40,
        fontFamily: 'Arial',
        fill: '#000000',
      });
      
      // Add custom property to track which view it belongs to
      (text as any).viewType = currentView;
      
      fabricCanvasRef.current.add(text);
      fabricCanvasRef.current.setActiveObject(text);
      fabricCanvasRef.current.renderAll();
      
      // Add to appropriate designs array
      if (currentView === 'front') {
        setFrontDesigns([...frontDesigns, text]);
      } else {
        setBackDesigns([...backDesigns, text]);
      }
    }
  };

  const resetCanvas = () => {
    if (fabricCanvasRef.current) {
      // Get current view's designs
      const currentDesigns = currentView === 'front' ? frontDesigns : backDesigns;
      
      // Remove each design from canvas
      currentDesigns.forEach(obj => {
        fabricCanvasRef.current!.remove(obj);
      });
      
      // Clear the stored designs for current view
      if (currentView === 'front') {
        setFrontDesigns([]);
      } else {
        setBackDesigns([]);
      }
      
      fabricCanvasRef.current.renderAll();
      setSelectedObject(null);
    }
  };

  const handleExport = () => {
    if (fabricCanvasRef.current) {
      // Hide print guide completely
      if (printAreaGuideRef.current) {
        printAreaGuideRef.current.visible = false;
        printAreaGuideRef.current.opacity = 0;
      }
      
      // Deselect any selected objects to remove selection handles
      fabricCanvasRef.current.discardActiveObject();
      fabricCanvasRef.current.renderAll();
      
      // Wait a bit to ensure render completes
      setTimeout(() => {
        // Create a temporary canvas for export
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = 1600; // Double size for high quality
        exportCanvas.height = 1800;
        const ctx = exportCanvas.getContext('2d');
        
        if (ctx) {
          // Fill background
          ctx.fillStyle = '#f3f4f6';
          ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
          
          // Load and draw plain t-shirt image
          const tshirtImg = new Image();
          tshirtImg.onload = () => {
            // Draw plain t-shirt (no color overlay)
            ctx.drawImage(tshirtImg, 0, 0, exportCanvas.width, exportCanvas.height);
            
            // Get only the visible designs (no print guide)
            const objects = fabricCanvasRef.current!.getObjects().filter(
              obj => obj !== printAreaGuideRef.current && obj.visible
            );
            
            // Get the actual canvas dimensions
            const currentCanvasWidth = fabricCanvasRef.current!.getWidth();
            const currentCanvasHeight = fabricCanvasRef.current!.getHeight();
            
            // Calculate scale factors for export
            const exportScaleX = exportCanvas.width / currentCanvasWidth;
            const exportScaleY = exportCanvas.height / currentCanvasHeight;
            
            // Create a temporary fabric canvas with actual dimensions
            const tempCanvas = new fabric.StaticCanvas(null, {
              width: currentCanvasWidth,
              height: currentCanvasHeight
            });
            
            // Clone all objects with proper async handling
            const clonePromises = objects.map(obj => {
              const objData = obj.toObject();
              
              if (obj.type === 'image') {
                // For images, we need to wait for the async load
                return new Promise<void>((resolve) => {
                  const img = obj as fabric.Image;
                  const src = img.getSrc();
                  fabric.Image.fromURL(src).then((cloned) => {
                    cloned.set({
                      left: objData.left,
                      top: objData.top,
                      scaleX: objData.scaleX,
                      scaleY: objData.scaleY,
                      angle: objData.angle,
                      opacity: objData.opacity
                    });
                    tempCanvas.add(cloned);
                    resolve();
                  });
                });
              } else if (obj.type === 'i-text') {
                // For text, we can clone synchronously
                const text = obj as fabric.IText;
                const cloned = new fabric.IText(text.text || '', {
                  left: objData.left,
                  top: objData.top,
                  fontSize: objData.fontSize,
                  fontFamily: objData.fontFamily,
                  fill: objData.fill,
                  scaleX: objData.scaleX,
                  scaleY: objData.scaleY,
                  angle: objData.angle,
                  opacity: objData.opacity
                });
                tempCanvas.add(cloned);
                return Promise.resolve();
              }
              return Promise.resolve();
            });
            
            // Wait for all objects to be cloned
            Promise.all(clonePromises).then(() => {
              tempCanvas.renderAll();
              
              // Draw the designs on top with proper scaling
              const tempCanvasElement = tempCanvas.getElement();
              
              // Save context state
              ctx.save();
              
              // Apply scale transformation to match export size
              ctx.scale(exportScaleX, exportScaleY);
              
              // Draw at original size (scaling will handle the resize)
              ctx.drawImage(tempCanvasElement, 0, 0);
              
              // Restore context state
              ctx.restore();
              
              // Download
              exportCanvas.toBlob((blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = `tshirt-mockup-${printSize}-${currentView}.png`;
                  link.click();
                  URL.revokeObjectURL(url);
                }
                
                // Restore print guide
                if (printAreaGuideRef.current) {
                  printAreaGuideRef.current.visible = true;
                  printAreaGuideRef.current.opacity = 1;
                }
                fabricCanvasRef.current!.renderAll();
              }, 'image/png');
            });
          };
          
          tshirtImg.src = getTshirtImageName(tshirtColor, currentView);
          
          // Fallback to white t-shirt if colored version fails
          tshirtImg.onerror = () => {
            tshirtImg.src = `/${currentView}.png`;
          };
        }
      }, 100);
    }
  };


  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const setDesignPosition = (position: string) => {
    if (selectedObject && fabricCanvasRef.current) {
      const printArea = getPrintAreaOnCanvas(printSize);
      const printPosition = getPrintAreaPosition(printSize);
      const centerX = 800 / 2;
      
      // Store original scale if not already stored
      if (!(selectedObject as any).originalScaleX) {
        (selectedObject as any).originalScaleX = selectedObject.scaleX;
        (selectedObject as any).originalScaleY = selectedObject.scaleY;
      }
      
      // Get original scale
      const originalScaleX = (selectedObject as any).originalScaleX || selectedObject.scaleX || 1;
      const originalScaleY = (selectedObject as any).originalScaleY || selectedObject.scaleY || 1;
      
      switch (position) {
        case 'center':
          // Center position - restore original size
          selectedObject.set({
            scaleX: originalScaleX,
            scaleY: originalScaleY,
          });
          const centerWidth = selectedObject.getScaledWidth();
          const centerHeight = selectedObject.getScaledHeight();
          selectedObject.set({
            left: printPosition.left + (printArea.width / 2) - (centerWidth / 2),
            top: printPosition.top + (printArea.height / 2) - (centerHeight / 2),
          });
          break;
          
        case 'left':
          // Left chest position - scale down and position
          if (currentView === 'front') {
            const chestScale = 0.4; // Scale down to 40% for chest positions
            selectedObject.set({
              scaleX: originalScaleX * chestScale,
              scaleY: originalScaleY * chestScale,
            });
            const leftWidth = selectedObject.getScaledWidth();
            selectedObject.set({
              left: printPosition.left + 20, // 20px margin from left edge of print area
              top: printPosition.top + 30,   // 30px margin from top edge of print area
            });
          }
          break;
          
        case 'right':
          // Right chest position - scale down and position
          if (currentView === 'front') {
            const chestScale = 0.4; // Scale down to 40% for chest positions
            selectedObject.set({
              scaleX: originalScaleX * chestScale,
              scaleY: originalScaleY * chestScale,
            });
            const rightWidth = selectedObject.getScaledWidth();
            selectedObject.set({
              left: printPosition.left + printArea.width - rightWidth - 20, // 20px margin from right
              top: printPosition.top + 30,   // 30px margin from top
            });
          }
          break;
          
        case 'bottom':
          // Bottom position - medium size
          const bottomScale = 0.7; // Scale to 70% for bottom position
          selectedObject.set({
            scaleX: originalScaleX * bottomScale,
            scaleY: originalScaleY * bottomScale,
          });
          const bottomWidth = selectedObject.getScaledWidth();
          const bottomHeight = selectedObject.getScaledHeight();
          selectedObject.set({
            left: printPosition.left + (printArea.width / 2) - (bottomWidth / 2),
            top: printPosition.top + printArea.height - bottomHeight - 30,
          });
          break;
      }
      
      fabricCanvasRef.current.renderAll();
    }
  };

  const deleteSelectedObject = () => {
    if (fabricCanvasRef.current && selectedObject) {
      // Remove from appropriate designs array
      const viewType = (selectedObject as any).viewType;
      if (viewType === 'front') {
        setFrontDesigns(frontDesigns.filter(obj => obj !== selectedObject));
      } else if (viewType === 'back') {
        setBackDesigns(backDesigns.filter(obj => obj !== selectedObject));
      }
      
      fabricCanvasRef.current.remove(selectedObject);
      setSelectedObject(null);
    }
  };

  return (
    <div className="bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-2 sm:px-4 py-3 flex items-center justify-between">
          <h1 className="text-base sm:text-2xl font-bold text-gray-800">
            <span className="hidden sm:inline">T-Shirt Design Studio</span>
            <span className="sm:hidden">T-Shirt Studio</span>
          </h1>
          <div className="flex items-center gap-1 sm:gap-4">
            <button
              onClick={resetCanvas}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm"
              title="Reset current side"
            >
              <RotateCcw className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
            >
              <Download className="w-4 sm:w-5 h-4 sm:h-5" />
              <span className="hidden sm:inline">Export Design</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-150px)]">
        {/* Left Sidebar - Mobile: horizontal, Desktop: vertical */}
        <div className="lg:w-20 w-full bg-gray-800 text-white p-2 lg:p-4 flex lg:flex-col flex-row items-center lg:justify-center justify-start gap-3 lg:gap-6 overflow-x-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
            <button 
            onClick={() => fileInputRef.current?.click()}
            className="p-2 lg:p-3 hover:bg-gray-700 rounded-lg transition-colors group relative flex-shrink-0"
            title="Upload Image"
          >
            <Upload className="w-5 lg:w-6 h-5 lg:h-6" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden lg:block">
              Upload Image
            </span>
          </button>
          <button 
            onClick={addText}
            className="p-2 lg:p-3 hover:bg-gray-700 rounded-lg transition-colors group relative flex-shrink-0"
            title="Add Text"
          >
            <Type className="w-5 lg:w-6 h-5 lg:h-6" />
            <span className="absolute left-full ml-2 px-2 py-1 bg-gray-700 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap hidden lg:block">
              Add Text
            </span>
          </button>
          
          {/* Print Size Selector in Sidebar */}
          <div className="lg:w-full flex lg:flex-col items-center gap-1 lg:gap-2 lg:border-t lg:pt-4 lg:mt-4 border-l lg:border-l-0 pl-3 lg:pl-0 ml-auto lg:ml-0">
           
            <div className="flex lg:flex-col gap-1 lg:gap-2">
              <button
                onClick={() => setPrintSize('A4')}
                className={`px-2 lg:px-3 py-1 lg:py-2 text-xs lg:text-sm rounded-lg transition-colors flex-shrink-0 ${
                  printSize === 'A4'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                A4
              </button>
              <button
                onClick={() => setPrintSize('A3')}
                className={`px-2 lg:px-3 py-1 lg:py-2 text-xs lg:text-sm rounded-lg transition-colors flex-shrink-0 ${
                  printSize === 'A3'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                A3
              </button>
              <button
                onClick={() => setPrintSize('A2')}
                className={`px-2 lg:px-3 py-1 lg:py-2 text-xs lg:text-sm rounded-lg transition-colors flex-shrink-0 ${
                  printSize === 'A2'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                A2
              </button>
            </div>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div className="flex-1 lg:flex-1 flex flex-col p-2 sm:p-6 min-h-0">
         

            {/* Canvas Container - Responsive */}
            <div className="flex-1 flex justify-center  p-2 lg:p-4">
              <div 
                id="tshirt-container"
                className="relative bg-gray-100 rounded-lg w-full max-w-full lg:max-w-[800px] lg:h-[calc(100vh-200px)] lg:max-h-[900px]"
                style={{ 
                  aspectRatio: '8/9'
                }}
              >
                {/* T-shirt image - BACKGROUND */}
                <img
                  src={getTshirtImageName(tshirtColor, currentView)}
                  alt={`T-shirt ${currentView} view`}
                  className="absolute inset-0 w-full h-full object-contain"
                  onError={(e) => {
                    // Last resort: fallback to old PNG only if AVIF fails
                    console.warn(`Failed to load AVIF: ${e.currentTarget.src}, falling back to PNG`);
                    e.currentTarget.src = `/${currentView}.png`;
                  }}
                />

                {/* Canvas - FOREGROUND - positioned exactly over the t-shirt */}
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 w-full h-full"
                  style={{ 
                    pointerEvents: 'auto'
                  }}
                />
              </div>
            </div>
      
        </div>

        {/* Right Properties Panel - Mobile: bottom, Desktop: right sidebar */}
        <div className="lg:w-80 w-full bg-white lg:border-l border-t lg:border-t-0 p-4 lg:p-6 lg:h-full overflow-y-auto">
          <PropertiesPanel
            tshirtColor={tshirtColor}
            setTshirtColor={setTshirtColor}
            selectedObject={selectedObject}
            fabricCanvas={fabricCanvasRef.current}
            onDelete={deleteSelectedObject}
            currentView={currentView}
            setCurrentView={setCurrentView}
            frontDesignsCount={frontDesigns.length}
            backDesignsCount={backDesigns.length}
          />
          
          {/* Position Controls - Similar to Customize Page */}
          {selectedObject && (
            <div className="mt-6 border-t pt-6">
              <h4 className="font-semibold text-gray-700 mb-4">Design Position ({currentView})</h4>
              <div className="grid grid-cols-2 gap-2">
                {(currentView === 'front' ? frontPositions : backPositions).map((pos) => (
                  <button
                    key={pos.value}
                    onClick={() => setDesignPosition(pos.value)}
                    className="p-3 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center gap-2 transition-all"
                  >
                    <span className="text-lg">{pos.icon}</span>
                    <span className="text-sm">{pos.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MockupStudio;
