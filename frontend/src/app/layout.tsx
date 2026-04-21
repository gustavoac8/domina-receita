import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DominaReceita Médica',
  description:
    'Aumente o faturamento da sua clínica em 3x–5x em 90–120 dias com marketing digital e funil automatizado.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
