import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Mail, RefreshCw, LogOut, CheckCircle } from 'lucide-react';

export default function EmailVerificationRequired() {
  const { user, logout, getAuthHeaders } = useAuth();
  const { toast } = useToast();
  const [resending, setResending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResendVerification = async () => {
    setResending(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { ...getAuthHeaders() },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to resend verification email');

      setSent(true);
      toast({
        title: "Email Sent",
        description: "Verification email sent! Check your inbox and spam folder.",
        variant: "success"
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setResending(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md glass-panel">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <div className="icon-box icon-box-lg bg-warning/10 border-warning/20">
              <Mail className="h-8 w-8 text-warning" />
            </div>
          </div>
          <CardTitle className="text-2xl">Verify Your Email</CardTitle>
          <CardDescription className="text-base">
            Please verify your email address to continue using the application.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="glass-panel rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Verification email sent to:</p>
            <p className="font-medium">{user?.email}</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Check your inbox and spam folder for the verification link.
              The link expires in 24 hours.
            </p>

            {sent ? (
              <div className="flex items-center justify-center gap-2 text-success py-2">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Email sent! Check your inbox.</span>
              </div>
            ) : (
              <Button
                onClick={handleResendVerification}
                disabled={resending}
                className="w-full btn-interactive"
                variant="default"
              >
                {resending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Resend Verification Email
              </Button>
            )}

            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full btn-interactive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Wrong email address?{' '}
            <button
              onClick={handleLogout}
              className="text-primary hover:underline"
            >
              Sign out and register again
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
