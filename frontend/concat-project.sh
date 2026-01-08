#!/bin/bash

OUTPUT_FILE="project_dump.txt"

# Nettoyage ancien fichier
rm -f "$OUTPUT_FILE"

# Dossiers à exclure
EXCLUDE_DIRS=(
  "node_modules"
  "dist"
  ".angular"
  ".git"
  ".vscode"
  "coverage"
)

# Extensions utiles (Angular / Node / config)
INCLUDE_EXTENSIONS=(
  "ts"
  "js"
  "json"
  "html"
  "css"
  "scss"
  "md"
  "yml"
  "yaml"
  "env"
)

# Construire l'expression find
FIND_CMD="find . -type f"

for dir in "${EXCLUDE_DIRS[@]}"; do
  FIND_CMD+=" ! -path \"./$dir/*\""
done

EXT_EXPR=""
for ext in "${INCLUDE_EXTENSIONS[@]}"; do
  EXT_EXPR+=" -o -name \"*.$ext\""
done

EXT_EXPR="${EXT_EXPR# -o }"
FIND_CMD+=" \\( $EXT_EXPR \\)"

# Exécution
eval $FIND_CMD | sort | while read -r file; do
  echo "///////////////////////////////////////////////////" >> "$OUTPUT_FILE"
  echo "// ${file#./}" >> "$OUTPUT_FILE"
  echo "///////////////////////////////////////////////////" >> "$OUTPUT_FILE"
  echo "" >> "$OUTPUT_FILE"

  cat "$file" >> "$OUTPUT_FILE"
  echo -e "\n\n" >> "$OUTPUT_FILE"
done

echo "✅ Projet concaténé dans $OUTPUT_FILE"
