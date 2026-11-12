import unittest

from fibonacci import fibonacci


class FibonacciTest(unittest.TestCase):
    def test_examples_from_issue(self) -> None:
        self.assertEqual(fibonacci(1), 1)
        self.assertEqual(fibonacci(2), 1)
        self.assertEqual(fibonacci(3), 2)
        self.assertEqual(fibonacci(4), 3)

    def test_sequence(self) -> None:
        self.assertEqual(
            [fibonacci(n) for n in range(1, 11)],
            [1, 1, 2, 3, 5, 8, 13, 21, 34, 55],
        )

    def test_large_value(self) -> None:
        self.assertEqual(fibonacci(100), 354224848179261915075)

    def test_rejects_zero_and_negative(self) -> None:
        for n in (0, -1, -100):
            with self.assertRaises(ValueError):
                fibonacci(n)

    def test_rejects_non_integer(self) -> None:
        for n in (1.5, "3", None):
            with self.assertRaises(TypeError):
                fibonacci(n)


if __name__ == "__main__":
    unittest.main()
