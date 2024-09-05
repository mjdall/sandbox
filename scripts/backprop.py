import torch
import fire
import plotext as plt
from rich.console import Console
from rich.progress import track
import time

console = Console()

def generate_dataset(name, train_ratio=0.8):
    if name == "linear":
        x = torch.linspace(0, 10, 100).unsqueeze(1)
        y = 2 * x + torch.randn_like(x) * 0.1
    elif name == "quadratic":
        x = torch.linspace(-5, 5, 100).unsqueeze(1)
        y = x**2 + torch.randn_like(x) * 0.5
    elif name == "sine":
        x = torch.linspace(0, 4*torch.pi, 100).unsqueeze(1)
        y = torch.sin(x) + torch.randn_like(x) * 0.1
    elif name == "noisy_linear":
        x = torch.linspace(0, 10, 100).unsqueeze(1)
        y = 2 * x + torch.randn_like(x) * 1.0
    else:
        raise ValueError(f"Unknown dataset: {name}")
    
    # Split into train and validation sets
    train_size = int(len(x) * train_ratio)
    x_train, x_val = x[:train_size], x[train_size:]
    y_train, y_val = y[:train_size], y[train_size:]
    
    return (x_train, y_train), (x_val, y_val)

def train(epochs=100, delay=0.1, dataset="linear", hidden_size=10, patience=10):
    (x_train, y_train), (x_val, y_val) = generate_dataset(dataset)

    if dataset in ["linear", "noisy_linear"]:
        model = torch.nn.Linear(1, 1)
    else:
        model = torch.nn.Sequential(
            torch.nn.Linear(1, hidden_size),
            torch.nn.ReLU(),
            torch.nn.Linear(hidden_size, 1)
        )

    loss_fn = torch.nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=0.01)

    train_losses = []
    val_losses = []
    epochs_list = []
    best_val_loss = float('inf')
    epochs_without_improvement = 0

    for epoch in track(range(epochs), description="Training"):
        # Training
        model.train()
        predicted_y = model(x_train)
        train_loss = loss_fn(predicted_y, y_train)

        optimizer.zero_grad()
        train_loss.backward()
        optimizer.step()

        # Validation
        model.eval()
        with torch.no_grad():
            val_predicted_y = model(x_val)
            val_loss = loss_fn(val_predicted_y, y_val)

        train_losses.append(train_loss.item())
        val_losses.append(val_loss.item())
        epochs_list.append(epoch)

        if val_loss.item() < best_val_loss:
            best_val_loss = val_loss.item()
            epochs_without_improvement = 0
        else:
            epochs_without_improvement += 1

        if epoch % 5 == 0 or epoch == epochs - 1:
            plt.clf()
            plt.plot(epochs_list, train_losses, label="Train Loss", marker="dot")
            plt.plot(epochs_list, val_losses, label="Validation Loss", marker="dot")
            plt.title(f"Training and Validation Loss - {dataset.capitalize()} Dataset")
            plt.xlabel("Epoch")
            plt.ylabel("Loss")
            plt.show()
            console.print(f"Epoch {epoch}, Train Loss: {train_loss.item():.6f}, Val Loss: {val_loss.item():.6f}")

        if epochs_without_improvement >= patience:
            console.print(f"[bold yellow]Early stopping at epoch {epoch}[/bold yellow]")
            break

        time.sleep(delay)

    console.print(f"[bold green]Final train loss:[/bold green] {train_loss.item():.6f}")
    console.print(f"[bold green]Final validation loss:[/bold green] {val_loss.item():.6f}")

    # Plot the final predictions
    plt.clf()
    plt.scatter(x_train.squeeze().tolist(), y_train.squeeze().tolist(), label="Train Data", marker="dot")
    plt.scatter(x_val.squeeze().tolist(), y_val.squeeze().tolist(), label="Validation Data", marker="cross")
    x_all = torch.cat([x_train, x_val]).sort()[0]
    y_pred = model(x_all).detach()
    plt.plot(x_all.squeeze().tolist(), y_pred.squeeze().tolist(), label="Predicted", marker="small dot")
    plt.title(f"Final Predictions - {dataset.capitalize()} Dataset")
    plt.xlabel("x")
    plt.ylabel("y")
    plt.show()

    # Print legend manually
    console.print("[bold]Legend:[/bold]")
    console.print("• Train Data: dot marker")
    console.print("+ Validation Data: cross marker")
    console.print("· Predicted: small dot marker")

if __name__ == "__main__":
    fire.Fire(train)
