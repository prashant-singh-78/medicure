"""
Medicure Phase 11 Gemini Vision & Multi-Modal Integration Test Suite
===================================================================
Tests visual symptom analysis, medical report analyzer, and Gemini friend chat.
Directly invokes route handlers without requiring httpx or TestClient.
"""

import os
import sys
import unittest
import asyncio
import io
from PIL import Image, ImageDraw

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from fastapi import HTTPException, UploadFile
from app.routes import visual_check as visual_check_module
from app.routes import report as report_module
from app.routes import friend_chat as friend_chat_module

class TestPhase11VisionAndGemini(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # 1. Create synthetic symptom rash test image (250x250)
        rash_img = Image.new("RGB", (250, 250), color=(245, 230, 215))
        draw = ImageDraw.Draw(rash_img)
        draw.ellipse([80, 80, 170, 170], fill=(225, 75, 75))
        draw.ellipse([100, 100, 150, 150], fill=(200, 50, 50))
        rash_buf = io.BytesIO()
        rash_img.save(rash_buf, format="JPEG")
        cls.rash_bytes = rash_buf.getvalue()

        # 2. Create synthetic lab pathology report image (400x250)
        report_img = Image.new("RGB", (400, 250), color=(255, 255, 255))
        d_rep = ImageDraw.Draw(report_img)
        d_rep.text((20, 20), "CITY PATHOLOGY LABORATORY", fill=(0, 50, 150))
        d_rep.text((20, 50), "PATIENT CBC REPORT", fill=(0, 0, 0))
        d_rep.text((20, 80), "Hemoglobin: 13.8 g/dL (Normal: 12.0 - 15.5)", fill=(0, 0, 0))
        d_rep.text((20, 110), "WBC Count: 6,800 /mcL (Normal: 4,500 - 11,000)", fill=(0, 0, 0))
        d_rep.text((20, 140), "Platelet Count: 280,000 /mcL (Normal: 150,000 - 450,000)", fill=(0, 0, 0))
        d_rep.text((20, 170), "Status: All values within normal reference limits.", fill=(0, 120, 0))
        report_buf = io.BytesIO()
        report_img.save(report_buf, format="JPEG")
        cls.report_bytes = report_buf.getvalue()

    def test_01_visual_check_valid_image(self):
        """POST /api/visual-check/analyze succeeds with structured analysis."""
        up_file = UploadFile(filename="symptom.jpg", file=io.BytesIO(self.rash_bytes))
        result = asyncio.run(visual_check_module.analyze_visual_symptom(file=up_file))
        self.assertEqual(result.get("status"), "success")
        self.assertIn("analysis", result)
        self.assertGreater(len(result["analysis"]), 20)

    def test_02_visual_check_empty_file_rejected(self):
        """POST /api/visual-check/analyze returns HTTP 400 on empty file upload."""
        up_empty = UploadFile(filename="empty.jpg", file=io.BytesIO(b""))
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(visual_check_module.analyze_visual_symptom(file=up_empty))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Empty image file", ctx.exception.detail)

    def test_03_visual_check_invalid_format_rejected(self):
        """POST /api/visual-check/analyze returns HTTP 400 on non-image file."""
        up_corrupt = UploadFile(filename="not_image.txt", file=io.BytesIO(b"Not an image"))
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(visual_check_module.analyze_visual_symptom(file=up_corrupt))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("not a valid image format", ctx.exception.detail)

    def test_04_report_analyzer_valid_image(self):
        """POST /api/report/analyze extracts pathology findings with HTTP 200 equivalent."""
        up_report = UploadFile(filename="cbc_report.jpg", file=io.BytesIO(self.report_bytes))
        result = asyncio.run(report_module.analyze_report(file=up_report))
        self.assertEqual(result.get("status"), "success")
        self.assertIn("analysis", result)
        self.assertGreater(len(result["analysis"]), 20)

    def test_05_report_analyzer_pdf_rejection(self):
        """POST /api/report/analyze rejects raw PDF with HTTP 400."""
        up_pdf = UploadFile(filename="report.pdf", file=io.BytesIO(b"%PDF-1.4 Mock PDF"))
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(report_module.analyze_report(file=up_pdf))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("PDF", ctx.exception.detail)

    def test_06_friend_chat_gemini_integration(self):
        """POST /api/friend-chat/message generates AI conversation for health inquiry."""
        req = friend_chat_module.ChatRequest(
            message="What are basic recommendations to improve sleep quality?",
            history=[]
        )
        result = friend_chat_module.send_message(req)
        self.assertIn("reply", result)
        self.assertGreater(len(result["reply"]), 10)
        self.assertFalse(result.get("is_emergency", True))

if __name__ == "__main__":
    unittest.main()
