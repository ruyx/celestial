# ⏰ Cron Setup - Automatización de Tareas

## Descripción

Este documento explica cómo configurar **cron jobs automáticos** para ejecutar:

1. **Daily Video Upload**: Subir 1 video a YouTube cada día a las 12:00 (mediodía)
2. **Weekly Analytics**: Recolectar métricas de YouTube cada 7 días (domingos a las 3:00 AM)

---

## 📋 Tareas Programadas

### Tarea 1: Upload Diario de Videos

**Frecuencia**: Todos los días a las 12:00 (mediodía)
**Script**: `agents/agent-8-youtube-uploader.js` (pendiente de crear)
**Propósito**: Seleccionar el versículo con mayor `viral_potential` no publicado y subirlo a YouTube

### Tarea 2: Recolección de Analytics

**Frecuencia**: Todos los domingos a las 3:00 AM
**Script**: `agents/agent-9-analytics-collector.js`
**Propósito**: Recolectar métricas de YouTube y almacenarlas en Supabase

---

## 🚀 Método 1: Systemd Timers (Recomendado para Ubuntu/Debian)

### Ventajas

- ✅ Más moderno y robusto que cron
- ✅ Logs integrados con `journalctl`
- ✅ Reintentos automáticos en caso de error
- ✅ Dependencias de servicios
- ✅ Ejecución en boot si se perdió la hora programada

### Instalación

#### 1. Crear servicio de analytics

```bash
sudo nano /etc/systemd/system/rey-celestial-analytics.service
```

**Contenido**:

```ini
[Unit]
Description=Rey Celestial - YouTube Analytics Collector
After=network.target

[Service]
Type=oneshot
User=suario
WorkingDirectory=/home/suario/ruy-projects/project-yt
ExecStart=/usr/bin/node /home/suario/ruy-projects/project-yt/agents/agent-9-analytics-collector.js --min-days=1

# Variables de entorno
EnvironmentFile=/home/suario/ruy-projects/project-yt/.env

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=rey-celestial-analytics

[Install]
WantedBy=multi-user.target
```

#### 2. Crear timer de analytics

```bash
sudo nano /etc/systemd/system/rey-celestial-analytics.timer
```

**Contenido**:

```ini
[Unit]
Description=Rey Celestial - Weekly Analytics Collection
Requires=rey-celestial-analytics.service

[Timer]
# Ejecutar todos los domingos a las 3:00 AM
OnCalendar=Sun *-*-* 03:00:00

# Si el sistema estaba apagado, ejecutar al arrancar
Persistent=true

[Install]
WantedBy=timers.target
```

#### 3. Habilitar y activar timer

```bash
# Recargar systemd
sudo systemctl daemon-reload

# Habilitar el timer (se activa en boot)
sudo systemctl enable rey-celestial-analytics.timer

# Iniciar el timer ahora
sudo systemctl start rey-celestial-analytics.timer

# Verificar estado
sudo systemctl status rey-celestial-analytics.timer
sudo systemctl list-timers | grep rey-celestial
```

#### 4. Ejecutar manualmente (para testing)

```bash
# Ejecutar el servicio ahora (sin esperar al timer)
sudo systemctl start rey-celestial-analytics.service

# Ver logs
sudo journalctl -u rey-celestial-analytics.service -f
```

---

## 🕐 Método 2: Cron Tradicional

### Ventajas

- ✅ Más simple y familiar
- ✅ Disponible en todos los sistemas Linux
- ✅ No requiere permisos de sudo

### Instalación

#### 1. Editar crontab del usuario

```bash
crontab -e
```

#### 2. Agregar las siguientes líneas

```cron
# Rey Celestial - YouTube Analytics (Domingos a las 3:00 AM)
0 3 * * 0 cd /home/suario/ruy-projects/project-yt && /usr/bin/node agents/agent-9-analytics-collector.js --min-days=1 >> /home/suario/ruy-projects/project-yt/logs/analytics.log 2>&1

# Rey Celestial - Daily Video Upload (Todos los días a las 12:00)
0 12 * * * cd /home/suario/ruy-projects/project-yt && /usr/bin/node agents/agent-8-youtube-uploader.js >> /home/suario/ruy-projects/project-yt/logs/upload.log 2>&1
```

#### 3. Crear directorio de logs

```bash
mkdir -p /home/suario/ruy-projects/project-yt/logs
```

#### 4. Verificar que cron está instalado

```bash
# Verificar servicio cron
sudo systemctl status cron

# Si no está activo, iniciarlo
sudo systemctl start cron
sudo systemctl enable cron
```

#### 5. Listar tareas programadas

```bash
crontab -l
```

---

## 📝 Sintaxis de Cron

```
┌───────────── minuto (0 - 59)
│ ┌───────────── hora (0 - 23)
│ │ ┌───────────── día del mes (1 - 31)
│ │ │ ┌───────────── mes (1 - 12)
│ │ │ │ ┌───────────── día de la semana (0 - 6) (0 = domingo)
│ │ │ │ │
│ │ │ │ │
* * * * * comando a ejecutar
```

### Ejemplos Comunes

