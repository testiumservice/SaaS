'use client';

import { Turnstile } from '@marsidev/react-turnstile';

interface Props {
  onToken: (token: string) => void;
}

export function TurnstileWidget({ onToken }: Props) {
  return (
    <Turnstile
      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY as string}
      onSuccess={onToken}
      options={{ theme: 'light' }}
    />
  );
}