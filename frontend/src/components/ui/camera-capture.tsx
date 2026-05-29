import { useState, useRef, useCallback } from 'react'
import Webcam from 'react-webcam'
import { Camera, X, RotateCcw, Check, Upload } from 'lucide-react'
import { Button } from './button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './dialog'

interface CameraCaptureProps {
  onCapture: (imageSrc: string) => void
  onClose: () => void
  isOpen: boolean
  title?: string
}

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: 'environment',
}

export function CameraCapture({ onCapture, onClose, isOpen, title = 'Capture Photo' }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null)
  const [imgSrc, setImgSrc] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      setImgSrc(imageSrc)
    }
  }, [webcamRef])

  const retake = () => {
    setImgSrc(null)
  }

  const confirm = () => {
    if (imgSrc) {
      onCapture(imgSrc)
      setImgSrc(null)
      onClose()
    }
  }

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="p-4">
          {imgSrc ? (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border border-border">
                <img src={imgSrc} alt="Captured" className="w-full h-auto" />
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={retake}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button onClick={confirm}>
                  <Check className="h-4 w-4 mr-2" />
                  Use Photo
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden border border-border bg-black">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  videoConstraints={{ ...videoConstraints, facingMode }}
                  className="w-full h-auto"
                />
                <button
                  onClick={toggleCamera}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={onClose}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={capture}>
                  <Camera className="h-4 w-4 mr-2" />
                  Capture
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
