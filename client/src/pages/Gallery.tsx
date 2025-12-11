import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Heart, MessageCircle, Loader2, Filter } from "lucide-react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

type FilterType = 'all' | 'hotdog' | 'not-hotdog';

export default function Gallery() {
  const { user, isAuthenticated } = useAuth();
  const [filter, setFilter] = useState<FilterType>('all');
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const utils = trpc.useUtils();

  const { data: predictions, isLoading } = trpc.predictions.list.useQuery({ filter });

  const toggleUpvote = trpc.upvotes.toggle.useMutation({
    onMutate: async ({ predictionId }) => {
      await utils.predictions.list.cancel();
      const previousData = utils.predictions.list.getData({ filter });
      
      utils.predictions.list.setData({ filter }, (old) => {
        if (!old) return old;
        return old.map((item) => {
          if (item.prediction.id === predictionId) {
            const currentCount = Number(item.upvoteCount);
            const newCount = currentCount + 1; // Optimistic increment
            return { ...item, upvoteCount: newCount };
          }
          return item;
        });
      });
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        utils.predictions.list.setData({ filter }, context.previousData);
      }
      toast.error("Failed to update upvote");
    },
    onSettled: () => {
      utils.predictions.list.invalidate({ filter });
    },
  });

  const addComment = trpc.comments.add.useMutation({
    onSuccess: (_, variables) => {
      setCommentInputs((prev) => ({ ...prev, [variables.predictionId]: '' }));
      utils.comments.list.invalidate({ predictionId: variables.predictionId });
      toast.success("Comment added!");
    },
    onError: () => {
      toast.error("Failed to add comment");
    },
  });

  const handleUpvote = (predictionId: number) => {
    if (!isAuthenticated) {
      toast.error("Please login to upvote");
      return;
    }
    toggleUpvote.mutate({ predictionId });
  };

  const handleAddComment = (predictionId: number) => {
    if (!isAuthenticated) {
      toast.error("Please login to comment");
      return;
    }
    
    const content = commentInputs[predictionId]?.trim();
    if (!content) {
      toast.error("Comment cannot be empty");
      return;
    }
    
    addComment.mutate({ predictionId, content });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 relative">
      {/* Floating Pixel Elements */}
      <div className="absolute top-20 left-10 w-8 h-8 bg-primary pixel-float opacity-30" style={{ animationDelay: '0s' }} />
      <div className="absolute top-40 right-20 w-12 h-12 bg-secondary pixel-float opacity-30" style={{ animationDelay: '1s' }} />
      
      <div className="container max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl text-primary neon-glow mb-4">
            GALLERY
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            All predictions from the community
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <Button
            onClick={() => setFilter('all')}
            className={`pixel-corners ${
              filter === 'all' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}
          >
            <Filter className="mr-2 w-4 h-4" />
            ALL
          </Button>
          <Button
            onClick={() => setFilter('hotdog')}
            className={`pixel-corners ${
              filter === 'hotdog' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}
          >
            🌭 HOT DOG
          </Button>
          <Button
            onClick={() => setFilter('not-hotdog')}
            className={`pixel-corners ${
              filter === 'not-hotdog' 
                ? 'bg-destructive text-destructive-foreground' 
                : 'bg-muted text-muted-foreground'
            }`}
          >
            ❌ NOT HOT DOG
          </Button>
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
          {isAuthenticated && (
            <Button
              onClick={() => window.location.href = '/generate'}
              className="bg-accent text-accent-foreground pixel-corners"
            >
              GENERATE HOT DOG
            </Button>
          )}
        </div>

        {/* Gallery Grid */}
        {predictions && predictions.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            No predictions yet. Be the first!
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {predictions?.map((item) => (
            <PredictionCard
              key={item.prediction.id}
              prediction={item}
              isAuthenticated={isAuthenticated}
              commentInput={commentInputs[item.prediction.id] || ''}
              onCommentInputChange={(value) =>
                setCommentInputs((prev) => ({ ...prev, [item.prediction.id]: value }))
              }
              onUpvote={() => handleUpvote(item.prediction.id)}
              onAddComment={() => handleAddComment(item.prediction.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PredictionCard({
  prediction,
  isAuthenticated,
  commentInput,
  onCommentInputChange,
  onUpvote,
  onAddComment,
}: {
  prediction: any;
  isAuthenticated: boolean;
  commentInput: string;
  onCommentInputChange: (value: string) => void;
  onUpvote: () => void;
  onAddComment: () => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const { data: comments } = trpc.comments.list.useQuery(
    { predictionId: prediction.prediction.id },
    { enabled: showComments }
  );

  return (
    <Card className="overflow-hidden bg-card border-4 border-border neon-border pixel-corners">
      {/* Image */}
      <div className="relative">
        <img
          src={prediction.prediction.imageUrl}
          alt="Prediction"
          className="w-full h-64 object-cover"
        />
        <div
          className={`absolute top-2 right-2 px-3 py-1 text-xs pixel-corners ${
            prediction.prediction.isHotDog
              ? 'bg-primary text-primary-foreground'
              : 'bg-destructive text-destructive-foreground'
          }`}
        >
          {prediction.prediction.isHotDog ? '🌭 HOT DOG' : '❌ NOT HOT DOG'}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* User Info */}
        <div className="text-xs text-muted-foreground">
          By {prediction.user?.name || 'Anonymous'} • {prediction.prediction.confidence}% confidence
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <Button
            onClick={onUpvote}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-xs"
            disabled={!isAuthenticated}
          >
            <Heart className="w-4 h-4" />
            {prediction.upvoteCount}
          </Button>
          <Button
            onClick={() => setShowComments(!showComments)}
            variant="ghost"
            size="sm"
            className="flex items-center gap-2 text-xs"
          >
            <MessageCircle className="w-4 h-4" />
            {prediction.commentCount}
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="space-y-3 border-t-2 border-border pt-3">
            {/* Comment Input */}
            {isAuthenticated && (
              <div className="flex gap-2">
                <Input
                  value={commentInput}
                  onChange={(e) => onCommentInputChange(e.target.value)}
                  placeholder="Add comment..."
                  className="text-xs"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onAddComment();
                    }
                  }}
                />
                <Button onClick={onAddComment} size="sm" className="pixel-corners">
                  POST
                </Button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {comments?.map((comment) => (
                <div key={comment.comment.id} className="text-xs bg-muted p-2 pixel-corners">
                  <div className="font-bold text-primary">
                    {comment.user?.name || 'Anonymous'}
                  </div>
                  <div className="text-foreground">{comment.comment.content}</div>
                </div>
              ))}
              {comments?.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-2">
                  No comments yet
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
