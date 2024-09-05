import autograd.numpy as np
from autograd import jacobian

# Define a simple function f(x) with two inputs and two outputs
def f(x):
    return np.array([x[0]**2 + 2*x[1], 3*x[0] + np.sin(x[1])])

# Example input vector
x = np.array([1.0, 2.0])

# Compute the Jacobian matrix of the function f at point x
J_f = jacobian(f)

# Get the Jacobian at the specific point
J = J_f(x)

print("Jacobian matrix at x =", x)
print(J)

# Define a small change in the input vector (dx)
dx = np.array([0.01, 0.01])

# Compute the approximate change in the output (dy) using the Jacobian
dy = J @ dx  # @ is matrix multiplication

print("\nChange in input (dx):", dx)
print("Corresponding change in output (dy):", dy)

# Original output of the function
original_output = f(x)
new_output = f(x + dx)

print("\nOriginal output:", original_output)
print("New output after applying dx:", new_output)
print("Predicted output change using Jacobian (dy):", original_output + dy)
