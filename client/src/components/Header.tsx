import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "./NotificationBell";
import { getLoginUrl } from "@/const";
import { LogOut } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function Header() {
  const { user, isAuthenticated } = useAuth();
  
  const logout = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Logged out successfully");
      window.location.href = '/';
    },
  });

  return (
    <header className="sticky top-0 z-50 w-full border-b-4 border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <a href="/" className="flex items-center space-x-2">
          <span className="text-lg md:text-xl font-bold text-primary neon-glow">
            HOT DOG OR NOT
          </span>
        </a>

        {/* Navigation */}
        <nav className="flex items-center gap-2 md:gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/gallery'}
            className="text-xs md:text-sm pixel-corners"
          >
            GALLERY
          </Button>
          
          {isAuthenticated && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/generate'}
                className="text-xs md:text-sm pixel-corners"
              >
                GENERATE
              </Button>
              
              <NotificationBell />
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => logout.mutate()}
                className="pixel-corners"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {!isAuthenticated && (
            <Button
              size="sm"
              onClick={() => window.location.href = getLoginUrl()}
              className="bg-primary text-primary-foreground pixel-corners text-xs md:text-sm"
            >
              LOGIN
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
