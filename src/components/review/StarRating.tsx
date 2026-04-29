'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  size?: number;
}

export function StarRating({ value, onChange, size = 40 }: StarRatingProps) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-2">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= (hovered || value);
        return (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform duration-100 hover:scale-110 active:scale-95"
          >
            <Star
              size={size}
              className={cn(
                'transition-colors duration-150',
                active ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'
              )}
            />
          </button>
        );
      })}
    </div>
  );
}
