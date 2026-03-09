# Publicacion de WebPro

Guia corta para dejar activas las autoactualizaciones de la app Tauri.

## 1. Claves del updater

Genera las claves solo una vez y no las subas a git:

```bash
npx tauri signer generate -w ./updater-keys.key
```

- Guarda la private key en tus secrets de GitHub Actions.
- La public key ya debe vivir en `src-tauri/tauri.conf.json`.

## 2. Build local sin firma

Para probar la app instalable en local:

```bash
npm install
npm run tauri:build
```

## 3. Build firmado para release

Para generar artefactos validos para updater:

```bash
export TAURI_SIGNING_PRIVATE_KEY="tu_clave_privada"
# opcional si la clave lleva password
# export TAURI_SIGNING_PRIVATE_KEY_PASSWORD="tu_password"

npm run release:signed
```

## 4. Release en GitHub

El workflow `.github/workflows/release.yml` publica releases al hacer push de un tag `v*`.

Ejemplo:

```bash
git tag v1.0.3
git push origin v1.0.3
```

Ese pipeline necesita estos secrets:

- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` (si aplica)

## 5. Manifest `latest.json`

El updater de la app consulta:

`https://webpro-updates.reservas-elrinconcito.workers.dev/latest.json`

El worker de `worker-updater/index.js` lee la ultima release de GitHub y construye el manifest automaticamente.

Antes de depender de ello en produccion, asegúrate de desplegar ese worker apuntando al repo real que publica las releases ahora mismo:

`reservaselrinconcito-stack/framepro-app`
