/**
 * Génère le QR code affiché sur les slides.
 *
 *   npm run qr                      # utilise l'URL de production
 *   npm run qr -- https://autre.url # pour tester une autre cible
 *
 * Produit un PNG haute résolution (projection) et un SVG (impression, slides
 * vectorielles). Le PNG est volontairement large : un QR code projeté et scanné
 * depuis le fond d'une salle doit rester net.
 */
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import QRCode from 'qrcode'

const PRODUCTION_URL = 'https://impact-ia.quickscale.ai/'
const url = process.argv[2] ?? PRODUCTION_URL

const outputDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs')
mkdirSync(outputDir, { recursive: true })

const options = {
  errorCorrectionLevel: 'M',
  margin: 2,
  color: { dark: '#0f172a', light: '#ffffff' },
}

const png = join(outputDir, 'qr-code.png')
const svg = join(outputDir, 'qr-code.svg')

await QRCode.toFile(png, url, { ...options, type: 'png', width: 2000 })
await QRCode.toFile(svg, url, { ...options, type: 'svg' })

console.log(`QR code généré pour ${url}`)
console.log(`  ${png}`)
console.log(`  ${svg}`)
