export default function WorkspaceHomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-[#1a1d21]">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
        <span className="text-3xl font-bold text-[#ABABAD]">#</span>
      </div>
      <div className="text-center">
        <p className="text-xl font-semibold text-white">It&apos;s looking a bit empty</p>
        <p className="mt-1 text-sm text-[#ABABAD]">Select a channel on the left or create a new one to start chatting.</p>
      </div>
    </div>
  );
}
