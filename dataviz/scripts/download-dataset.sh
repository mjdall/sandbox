#!/bin/bash

set -e


FILENAME=sentiment-analysis-for-mental-health.zip
OUTPUTDIR=data

mkdir -p "$OUTPUTDIR"

kaggle datasets download suchintikasarkar/sentiment-analysis-for-mental-health -p "$OUTPUTDIR"

# Check if the file doesn't exist
if [ ! -f "$OUTPUTDIR/$FILENAME" ]; then
    echo "Error: $OUTPUTDIR/$FILENAME not found. Download may have failed."
    exit 1
fi

# If we reach here, the file exists, so we can proceed with extraction
unzip -o "$OUTPUTDIR/$FILENAME" -d "$OUTPUTDIR"
rm "$OUTPUTDIR/$FILENAME"

mv "$OUTPUTDIR/Combined Data.csv" "$OUTPUTDIR/sentiment-analysis-for-mental-health.csv"
