import { SocketProvider } from "~/providers/socket-provider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SocketProvider>
      <div className="flex h-screen flex-col overflow-hidden bg-[#1a1d21]">
        {children}
      </div>
    </SocketProvider>
  );
}
