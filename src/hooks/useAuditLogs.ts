// Realtime audit trail feed (Firestore `auditLogs`).
import { useEffect, useState } from 'react';
import { subscribeAuditLogs, type AuditLog } from '@/integrations/firebase/audit';

export function useAuditLogs(max = 100) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeAuditLogs(
      (next) => {
        setLogs(next);
        setError(null);
        setLoading(false);
      },
      (message) => {
        setError(message);
        setLoading(false);
      },
      max,
    );
    return unsubscribe;
  }, [max]);

  return { logs, loading, error };
}
