# Cómo publicar shirowellness.com

El sitio vive en el **Worker `shirowellness`** de Cloudflare (no en Pages).
Los dominios `shirowellness.com` y `www.shirowellness.com` están asignados a ese Worker.

## Publicar
Desde esta rama (`web-shirowellness`), con `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID` cargados:

    npx wrangler deploy --message "qué cambió"

Después verificar https://shirowellness.com en el navegador y la consola (sin errores de CSP).

## Volver atrás
    npx wrangler deployments list
    npx wrangler rollback <version-id>

## Seguridad (`_headers`)
La Content-Security-Policy solo permite lo que está listado. Cualquier servicio externo nuevo
(Google Maps, Instagram, Meta Pixel, Google Analytics, YouTube, widgets, otras fuentes) se bloquea
en silencio hasta agregar su dominio en la directiva que corresponda (`script-src`, `connect-src`,
`img-src`, `frame-src`, `font-src`).

- `static.cloudflareinsights.com` / `cloudflareinsights.com`: Cloudflare Web Analytics (no sacar).
- `script.google.com` / `script.googleusercontent.com`: envío del formulario de solicitud.

HSTS tiene `preload`, pero el dominio **no** está inscripto en hstspreload.org; no inscribirlo sin decidirlo.
