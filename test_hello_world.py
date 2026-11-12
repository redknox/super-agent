import io
import unittest
from contextlib import redirect_stdout

from hello_world import greet, main


class HelloWorldTest(unittest.TestCase):
    def test_greet(self) -> None:
        self.assertEqual(greet(), "Hello, World!")
        self.assertEqual(greet("DeepSeek"), "Hello, DeepSeek!")

    def test_main_prints_greeting(self) -> None:
        buffer = io.StringIO()
        with redirect_stdout(buffer):
            main()
        self.assertEqual(buffer.getvalue(), "Hello, World!\n")


if __name__ == "__main__":
    unittest.main()
