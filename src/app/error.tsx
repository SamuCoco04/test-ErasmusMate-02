'use client';

import { ErrorState } from '@/components/states/error-state';

export default function Error({ error }: { error: Error }) {
  return (
    <div className="mx-auto max-w-3xl p-6">
      <ErrorState message={error.message || 'Unexpected error'} />
    </div>
  );
}
