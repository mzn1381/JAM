import unittest

from app.chat.models.models import GraphState
from app.chat.nodes.safeguard_node import safeguard_node, route_after_safeguard
from app.chat.utils.metrics import get_safeguard_stats, reset_safeguard_stats


class SafeguardMetricsTest(unittest.TestCase):
    def setUp(self):
        reset_safeguard_stats()

    def test_block_increments_metrics(self):
        state = GraphState(session_id="s1", user_input="تشنج دارم")
        safeguard_node(state)

        stats = get_safeguard_stats()
        self.assertTrue(state.safeguard_blocked)
        self.assertEqual(state.safeguard_reason, "emergency")
        self.assertEqual(stats["total_blocks"], 1)
        self.assertEqual(stats["blocks_by_reason"]["emergency"], 1)

    def test_pass_increments_metrics(self):
        state = GraphState(session_id="s2", user_input="سلام")
        safeguard_node(state)

        stats = get_safeguard_stats()
        self.assertFalse(state.safeguard_blocked)
        self.assertEqual(stats["total_passes"], 1)
        self.assertEqual(stats["total_blocks"], 0)

    def test_route_after_safeguard(self):
        blocked_state = GraphState(
            session_id="s3",
            user_input="x",
            safeguard_blocked=True,
        )
        passed_state = GraphState(session_id="s4", user_input="x")

        self.assertEqual(route_after_safeguard(blocked_state), "blocked")
        self.assertEqual(route_after_safeguard(passed_state), "continue")


if __name__ == "__main__":
    unittest.main()
