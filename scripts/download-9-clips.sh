#!/bin/bash

cd /home/suario/ruy-projects/project-yt/output/videos/Romanos-8-28

echo "📥 Descargando 9 clips completados..."

wget -q --show-progress -O clip-01-hook-5s.mp4 "https://pikaso.cdnpk.net/private/production/4998314336/4613a708-bc37-4c6a-97ab-8811e0b499a9-0.mp4?token=exp=1785628800~hmac=5fd51f0387de5d414053adf8d1b0d5f76a451b6c3d32c05290af88a2820b2520"

wget -q --show-progress -O clip-02-intro-13s.mp4 "https://pikaso.cdnpk.net/private/production/4998468738/d0aa9cd4-eff4-442f-8e13-cfc1ef111ed6-0.mp4?token=exp=1785628800~hmac=50d84451ce34dfcd5250a644085e06b3772a3e68eecdba41c291c758d42b87ac"

wget -q --show-progress -O clip-03-intro-12s.mp4 "https://pikaso.cdnpk.net/private/production/4998312050/04044e68-1d6f-4ea6-a6af-db67608a7af1-2.mp4?token=exp=1785628800~hmac=fe8c3f2804a77e7b4cd66a6982d3d7a3953c51dd64cd49a8838fc7776b286ca1"

wget -q --show-progress -O clip-05-body-15s.mp4 "https://pikaso.cdnpk.net/private/production/4998313000/58afdf5b-ecc4-4e2c-9a8c-350e678ded9a-4.mp4?token=exp=1785628800~hmac=10b5c7919fcaf28ed4548f8d8b2c9e6382a39994371faf1a90b1f76a37159270"

wget -q --show-progress -O clip-06-body-15s.mp4 "https://pikaso.cdnpk.net/private/production/4998354262/88a43ff7-2064-47a3-b234-25050c203566-5.mp4?token=exp=1785628800~hmac=8601b9ccc16e8b81fb0d84d8cf82c8b70bf3fcd9b43589d5bd402502e63c87c6"

wget -q --show-progress -O clip-07-application-13s.mp4 "https://pikaso.cdnpk.net/private/production/4998343770/7a1f296a-f466-404e-a969-76b32a245cbb-6.mp4?token=exp=1785628800~hmac=bbae6ab5de1417c28911df98da2509e1ccccd099ebddbb6c658d1cf5bd890154"

wget -q --show-progress -O clip-08-application-12s.mp4 "https://pikaso.cdnpk.net/private/production/4998378379/8b424f0c-bf7b-4136-b299-47bbf523f8bc-7.mp4?token=exp=1785628800~hmac=56e2fd9d2d26af84778e0d081ad5058d0009887f7968bb23995b25b407de3836"

wget -q --show-progress -O clip-09-cta-10s.mp4 "https://pikaso.cdnpk.net/private/production/4998317973/88d914d2-6b60-4524-95a2-3bf7eeebe484-8.mp4?token=exp=1785628800~hmac=78b63a1f2970a22fec60ab282e55101765ad6b859ecc66c628101477a7bb5920"

wget -q --show-progress -O clip-10-cta-10s.mp4 "https://pikaso.cdnpk.net/private/production/4998334674/890522ee-ffa0-4691-972b-791c62ce619a-9.mp4?token=exp=1785628800~hmac=43d141b2e4494775390d436756803d72502418ebb4d9ae494c4374a2292595ff"

echo ""
echo "✅ Descarga completada (9/10 clips)"
echo "⏳ Pendiente: clip-04 (regeneración en curso)"
echo ""
ls -lh *.mp4
