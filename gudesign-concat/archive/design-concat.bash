#!/usr/bin/env bash

show-help() {
  cat <<EOF
$ design-concat TYPE output.jpg *.jpg

Type
  mobile:   resize 720x
  desktop:  resize 1200x
  raw:      no-resize
EOF
  exit 0
}

main() {
  if [[ $# -lt 2 ]]; then
    show-help
  fi

  type="$1"
  output="$1"
  shift 2

  if [[ $type == "mobile" ]]; then
    size="720x"
  elif [[ $type == "desktop" ]]; then
    size="1200x"
  elif [[ $type == "raw" ]]; then
    size="100%"
  else
    show-help
  fi

  magick "$@" -resize $size -background 'gray(189)' +smush 40 "$output"
}

main "$@"
