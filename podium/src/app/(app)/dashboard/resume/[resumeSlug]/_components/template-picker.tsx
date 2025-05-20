'use client'

import { useState } from 'react'
import { templates } from './templates/types'
import { cn } from '~/lib/utils'
import Image from 'next/image'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { Button } from '~/components/ui/button'
import { Eye } from 'lucide-react'

interface TemplatePickerProps {
  currentTemplate: string
  onSelect: (templateId: string) => void
  resumeData?: any // Optional resumeData for preview
}

export function TemplatePicker({
  currentTemplate,
  onSelect,
  resumeData
}: TemplatePickerProps) {
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null)

  const handlePreview = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setPreviewTemplate(id)
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-3 max-h-[300px] overflow-y-auto p-1">
        {Object.values(templates).map((template) => (
          <div
            key={template.id}
            className={cn(
              "flex flex-col gap-1 cursor-pointer transition-all",
              "p-2 rounded-lg border",
              currentTemplate === template.id
                ? "bg-gray-100 ring-2 ring-primary"
                : "hover:bg-gray-50"
            )}
            onClick={() => onSelect(template.id)}
          >
            <div className="relative w-full aspect-[3/4] rounded-md overflow-hidden bg-white group">
              <Image
                src={template.thumbnail}
                alt={template.name}
                fill
                className="object-contain"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button 
                  size="sm" 
                  variant="secondary"
                  className="flex items-center gap-1"
                  onClick={(e) => handlePreview(template.id, e)}
                >
                  <Eye className="h-3 w-3" />
                  Preview
                </Button>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-sm">{template.name}</h3>
              <p className="text-xs text-gray-500">{template.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Template Preview Dialog */}
      {previewTemplate && (
        <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
          <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
            <div className="text-lg font-semibold mb-2">
              {templates[previewTemplate]?.name} Template Preview
            </div>
            <div className="flex-1 overflow-y-auto border rounded p-4">
              <div className="bg-white h-full overflow-y-auto">
                {/* This would render the actual template preview when resumeData is available */}
                {resumeData ? (
                  <iframe
                    src={`/resume/preview/${previewTemplate}?data=${encodeURIComponent(JSON.stringify(resumeData))}`}
                    className="w-full h-full border-0"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <Image
                      src={templates[previewTemplate]?.thumbnail}
                      alt={templates[previewTemplate]?.name}
                      width={400}
                      height={600}
                      className="object-contain"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
                Close
              </Button>
              <Button onClick={() => {
                onSelect(previewTemplate);
                setPreviewTemplate(null);
              }}>
                Select Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}