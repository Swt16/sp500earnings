import ThemeToggle from "@/components/ThemeToggle";
import qrCode from "@/assets/qr-code.png";

const Share = () => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <a href="/" className="text-xl font-mono font-bold text-primary tracking-tight hover:underline">
            EARNINGS TERMINAL
          </a>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">
        <h1 className="text-3xl font-mono font-bold text-foreground">Share</h1>

        <section className="space-y-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Scan the QR code below to open Earnings Terminal on any device.
          </p>
          <div className="flex justify-center">
            <img
              src={qrCode}
              alt="QR code linking to sp500earnings.lovable.app"
              className="w-64 h-64 rounded-lg border border-border bg-white p-3"
            />
          </div>
          <p className="text-center text-xs font-mono text-muted-foreground">
            sp500earnings.lovable.app
          </p>
        </section>

        <div className="pt-4 border-t border-border">
          <a href="/" className="text-sm font-mono text-primary hover:underline">
            ← Back to Terminal
          </a>
        </div>
      </main>
    </div>
  );
};

export default Share;
