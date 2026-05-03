import type { FC } from 'react';
import type { Message, RoleConfig } from '../types/types';

interface Props { message: Message; role: RoleConfig; userName: string; }

const MessageBubble: FC<Props> = ({ message, role, userName }) => {
  const isUser = message.role === 'user';

  return (
    <div
      className="anim-msg msg-row flex gap-2.5 items-end"
      style={{ justifyContent: isUser ? 'flex-end' : 'flex-start' }}
    >
      {/* AI avatar */}
      {!isUser && (
        <div
          className="w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center text-base select-none"
          style={{
            background: `linear-gradient(135deg,${role.g1},${role.g2})`,
            border: '1.5px solid rgba(255,255,255,0.18)',
            boxShadow: `0 4px 18px ${role.color}55`,
          }}
        >{role.emoji}</div>
      )}

      <div
        className="flex flex-col gap-1.5"
        style={{ maxWidth: 'min(72%,460px)', alignItems: isUser ? 'flex-end' : 'flex-start' }}
      >
        {/* Bubble */}
        <div
          className="px-4 py-3 text-sm break-words whitespace-pre-wrap"
          style={{
            lineHeight: 1.72,
            background: isUser
              ? `linear-gradient(135deg,${role.g1},${role.g2})`
              : 'rgba(255,255,255,0.07)',
            color: isUser ? '#fff' : 'rgba(255,255,255,0.9)',
            borderRadius: isUser ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
            border: isUser ? 'none' : '1px solid rgba(255,255,255,0.09)',
            boxShadow: isUser
              ? `0 6px 24px ${role.color}45, inset 0 1px 0 rgba(255,255,255,0.22)`
              : 'inset 0 1px 0 rgba(255,255,255,0.05)',
          }}
        >{message.content}</div>

        {/* Time + read */}
        <div
          className="flex items-center gap-1.5 px-1"
          style={{ flexDirection: isUser ? 'row-reverse' : 'row' }}
        >
          <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.22)' }}>{message.time}</span>
          {isUser && <span className="text-[10px]" style={{ color: role.color, opacity: 0.7 }}>✓✓</span>}
        </div>
      </div>

      {/* User avatar */}
      {isUser && (
        <div
          className="w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white select-none tracking-wide"
          style={{
            background: `linear-gradient(135deg,${role.g1}cc,${role.g2})`,
            border: '1.5px solid rgba(255,255,255,0.18)',
            boxShadow: `0 4px 16px ${role.color}50`,
          }}
        >{userName.slice(0, 2).toUpperCase()}</div>
      )}
    </div>
  );
};

export default MessageBubble;
