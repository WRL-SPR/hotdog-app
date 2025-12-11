import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Sparkles, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

export default function Generate() {
  const { user, isAuthenticated } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateMutation = trpc.ai.generateHotDog.useMutation({
    onSuccess: (data) => {
      setGeneratedImage(data.imageUrl || null);
      setIsGenerating(false);
      toast.success("Hot dog image generated!");
    },
    onError: (error) => {
      setIsGenerating(false);
      toast.error("Generation failed: " + error.message);
    },
  });

  const handleGenerate = () => {
    if (!prompt.trim()) {
      toast.error("Please enter a description");
      return;
    }
    
    setIsGenerating(true);
    generateMutation.mutate({ prompt: prompt.trim() });
  };

  const handleTestGenerated = () => {
    if (generatedImage) {
      // Convert URL to base64 and redirect to home with the image
      fetch(generatedImage)
        .then(res => res.blob())
        .then(blob => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            sessionStorage.setItem('testImage', base64);
            window.location.href = '/';
          };
          reader.readAsDataURL(blob);
        })
        .catch(() => {
          toast.error("Failed to load image");
        });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-8">
          <h1 className="text-4xl md:text-6xl text-primary neon-glow">
            AI GENERATOR
          </h1>
          <p className="text-sm text-muted-foreground max-w-md">
            Please login to generate hot dog images
          </p>
          <Button
            size="lg"
            className="mt-8 text-lg px-8 py-6 neon-border bg-primary text-primary-foreground pixel-corners"
            onClick={() => window.location.href = getLoginUrl()}
          >
            LOGIN
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      {/* Floating Pixel Elements */}
      <div className="absolute top-20 left-10 w-8 h-8 bg-accent pixel-float opacity-30" style={{ animationDelay: '0s' }} />
      <div className="absolute top-40 right-20 w-12 h-12 bg-secondary pixel-float opacity-30" style={{ animationDelay: '1.5s' }} />
      <div className="absolute bottom-40 left-20 w-10 h-10 bg-primary pixel-float opacity-30" style={{ animationDelay: '3s' }} />
      
      <div className="container max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-5xl text-accent neon-glow mb-4">
            AI HOT DOG GENERATOR
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            Describe your dream hot dog and let AI create it!
          </p>
        </div>

        {/* Navigation */}
        <div className="flex gap-4 justify-center mb-8">
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="pixel-corners"
          >
            BACK TO HOME
          </Button>
          <Button
            onClick={() => window.location.href = '/gallery'}
            variant="outline"
            className="pixel-corners"
          >
            VIEW GALLERY
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Left: Input Section */}
          <Card className="p-6 bg-card border-4 border-border neon-border pixel-corners">
            <h2 className="text-lg text-card-foreground mb-6">DESCRIBE</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">
                  Hot Dog Description
                </label>
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., gourmet hot dog with mustard and relish on a sesame bun"
                  className="w-full"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !isGenerating) {
                      handleGenerate();
                    }
                  }}
                />
              </div>

              <div className="space-y-2 text-xs text-muted-foreground">
                <p>💡 Tips:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Be specific about toppings and style</li>
                  <li>Mention the bun type</li>
                  <li>Add details like "close-up" or "on a plate"</li>
                </ul>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full py-6 bg-accent text-accent-foreground hover:bg-accent/90 pixel-corners"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 animate-spin" />
                    GENERATING...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2" />
                    GENERATE
                  </>
                )}
              </Button>
            </div>
          </Card>

          {/* Right: Result Section */}
          <Card className="p-6 bg-card border-4 border-border neon-border pixel-corners">
            <h2 className="text-lg text-card-foreground mb-6">RESULT</h2>
            
            {!generatedImage && !isGenerating && (
              <div className="flex items-center justify-center h-96 text-muted-foreground text-sm">
                Your generated hot dog will appear here
              </div>
            )}

            {isGenerating && (
              <div className="flex flex-col items-center justify-center h-96 space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-accent" />
                <p className="text-sm text-muted-foreground">
                  Creating your hot dog...
                </p>
              </div>
            )}

            {generatedImage && !isGenerating && (
              <div className="space-y-4">
                <img
                  src={generatedImage}
                  alt="Generated hot dog"
                  className="w-full border-4 border-border scanlines"
                />
                
                <div className="space-y-2">
                  <Button
                    onClick={handleTestGenerated}
                    className="w-full py-4 bg-primary text-primary-foreground hover:bg-primary/90 pixel-corners"
                  >
                    TEST THIS IMAGE
                  </Button>
                  
                  <Button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = generatedImage;
                      link.download = 'ai-hotdog.png';
                      link.click();
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    <Download className="mr-2 w-4 h-4" />
                    DOWNLOAD
                  </Button>
                  
                  <Button
                    onClick={() => {
                      setGeneratedImage(null);
                      setPrompt("");
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    GENERATE NEW
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
