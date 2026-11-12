#!/usr/bin/env python3
"""Fibonacci sequence helper."""


def fibonacci(n: int) -> int:
    """Return the *n*-th Fibonacci number, using 1-based indexing.

    The sequence starts ``1, 1, 2, 3, 5, ...``, so ``fibonacci(1)`` and
    ``fibonacci(2)`` are both ``1``.

    Raises:
        TypeError: If *n* is not an integer.
        ValueError: If *n* is not a positive integer.
    """
    if not isinstance(n, int):
        raise TypeError("n must be an integer")
    if n <= 0:
        raise ValueError("n must be a positive integer")

    previous, current = 0, 1
    for _ in range(n):
        previous, current = current, previous + current
    return previous
