import './globals.css'

// Estilos críticos de identidad. Permanecen en el HTML para evitar que un
// despliegue sirva el contenido nuevo antes que la hoja CSS correspondiente.
const criticalBrandCss = `
  .brand-logo-stage {
    position: relative !important;
    display: grid !important;
    width: 58px !important;
    height: 58px !important;
    min-width: 58px !important;
    min-height: 58px !important;
    max-width: 58px !important;
    max-height: 58px !important;
    place-items: center !important;
    flex: 0 0 58px !important;
  }
  .brand-logo-stage::before {
    content: "";
    position: absolute;
    inset: -2px;
    border-radius: 19px;
    background: conic-gradient(from 30deg, #64748B, #94A3B8, #5F766D, #78909C, #7C7896, #64748B);
    animation: critical-brand-spin 14s linear infinite !important;
  }
  .brand-logo-stage > img {
    position: relative !important;
    z-index: 1 !important;
    display: block !important;
    width: 52px !important;
    height: 52px !important;
    min-width: 52px !important;
    min-height: 52px !important;
    max-width: 52px !important;
    max-height: 52px !important;
    border-radius: 17px !important;
    background: #fff !important;
    object-fit: contain !important;
    padding: 5px !important;
  }
  .brand-card-watermark {
    width: 230px !important;
    height: auto !important;
    max-width: none !important;
  }
  .brand-swarm span {
    animation: critical-brand-spark 7s ease-in-out infinite !important;
  }
  .motion-enter {
    animation: critical-motion-enter .58s cubic-bezier(.16,1,.3,1) both !important;
  }
  .motion-enter-delay-1 {
    animation: critical-motion-enter .68s .08s cubic-bezier(.16,1,.3,1) both !important;
  }
  .motion-enter-delay-2 {
    animation: critical-motion-enter .72s .16s cubic-bezier(.16,1,.3,1) both !important;
  }
  @keyframes critical-brand-spin { to { transform: rotate(360deg); } }
  @keyframes critical-brand-spark {
    0%, 100% { transform: translate3d(0,0,0) rotate(18deg); }
    50% { transform: translate3d(0,-12px,0) rotate(-12deg); }
  }
  @keyframes critical-motion-enter {
    from { opacity: 0; transform: translate3d(0,18px,0) scale(.992); }
    to { opacity: 1; transform: translate3d(0,0,0) scale(1); }
  }
  @media (max-width: 420px) {
    .brand-logo-stage {
      width: 50px !important; height: 50px !important;
      min-width: 50px !important; min-height: 50px !important;
      max-width: 50px !important; max-height: 50px !important;
      flex-basis: 50px !important;
    }
    .brand-logo-stage > img {
      width: 44px !important; height: 44px !important;
      min-width: 44px !important; min-height: 44px !important;
      max-width: 44px !important; max-height: 44px !important;
      border-radius: 14px !important;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .brand-logo-stage::before,
    .brand-swarm span,
    .motion-enter,
    .motion-enter-delay-1,
    .motion-enter-delay-2 { animation: none !important; }
  }
`;

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
        <meta name="theme-color" content="#0F766E" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <style dangerouslySetInnerHTML={{ __html: criticalBrandCss }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
