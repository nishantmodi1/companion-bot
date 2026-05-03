import React from 'react';
import type { RoleConfig } from '../types/types';

const TypingIndicator: React.FC<{ role: RoleConfig }> = ({ role }) => (
  <div className="anim-msg flex gap-2.5 items-end">
    <div
      className="w-9 h-9 rounded-2xl flex items-center justify-center text-base"
      style={{
        background: `linear-gradient(135deg,${role.g1},${role.g2})`,
        border: '1.5px solid rgba(255,255,255,0.18)',
        boxShadow: `0 4px 16px ${role.color}50`,
      }}
    >{role.emoji}</div>

    <div
      className="flex items-center gap-1.5 px-5 py-4"
      style={{
        background: 'rgba(255,255,255,0.07)',
        border: '1px solid rgba(255,255,255,0.09)',
        borderRadius: '20px 20px 20px 5px',
      }}
    >
      {[0, 150, 300].map((delay, i) => (
        <span
          key={i}
          className="block w-2 h-2 rounded-full"
          style={{
            background: role.color,
            animation: `dotBounce 1.3s ${delay}ms ease-in-out infinite`,
            boxShadow: `0 0 10px ${role.color}90`,
          }}
        />
      ))}
    </div>
  </div>
);

export default TypingIndicator;
