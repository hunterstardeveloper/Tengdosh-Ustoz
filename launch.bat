@echo off
title Tengdosh-ustoz Server and Tunnel
echo Starting Python Server on port 8000...
start cmd /k "py -m http.server 8000"

echo Starting Ngrok Tunnel to unprimed-edmundo-citatory.ngrok-free.dev...
start cmd /k "ngrok http --url=unprimed-edmundo-citatory.ngrok-free.dev 8000"

echo.
echo ---------------------------------------------------
echo YOUR PROJECT IS LIVE AT:
echo https://unprimed-edmundo-citatory.ngrok-free.dev
echo ---------------------------------------------------
pause