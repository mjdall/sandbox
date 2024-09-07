import pandas as pd
import numpy as np
import pacmap
import os
import argparse
from sklearn.neighbors import NearestNeighbors

def calculate_density(embeddings, k=20, low_percentile=0.02, high_percentile=0.98):
    nn = NearestNeighbors(n_neighbors=k+1)  # +1 because the point itself is included
    nn.fit(embeddings)
    distances, _ = nn.kneighbors(embeddings)
    density = 1 / np.mean(distances[:, 1:], axis=1)  # Exclude the first distance (to itself)
    
    # Use low_percentile and high_percentile for normalization
    min_density = np.percentile(density, low_percentile * 100)
    max_density = np.percentile(density, high_percentile * 100)
    
    normalized_density = (density - min_density) / (max_density - min_density)
    
    # Clip values to ensure they're between 0 and 1
    normalized_density = np.clip(normalized_density, 0, 1)
    
    return normalized_density

def reduce_dimensions(n_components=3, k_neighbors=20, low_percentile=0.02, high_percentile=0.98):
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

    # Calculate density
    density = calculate_density(reduced_embeddings, k=k_neighbors, low_percentile=low_percentile, high_percentile=high_percentile)

    # Add reduced embeddings and density to the dataframe
    for i in range(n_components):
        df[f"pacmap_{i+1}"] = reduced_embeddings[:, i]
    df["density"] = density
    print(f"Density: min={density.min():.4f}, max={density.max():.4f}, mean={density.mean():.4f}")
    print(f"Density percentiles: {low_percentile*100}th={np.percentile(density, low_percentile*100):.4f}, {high_percentile*100}th={np.percentile(density, high_percentile*100):.4f}")

    # Remove the original high-dimensional embedding
    df = df.drop(columns=["embedding"])

    # Save the result
    output_path = os.path.join(data_dir, output_file)
    df.to_csv(output_path, index=False)
    print(f"Reduced data saved to {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reduce dimensions of embedded mental health data using PaCMAP.")
    parser.add_argument("--components", type=int, default=3, help="Number of components to reduce to")
    parser.add_argument("--k_neighbors", type=int, default=20, help="Number of neighbors for density calculation")
    parser.add_argument("--low_percentile", type=float, default=0.02, help="Lower percentile for density normalization")
    parser.add_argument("--high_percentile", type=float, default=0.98, help="Higher percentile for density normalization")
    args = parser.parse_args()

    reduce_dimensions(args.components, args.k_neighbors, args.low_percentile, args.high_percentile)
