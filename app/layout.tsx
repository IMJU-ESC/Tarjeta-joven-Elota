import './globals.css'

export const metadata = {
  title: 'Tarjeta Joven Elota | IMJU',
  description: 'Beneficios, empleos y promociones para las juventudes de Elota.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#D65F08" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  )
}
