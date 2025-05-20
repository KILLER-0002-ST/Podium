'use client'

import React, { useState, useRef, useCallback, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { Document, Page, pdfjs } from 'react-pdf';
import type { Note } from '../../../queries';

// Initialize PDF.js worker with complete URL protocol - use a reliable CDN with legacy worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.js`;

// Simple component for handling PDF viewer errors
const PDFErrorBoundary: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    const handleErrorEvent = (event: ErrorEvent) => {
      // Only catch PDF.js errors
      if (event.message.includes('pdf') || event.filename?.includes('pdf')) {
        console.error('PDF.js error caught by boundary:', event);
        setHasError(true);
        event.preventDefault();
      }
    };
    
    window.addEventListener('error', handleErrorEvent);
    return () => window.removeEventListener('error', handleErrorEvent);
  }, []);
  
  if (hasError) {
    return <div className="text-center p-4 text-red-500">Error loading PDF viewer.</div>;
  }
  
  return <>{children}</>;
};

export const ReadOnlyHighlightedText = memo(({ text, note, identifier }: { text: string; note: Note; identifier: string }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLSpanElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0, width: 0 });
  
  // Check file type based on both MIME type and file extension
  const getFileType = useCallback(() => {
    if (!note.note_file) return { isImage: false, isPDF: false };
    
    // Check MIME type first
    const isImageMime = note.note_file_type?.startsWith('image/') || false;
    const isPDFMime = note.note_file_type === 'application/pdf';
    
    // If MIME type is set, use that
    if (isImageMime || isPDFMime) {
      return { isImage: isImageMime, isPDF: isPDFMime };
    }
    
    // Fallback to extension check
    const fileName = note.note_file.split('/').pop() || '';
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
    const pdfExtensions = ['pdf'];
    
    const isImageExt = imageExtensions.includes(extension || '');
    const isPDFExt = pdfExtensions.includes(extension || '');
    
    return { isImage: isImageExt, isPDF: isPDFExt };
  }, [note.note_file, note.note_file_type]);
  
  const { isImage, isPDF } = getFileType();
  
  const clearHideTimeout = () => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const updateTooltipPosition = () => {
    if (!highlightRef.current) return;
    
    const rect = highlightRef.current.getBoundingClientRect();
    setTooltipPosition({
      left: rect.left + (rect.width / 2),
      top: rect.top,
      width: rect.width
    });
  };

  const handleShowTooltip = () => {
    clearHideTimeout();
    setShowTooltip(true);
    updateTooltipPosition();
  };

  const handleHideTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 300);
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (!note.note_file) return;
    
    try {
      const response = await fetch(note.note_file);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = note.note_file.split('/').pop() || 'file';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  // Update position on scroll and resize
  useEffect(() => {
    if (showTooltip) {
      const handleUpdate = () => {
        updateTooltipPosition();
      };
      
      window.addEventListener('scroll', handleUpdate);
      window.addEventListener('resize', handleUpdate);
      
      // Initial position update
      handleUpdate();
      
      return () => {
        window.removeEventListener('scroll', handleUpdate);
        window.removeEventListener('resize', handleUpdate);
      };
    }
  }, [showTooltip]);

  useEffect(() => {
    return () => {
      clearHideTimeout();
    };
  }, []);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const handlePrevPage = () => {
    setPageNumber(page => Math.max(1, page - 1));
  };

  const handleNextPage = () => {
    setPageNumber(page => Math.min(numPages || page, page + 1));
  };

  const renderTooltip = () => {
    if (!showTooltip) return null;
    
    return createPortal(
      <div 
        ref={tooltipRef}
        className="fixed bg-white p-2 rounded shadow-lg border w-[320px] break-words"
        style={{
          zIndex: 2147483647,
          top: `${tooltipPosition.top - 8}px`,
          left: `${tooltipPosition.left}px`,
          transform: 'translate(-50%, -100%)',
          pointerEvents: 'auto'
        }}
        onMouseEnter={handleShowTooltip}
        onMouseLeave={handleHideTooltip}
      >
        {/* Add a tooltip arrow */}
        <div 
          className="absolute w-3 h-3 bg-white transform rotate-45"
          style={{
            bottom: '-6px',
            left: '50%',
            marginLeft: '-6px',
            borderRight: '1px solid #e2e8f0',
            borderBottom: '1px solid #e2e8f0'
          }}
        />
        
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-start gap-2">
            <p className="text-sm flex-1">{note.note}</p>
            <div className="flex gap-1">
              {(isImage || isPDF) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 hover:bg-gray-100 relative group"
                  onClick={() => {
                    setIsPreviewOpen(true);
                    setShowTooltip(false);
                  }}
                >
                  <Maximize2 className="h-3 w-3 text-blue-600" />
                  <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Preview
                  </span>
                </Button>
              )}
            </div>
          </div>
          {isImage && note.note_file && (
            <div className="mt-2 max-h-[200px] overflow-hidden">
              <img 
                src={note.note_file} 
                alt="Note attachment" 
                className="max-w-full h-auto rounded object-contain"
                style={{ maxHeight: '200px' }}
                onError={(e) => {
                  console.error('Failed to load image:', note.note_file);
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSI1MTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMjBweCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZpbGw9IiNjY2NjY2MiPkltYWdlIGZhaWxlZCB0byBsb2FkPC90ZXh0Pjwvc3ZnPg=='
                }}
              />
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  };

  return (
    <span 
      ref={highlightRef}
      className="note-highlight bg-yellow-200 relative group cursor-pointer" 
      data-note-id={identifier}
      onMouseEnter={handleShowTooltip}
      onMouseLeave={handleHideTooltip}
    >
      {text}
      {renderTooltip()}
      {isPreviewOpen && note.note_file && createPortal(
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center"
          style={{ 
            zIndex: 2147483646,
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsPreviewOpen(false);
              setIsFullscreen(false);
            }
          }}
        >
          <div 
            className={cn(
              "bg-white rounded-lg p-4 relative",
              isFullscreen ? "w-[95vw] h-[95vh]" : "max-w-[90vw] max-h-[90vh]"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-2 right-2 flex gap-2 z-10">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setIsFullscreen(prev => !prev)}
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => {
                  setIsPreviewOpen(false);
                  setIsFullscreen(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {isImage ? (
              <img 
                src={note.note_file} 
                alt="Note attachment" 
                className={cn(
                  "object-contain rounded-lg",
                  isFullscreen ? "w-full h-full" : "max-w-full max-h-[calc(90vh-2rem)]"
                )}
                onError={(e) => {
                  console.error('Failed to load image in preview:', note.note_file);
                  e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAyNCIgaGVpZ2h0PSI1MTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMjBweCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZpbGw9IiNjY2NjY2MiPkltYWdlIGZhaWxlZCB0byBsb2FkPC90ZXh0Pjwvc3ZnPg=='
                }}
              />
            ) : isPDF && (
              <div className="flex flex-col items-center gap-4">
                <div className="w-full max-w-full bg-white rounded-lg shadow-lg overflow-hidden">
                  <div className="p-4 bg-gray-100 border-b flex justify-between items-center">
                    <p className="text-sm font-medium">PDF Preview</p>
                    <div className="flex gap-2">
                      {numPages && numPages > 1 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrevPage}
                            disabled={pageNumber <= 1}
                          >
                            Previous
                          </Button>
                          <span className="text-sm">
                            Page {pageNumber} of {numPages}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNextPage}
                            disabled={pageNumber >= (numPages || 1)}
                          >
                            Next
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-4 flex justify-center">
                    <PDFErrorBoundary>
                      <Document
                        file={note.note_file}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={<div className="text-center p-4 flex items-center justify-center h-[200px]"><p>Loading PDF...</p></div>}
                        error={<div className="text-center p-4 flex items-center justify-center h-[200px] text-red-500">Failed to load PDF. <Button variant="link" size="sm" onClick={handleDownload}>Download instead</Button></div>}
                        noData={<div className="text-center p-4 flex items-center justify-center h-[200px]">No PDF file found.</div>}
                      >
                        {numPages !== null && numPages > 0 && (
                          <Page 
                            pageNumber={pageNumber} 
                            width={isFullscreen ? window.innerWidth * 0.7 : Math.min(window.innerWidth * 0.7, 700)}
                            renderAnnotationLayer={false}
                            renderTextLayer={false}
                            loading={<div className="text-center p-4 flex items-center justify-center h-[200px]">Loading page...</div>}
                            error={<div className="text-center p-4 flex items-center justify-center h-[200px] text-red-500">Error loading page.</div>}
                          />
                        )}
                      </Document>
                    </PDFErrorBoundary>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </span>
  );
});

ReadOnlyHighlightedText.displayName = 'ReadOnlyHighlightedText'; 