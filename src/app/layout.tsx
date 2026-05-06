import "~/app/globals.css";
import { type Metadata } from "next";
import { Toaster } from "~/components/ui/toaster";

export const metadata: Metadata = {
  title: "Slack Clone",
  description: "A modern team messaging application",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
