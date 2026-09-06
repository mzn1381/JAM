import unittest
from unittest.mock import MagicMock, patch

from app.chat.utils.faq_data import load_faq_entries
from app.chat.utils.faq_retriever import FAQRetriever, init_faq_retriever, get_faq_retriever
from app.chat.utils.faq_vector_store import FAQVectorStore


class LoadFaqEntriesTest(unittest.TestCase):
    def test_load_entries_from_csv(self):
        entries = load_faq_entries()
        self.assertGreater(len(entries), 0)
        question, answer = entries[0]
        self.assertTrue(question)
        self.assertTrue(answer)


class FAQVectorStoreTest(unittest.TestCase):
    def setUp(self):
        self.llm = MagicMock()
        self.llm.embedding_model = "text-embedding-3-small"
        self.llm.embed_batch.return_value = [[0.1, 0.2], [0.3, 0.4]]
        self.llm.embed.return_value = [0.5, 0.6]

    @patch("app.chat.utils.faq_vector_store.chromadb.PersistentClient")
    def test_query_returns_entries_with_scores(self, mock_client_cls):
        mock_collection = MagicMock()
        mock_collection.count.return_value = 2
        mock_collection.get.return_value = {"ids": []}
        mock_collection.query.return_value = {
            "metadatas": [[
                {"question": "سوال ۱", "answer": "پاسخ ۱"},
                {"question": "سوال ۲", "answer": "پاسخ ۲"},
            ]],
            "distances": [[0.2, 0.5]],
        }
        mock_client_cls.return_value.get_or_create_collection.return_value = mock_collection

        with patch.object(FAQVectorStore, "_needs_reindex", return_value=False):
            store = FAQVectorStore(llm=self.llm)
            store.embedder = MagicMock()
            store.embedder.active_provider = "api"
            store.embedder.embed.return_value = [0.5, 0.6]

        results = store.query("how to book", top_k=2)

        self.assertEqual(len(results), 2)
        self.assertEqual(results[0].question, "سوال ۱")
        self.assertAlmostEqual(results[0].score, 0.8)
        store.embedder.embed.assert_called_once()


class FAQRetrieverInitTest(unittest.TestCase):
    def test_init_and_get_retriever(self):
        llm = MagicMock()
        init_faq_retriever(llm)
        retriever = get_faq_retriever()
        self.assertIsInstance(retriever, FAQRetriever)

    @patch("app.chat.utils.faq_retriever.FAQVectorStore")
    def test_retrieve_uses_text_fallback_when_vector_unavailable(self, mock_store_cls):
        mock_store = MagicMock()
        mock_store.ensure_index.return_value = False
        mock_store.is_ready.return_value = False
        mock_store_cls.return_value = mock_store

        llm = MagicMock()
        retriever = FAQRetriever(llm=llm)
        results = retriever.retrieve("cancel appointment", top_k=1)

        self.assertGreater(len(results), 0)
        mock_store.query.assert_not_called()


if __name__ == "__main__":
    unittest.main()
