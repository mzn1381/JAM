#!/bin/sh
set -eu

export API_BASE_URL="${API_BASE_URL:-https://ai-develop.mypishkar.ir}"
export FF_SHOW_VOICE_BUTTON="${FF_SHOW_VOICE_BUTTON:-false}"

envsubst '${API_BASE_URL} ${FF_SHOW_VOICE_BUTTON}' \
  < /usr/share/nginx/html/config.template.js \
  > /usr/share/nginx/html/config.js
