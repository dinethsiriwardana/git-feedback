'use client';

import { useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

export function useVisitorId() {
  const [visitorId, setVisitorId] = useState<string>('');

  useEffect(() => {
    const key = 'feedback_visitor_id';
    let storedId = localStorage.getItem(key);
    if (!storedId) {
      storedId = uuidv4();
      localStorage.setItem(key, storedId);
    }
    setVisitorId(storedId);
  }, []);

  return visitorId;
}
