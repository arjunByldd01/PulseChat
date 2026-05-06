import { cn } from "~/lib/utils";
import type { Message } from "~/store/workspace-store";

const AVATAR_COLORS = [
  "bg-[#E01E5A]", "bg-[#36C5F0]", "bg-[#2EB67D]", "bg-[#ECB22E]",
  "bg-[#E8912D]", "bg-[#78D64B]", "bg-[#CC4C2F]", "bg-[#1264A3]",
];

function getColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]!;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

interface Props {
  message: Message;
  isGrouped?: boolean;
}

export function MessageItem({ message, isGrouped = false }: Props) {
  if (isGrouped) {
    return (
      <div className="group flex items-start gap-0 pl-[52px] pr-6 py-0.5 hover:bg-white/5">
        <span className="mr-2 mt-0.5 w-10 shrink-0 text-right text-[11px] text-[#616061] opacity-0 group-hover:opacity-100">
          {formatTime(message.createdAt)}
        </span>
        <p className="flex-1 break-words text-[15px] leading-[22px] text-[#D1D2D3]">{message.content}</p>
      </div>
    );
  }

  return (
    <div className="group flex items-start gap-2 px-6 py-1 hover:bg-white/5">
      {/* Avatar */}
      <div className={cn("mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white", getColor(message.userName))}>
        {message.userName[0]?.toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-[15px] font-bold text-white hover:underline cursor-pointer">
            {message.userName}
          </span>
          <span className="text-[11px] text-[#616061]">
            {formatTime(message.createdAt)}
          </span>
        </div>
        <p className="break-words text-[15px] leading-[22px] text-[#D1D2D3]">{message.content}</p>
      </div>
    </div>
  );
}
