import React from 'react'

interface ProVapLogoProps {
  height?: number
  className?: string
}

/**
 * Logo Pro'Vap officiel. Affichage par image (SVG dans public/assets).
 * En mode clair, on inverse pour rester lisible (le SVG source est blanc).
 */
export function ProVapLogo({ height = 24, className = '' }: ProVapLogoProps) {
  return (
    <img
      src="/assets/logo-provap-blanc.svg"
      alt="Pro'Vap"
      style={{ height, width: 'auto', display: 'block' }}
      className={`pv-logo ${className}`}
      data-pv-logo
    />
  )
}
