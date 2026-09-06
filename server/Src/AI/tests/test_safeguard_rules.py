import unittest

from app.chat.utils.safeguard_rules import check_safeguard


class SafeguardRulesTest(unittest.TestCase):
    def test_emergency_symptoms_block(self):
        cases = [
            "درد شدید قفسه سینه دارم",
            "تنگی نفس شدید دارم یه دکتر پیدا کن",
            "نفس نمی کشم کمک کن",
            "تشنج دارم",
            "علائم سکته دارم",
            "117 بگیر",
            "فوری کمک میخوام",
        ]
        for text in cases:
            with self.subTest(text=text):
                blocked, reason, message = check_safeguard(text)
                self.assertTrue(blocked, msg=text)
                self.assertEqual(reason, "emergency")
                self.assertTrue(message)

    def test_crisis_blocks(self):
        cases = [
            "میخوام بمیرم",
            "می خواهم بمیرم",
            "فکر خودکشی دارم",
            "دیگه نمیخوام زنده بمونم",
        ]
        for text in cases:
            with self.subTest(text=text):
                blocked, reason, message = check_safeguard(text)
                self.assertTrue(blocked, msg=text)
                self.assertEqual(reason, "crisis")
                self.assertTrue(message)

    def test_faq_about_emergency_does_not_block(self):
        cases = [
            "آیا پذیرش۲۴ برای شرایط اورژانسی مناسب است؟",
            "چه شرایطی اورژانسی محسوب می‌شوند؟",
            "آیا در شرایط اورژانسی می‌توانم از ویزیت آنلاین استفاده کنم؟",
            "اورژانس چیه؟",
        ]
        for text in cases:
            with self.subTest(text=text):
                blocked, reason, message = check_safeguard(text)
                self.assertFalse(blocked, msg=text)
                self.assertEqual(reason, "")
                self.assertEqual(message, "")

    def test_normal_messages_pass(self):
        cases = [
            "",
            "سلام",
            "یه دکتر تو تهران پیدا کن",
            "چطور نوبتم رو لغو کنم؟",
            "پذیرش۲۴ چیست؟",
        ]
        for text in cases:
            with self.subTest(text=text):
                blocked, reason, message = check_safeguard(text)
                self.assertFalse(blocked, msg=text)
                self.assertEqual(reason, "")
                self.assertEqual(message, "")

    def test_crisis_takes_priority_over_faq_patterns(self):
        blocked, reason, _ = check_safeguard("می‌خوام بمیرم، راهنماییم کن")
        self.assertTrue(blocked)
        self.assertEqual(reason, "crisis")


if __name__ == "__main__":
    unittest.main()
