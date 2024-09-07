import pandas as pd
import numpy as np
import pacmap
import os
import argparse

def reduce_dimensions(n_components=3):
    data_dir = "data"
    input_file = "embedded_mental_health_data.csv"
    output_file = f"reduced_mental_health_data_pacmap_{n_components}d.csv"
    
    # Check if input file exists
    input_path = os.path.join(data_dir, input_file)
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found.")
        return

    # Load the data
    df = pd.read_csv(input_path)
    print(f"Total rows: {len(df)}")

    # Convert string representations of lists to numpy arrays
    embeddings = np.array([eval(embedding) for embedding in df["embedding"]])

    # Initialize PaCMAP
    reducer = pacmap.PaCMAP(n_components=n_components, n_neighbors=10, MN_ratio=0.5, FP_ratio=2.0)

    # Fit and transform the data
    reduced_embeddings = reducer.fit_transform(embeddings, init="pca")

    # Add reduced embeddings to the dataframe
    for i in range(n_components):
        df[f"pacmap_{i+1}"] = reduced_embeddings[:, i]

    # Remove the original high-dimensional embedding
    df = df.drop(columns=["embedding"])

    # Save the result
    output_path = os.path.join(data_dir, output_file)
    df.to_csv(output_path, index=False)
    print(f"Reduced data saved to {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reduce dimensions of embedded mental health data using PaCMAP.")
    parser.add_argument("--components", type=int, default=3, help="Number of components to reduce to")
    args = parser.parse_args()

    reduce_dimensions(args.components)
