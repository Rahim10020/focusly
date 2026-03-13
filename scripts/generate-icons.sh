#!/usr/bin/env bash

set -euo pipefail

INPUT_DIR=${1:-public/icons}
OUTPUT_DIR=${2:-src/components/icons}
NAME_SUFFIX="Icon"

if [[ ! -d "$INPUT_DIR" ]]; then
  echo "Input directory not found: $INPUT_DIR" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

cat > "$OUTPUT_DIR/types.ts" <<'EOF'
import type * as React from "react";

export type IconProps = React.SVGProps<SVGSVGElement> & {
  size?: number;
  color?: string;
  strokeWidth?: number;
};
EOF

index_lines=()

while IFS= read -r -d '' svg_file; do
  base_name=$(basename "$svg_file" .svg)
  pascal_name=$(python - <<'PY' "$base_name"
import re
import sys

name = sys.argv[1]
parts = re.split(r"[_\-\s]+", name)
print("".join(p[:1].upper() + p[1:] for p in parts if p))
PY
)

  component_name="${pascal_name}${NAME_SUFFIX}"
  output_file="$OUTPUT_DIR/${component_name}.tsx"

  python - "$svg_file" "$output_file" "$component_name" <<'PY'
import re
import sys
from pathlib import Path

svg_path = Path(sys.argv[1])
out_path = Path(sys.argv[2])
component_name = sys.argv[3]

text = svg_path.read_text()

viewbox_match = re.search(r'<svg[^>]*viewBox="([^"]+)"', text)
viewbox = viewbox_match.group(1) if viewbox_match else "0 0 24 24"

inner = re.sub(r'^.*?<svg[^>]*>', '', text, flags=re.S)
inner = re.sub(r'</svg>.*$', '', inner, flags=re.S).strip()

inner = inner.replace("stroke-width", "strokeWidth")
inner = inner.replace("stroke-linecap", "strokeLinecap")
inner = inner.replace("stroke-linejoin", "strokeLinejoin")
inner = inner.replace("fill-rule", "fillRule")
inner = inner.replace("clip-rule", "clipRule")
inner = inner.replace("class=", "className=")

inner = re.sub(r'stroke="(?!none)[^"]+"', "stroke={color}", inner)
inner = re.sub(r'strokeWidth="[^"]+"', "strokeWidth={strokeWidth}", inner)

lines = []
for line in inner.splitlines():
  if line.strip():
    lines.append("    " + line.rstrip())

inner_block = "\n".join(lines)

content = f"""import * as React from \"react\";\n\nimport type {{ IconProps }} from \"./types\";\n\nconst {component_name} = ({{\n  size = 24,\n  color = \"currentColor\",\n  strokeWidth = 2,\n  ...props\n}}: IconProps) => (\n  <svg\n    width={{size}}\n    height={{size}}\n    viewBox=\"{viewbox}\"\n    fill=\"none\"\n    xmlns=\"http://www.w3.org/2000/svg\"\n    {{...props}}\n  >\n{inner_block}\n  </svg>\n);\n\nexport default {component_name};\n"""

out_path.write_text(content)
PY

  index_lines+=("export { default as ${component_name} } from \"./${component_name}\";")
done < <(find "$INPUT_DIR" -type f -name "*.svg" -print0 | sort -z)

{
  for line in "${index_lines[@]}"; do
    echo "$line"
  done
  echo "export type { IconProps } from \"./types\";"
} > "$OUTPUT_DIR/index.ts"

echo "Generated ${#index_lines[@]} icons in $OUTPUT_DIR"
