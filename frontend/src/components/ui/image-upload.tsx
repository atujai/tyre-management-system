import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Camera, Upload, X, ImageIcon } from 'lucide-react'
import { Button } from './button'
import { CameraCapture } from './camera-capture'

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
  label?: string
}

export function ImageUpload({ images, onImagesChange, maxImages = 5, label = 'Photos' }: ImageUploadProps) {
  const [cameraOpen, setCameraOpen] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const remaining = maxImages - images.length
    const filesToProcess = acceptedFiles.slice(0, remaining)

    filesToProcess.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        if (result) {
          onImagesChange([...images, result])
        }
      }
      reader.readAsDataURL(file)
    })
  }, [images, maxImages, onImagesChange])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
    },
    disabled: images.length >= maxImages,
  })

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  const handleCameraCapture = (imageSrc: string) => {
    if (images.length < maxImages) {
      onImagesChange([...images, imageSrc])
    }
  }

  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </label>

      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((img, index) => (
            <div key={index} className="relative group">
              <img
                src={img}
                alt={`Upload ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border border-border"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {images.length < maxImages && (
        <div className="flex gap-2">
          <div
            {...getRootProps()}
            className={`flex-1 border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              {isDragActive ? 'Drop here...' : 'Drag & drop or click to upload'}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setCameraOpen(true)}
            className="flex flex-col items-center justify-center h-auto px-4"
          >
            <Camera className="h-5 w-5 mb-1" />
            <span className="text-xs">Camera</span>
          </Button>
        </div>
      )}

      <CameraCapture
        isOpen={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
        title="Take Photo"
      />
    </div>
  )
}
