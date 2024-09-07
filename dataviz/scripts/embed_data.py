import pandas as pd
import numpy as np
from sentence_transformers import SentenceTransformer
import os
import argparse

def embed_data(model_name):
    data_dir = "data"
    input_file = "sentiment-analysis-for-mental-health.csv"
    output_file = "embedded_mental_health_data.csv"
    
    # Check if input file exists
    input_path = os.path.join(data_dir, input_file)
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found.")
        return

    # Load the data
    df = pd.read_csv(input_path)
    print(df.columns)
    print(f"Total rows: {len(df)}")

    # Convert 'statement' column to string and remove NaN values
    df["statement"] = df["statement"].astype(str)
    df = df.dropna(subset=["statement"])
    df = df[df["statement"] != "nan"]

    print(f"Rows after cleaning: {len(df)}")

    # Load the model
    model = SentenceTransformer(model_name)

    # Generate embeddings
    embeddings = model.encode(df["statement"].tolist())

    # Add embeddings to the dataframe
    df["embedding"] = embeddings.tolist()

    # Save the result
    output_path = os.path.join(data_dir, output_file)
    df.to_csv(output_path, index=False)
    print(f"Embedded data saved to {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Embed mental health data using a sentence transformer.")
    parser.add_argument("--model", default="all-mpnet-base-v2", help="Name of the sentence transformer model to use")
    args = parser.parse_args()

    embed_data(args.model)
