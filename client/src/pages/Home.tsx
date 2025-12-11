import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Camera, Upload, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [result, setResult] = useState<{
    isHotDog: boolean;
    confidence: number;
    imageUrl: string;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  
  // Check for test image from AI generator
  useEffect(() => {
    const testImage = sessionStorage.getItem('testImage');
    if (testImage) {
      setSelectedImage(testImage);
      sessionStorage.removeItem('testImage');
    }
  }, []);
  
  const submitPrediction = trpc.predictions.submit.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setIsClassifying(false);
      toast.success(data.isHotDog ? "🌭 Hot Dog!" : "❌ Not Hot Dog!");
    },
    onError: (error) => {
      setIsClassifying(false);
      toast.error("Classification failed: " + error.message);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setResult(null);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      toast.error("Camera access denied");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg');
      setSelectedImage(imageData);
      setResult(null);
      
      // Stop camera
      const stream = video.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const classifyImage = () => {
    if (!selectedImage || !isAuthenticated) {
      toast.error("Please login first");
      return;
    }
    
    setIsClassifying(true);
    const mimeType = selectedImage.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
    submitPrediction.mutate({
      imageData: selectedImage,
      mimeType,
    });
  };

  const reset = () => {
    setSelectedImage(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
        {/* Floating Pixel Elements */}
        <div className="absolute top-20 left-10 w-8 h-8 bg-primary pixel-float opacity-50" style={{ animationDelay: '0s' }} />
        <div className="absolute top-40 right-20 w-12 h-12 bg-secondary pixel-float opacity-50" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-40 left-20 w-10 h-10 bg-accent pixel-float opacity-50" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 right-10 w-6 h-6 bg-chart-4 pixel-float opacity-50" style={{ animationDelay: '3s' }} />
        
        <div className="text-center space-y-8 z-10">
          <h1 className="text-4xl md:text-6xl text-primary neon-glow mb-4">
            HOT DOG
          </h1>
          <h2 className="text-2xl md:text-4xl text-secondary neon-glow">
            OR NOT
          </h2>
          
          <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto mt-8">
            Upload or capture a photo and let AI determine if it's a hot dog!
          </p>
          
          <Button
            size="lg"
            className="mt-8 text-lg px-8 py-6 neon-border bg-primary text-primary-foreground hover:bg-primary/90 pixel-corners"
            onClick={() => window.location.href = getLoginUrl()}
          >
            START GAME
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      {/* Floating Pixel Elements */}
      <div className="absolute top-20 left-10 w-8 h-8 bg-primary pixel-float opacity-30" style={{ animationDelay: '0s' }} />
      <div className="absolute top-40 right-20 w-12 h-12 bg-secondary pixel-float opacity-30" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-40 left-20 w-10 h-10 bg-accent pixel-float opacity-30" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-20 right-10 w-6 h-6 bg-chart-4 pixel-float opacity-30" style={{ animationDelay: '3s' }} />
      
      <div className="container max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl text-primary neon-glow mb-4">
            HOT DOG OR NOT
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Welcome, {user?.name || 'Player'}! Upload or capture to play.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Upload/Camera Section */}
          <Card className="p-6 bg-card border-4 border-border neon-border pixel-corners">
            <h2 className="text-lg text-card-foreground mb-6">SELECT IMAGE</h2>
            
            {!selectedImage && !isCameraActive && (
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-6 bg-primary text-primary-foreground hover:bg-primary/90 pixel-corners"
                  size="lg"
                >
                  <Upload className="mr-2" />
                  UPLOAD
                </Button>
                
                <Button
                  onClick={startCamera}
                  className="w-full py-6 bg-secondary text-secondary-foreground hover:bg-secondary/90 pixel-corners"
                  size="lg"
                >
                  <Camera className="mr-2" />
                  CAMERA
                </Button>
              </div>
            )}
            
            {isCameraActive && (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full border-4 border-border"
                />
                <Button
                  onClick={capturePhoto}
                  className="w-full py-6 bg-accent text-accent-foreground hover:bg-accent/90 pixel-corners"
                  size="lg"
                >
                  CAPTURE
                </Button>
              </div>
            )}
            
            {selectedImage && !isCameraActive && (
              <div className="space-y-4">
                <img
                  src={selectedImage}
                  alt="Selected"
                  className="w-full border-4 border-border"
                />
                
                {!result && (
                  <div className="space-y-2">
                    <Button
                      onClick={classifyImage}
                      disabled={isClassifying}
                      className="w-full py-6 bg-accent text-accent-foreground hover:bg-accent/90 pixel-corners"
                      size="lg"
                    >
                      {isClassifying ? (
                        <>
                          <Loader2 className="mr-2 animate-spin" />
                          ANALYZING...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2" />
                          CLASSIFY
                        </>
                      )}
                    </Button>
                    
                    <Button
                      onClick={reset}
                      variant="outline"
                      className="w-full"
                    >
                      RESET
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            <canvas ref={canvasRef} className="hidden" />
          </Card>

          {/* Right: Result Section */}
          <Card className="p-6 bg-card border-4 border-border neon-border pixel-corners">
            <h2 className="text-lg text-card-foreground mb-6">RESULT</h2>
            
            {!result && (
              <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
                Waiting for classification...
              </div>
            )}
            
            {result && (
              <div className="space-y-6 scanlines">
                <div className={`text-center p-8 border-4 pixel-corners ${
                  result.isHotDog 
                    ? 'border-primary bg-primary/10' 
                    : 'border-destructive bg-destructive/10'
                }`}>
                  <div className={`text-4xl mb-4 ${
                    result.isHotDog ? 'text-primary' : 'text-destructive'
                  } neon-glow`}>
                    {result.isHotDog ? '✅' : '❌'}
                  </div>
                  <div className={`text-2xl mb-2 ${
                    result.isHotDog ? 'text-primary' : 'text-destructive'
                  }`}>
                    {result.isHotDog ? 'HOT DOG!' : 'NOT HOT DOG'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Confidence: {result.confidence}%
                  </div>
                </div>
                
                <Button
                  onClick={reset}
                  className="w-full py-6 bg-secondary text-secondary-foreground hover:bg-secondary/90 pixel-corners"
                  size="lg"
                >
                  TRY AGAIN
                </Button>
                
                <Button
                  onClick={() => window.location.href = '/gallery'}
                  variant="outline"
                  className="w-full"
                >
                  VIEW GALLERY
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