```cron
# Cada hora
0 * * * * comando

# Cada día a las 2:30 AM
30 2 * * * comando

# Cada lunes a las 9:00 AM
0 9 * * 1 comando

# Cada primer día del mes
0 0 1 * * comando

# Cada 15 minutos
*/15 * * * * comando

# De lunes a viernes a las 8:00 AM
0 8 * * 1-5 comando
```

---

## 📊 Monitoreo y Logs

### Systemd Timers

```bash
# Ver próxima ejecución programada
systemctl list-timers

# Ver logs del último run
sudo journalctl -u rey-celestial-analytics.service -n 100

# Ver logs en tiempo real
sudo journalctl -u rey-celestial-analytics.service -f

# Ver logs de un período específico
sudo journalctl -u rey-celestial-analytics.service --since "2026-07-20" --until "2026-07-21"
```

### Cron Tradicional

```bash
# Ver logs del cron system
sudo tail -f /var/log/syslog | grep CRON

# Ver logs de la aplicación
tail -f /home/suario/ruy-projects/project-yt/logs/analytics.log
tail -f /home/suario/ruy-projects/project-yt/logs/upload.log
```

---

## 🐛 Troubleshooting

### Error: "Permission denied"

**Causa**: El script no tiene permisos de ejecución.

**Solución**:

```bash
chmod +x /home/suario/ruy-projects/project-yt/agents/agent-9-analytics-collector.js
chmod +x /home/suario/ruy-projects/project-yt/agents/agent-8-youtube-uploader.js
```

---

### Error: "node: command not found"

**Causa**: Cron no encuentra el path de Node.js.

**Solución**: Usar path absoluto en crontab:

```bash
# Encontrar path de node
which node

# Usar path completo en cron
0 3 * * 0 cd /home/suario/ruy-projects/project-yt && /usr/bin/node agents/agent-9-analytics-collector.js
```

---

### Error: Variables de entorno no disponibles

**Causa**: Cron no carga `.env` automáticamente.

**Solución 1**: Usar `dotenv` en el script (ya implementado en agent-9)

**Solución 2**: Cargar `.env` explícitamente en cron:

```cron
0 3 * * 0 cd /home/suario/ruy-projects/project-yt && export $(cat .env | xargs) && node agents/agent-9-analytics-collector.js
```

---

### Timer no se ejecuta a tiempo

**Causa**: Sistema estaba apagado cuando debía ejecutarse.

**Solución**: El flag `Persistent=true` en el timer asegura ejecución al arrancar.

**Verificar**:

```bash
# Ver cuándo fue la última ejecución
sudo systemctl status rey-celestial-analytics.service

# Ejecutar manualmente si es necesario
sudo systemctl start rey-celestial-analytics.service
```

---

## 🔄 Script de Setup Automático

Para facilitar la instalación, puedes usar el script `scripts/setup-cron.sh`:

```bash
# Dar permisos de ejecución
chmod +x scripts/setup-cron.sh

# Ejecutar (requiere sudo para systemd)
./scripts/setup-cron.sh
```

---

## 📚 Siguiente Paso

Una vez configurados los cron jobs:

**Dockerizar el Proyecto** para deployment 100% portable.

Ver: `docs/DOCKER-SETUP.md` (próximo)

---

## 📅 Calendario de Ejecución Recomendado

| Tarea | Frecuencia | Horario | Día |
|-------|-----------|---------|-----|
| **Video Upload** | Diario | 12:00 PM | Todos los días |
| **Analytics** | Semanal | 3:00 AM | Domingos |

### Justificación de Horarios

- **12:00 PM (mediodía)**: Mejor hora para publicar en YouTube (alta actividad de usuarios)
- **3:00 AM (domingos)**: Baja carga del sistema, análisis de toda la semana

---

## ⚙️ Configuración Avanzada

### Reintento en Caso de Error

**Systemd** (automático con `Restart=on-failure`):

```ini
[Service]
...
Restart=on-failure
RestartSec=60
```

**Cron** (manualmente con script wrapper):

```bash
#!/bin/bash
# scripts/run-with-retry.sh

MAX_RETRIES=3
RETRY_DELAY=60

for i in $(seq 1 $MAX_RETRIES); do
  node "$@" && break
  echo "Intento $i falló. Reintentando en ${RETRY_DELAY}s..."
  sleep $RETRY_DELAY
done
```

Usar en cron:

```cron
0 3 * * 0 /home/suario/ruy-projects/project-yt/scripts/run-with-retry.sh agents/agent-9-analytics-collector.js
```

---

## 🔔 Notificaciones por Email (Opcional)

Para recibir emails cuando las tareas fallen:

### Systemd

```bash
# Instalar mailutils
sudo apt install mailutils

# Editar servicio
sudo nano /etc/systemd/system/rey-celestial-analytics.service
```

Agregar:

```ini
[Service]
...
OnFailure=status-email@%n.service
```

### Cron

Configurar `MAILTO` en crontab:

```cron
MAILTO=tu-email@example.com

0 3 * * 0 cd /home/suario/ruy-projects/project-yt && node agents/agent-9-analytics-collector.js
```
