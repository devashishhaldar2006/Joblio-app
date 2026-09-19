"""
Automated test suite for Module 6 — Job Market Demand Forecaster ML Pipeline.
Tests exact skill extraction, ARIMA, Prophet, Linear Regression, and trend classification.
"""

import sys
import unittest
import numpy as np

from utils.skill_dictionary import normalize_skill, get_all_skills, TOTAL_SKILLS_COUNT
from agents.market.skill_extractor import extract_skills_from_single_jd, extract_skills_from_jobs
from agents.market.forecast_engine import (
    forecast_skill,
    _run_linear_regression_forecast,
    _run_arima_forecast,
    _run_prophet_forecast
)
from agents.market.trend_classifier import classify_trend
from agents.market.gap_analyzer import analyze_skill_gap

class TestMarketML(unittest.TestCase):

    def test_skill_dictionary_count(self):
        skills = get_all_skills()
        self.assertGreaterEqual(len(skills), 500, f"Expected 500+ skills, found {len(skills)}")
        self.assertEqual(normalize_skill("k8s"), "Kubernetes")
        self.assertEqual(normalize_skill("py"), "Python")
        self.assertEqual(normalize_skill("postgres"), "PostgreSQL")
        print(f"[PASS] Skill dictionary verified with {len(skills)} skills and aliases.")

    def test_nlp_extraction(self):
        sample_jd = """
        We are seeking a Senior Backend Engineer proficient in Python, FastAPI, and PostgreSQL.
        You must have solid experience with Kubernetes, Docker, and AWS Lambda.
        Familiarity with LangChain and vector databases like ChromaDB is a huge plus.
        """
        found_skills, emerging = extract_skills_from_single_jd(sample_jd)
        self.assertIn("Python", found_skills)
        self.assertIn("FastAPI", found_skills)
        self.assertIn("PostgreSQL", found_skills)
        self.assertIn("Kubernetes", found_skills)
        self.assertIn("Docker", found_skills)
        self.assertIn("AWS Lambda", found_skills)
        self.assertIn("LangChain", found_skills)
        self.assertIn("ChromaDB", found_skills)
        print(f"[PASS] NLP Extraction extracted {len(found_skills)} canonical skills from sample JD.")

    def test_linear_regression_forecast(self):
        weeks = [f"2026-W{i:02d}" for i in range(1, 9)]
        dates = [f"2026-01-{i*3:02d}" for i in range(1, 9)]
        percentages = [40.0 + i * 1.5 for i in range(8)]

        series, conf = _run_linear_regression_forecast(weeks, dates, percentages, weeks_ahead=26)
        self.assertEqual(len(series), 26)
        self.assertGreater(series[-1]["predicted"], series[0]["predicted"])
        self.assertGreater(conf, 0.3)
        print(f"[PASS] Linear Regression predicted 26 weeks ahead with conf {conf}.")

    def test_arima_forecast(self):
        weeks = [f"2026-W{i:02d}" for i in range(1, 15)]
        dates = [f"2026-01-{i*2:02d}" for i in range(1, 15)]
        percentages = [30.0 + 2.0 * np.sin(i) + i * 0.5 for i in range(14)]

        series, conf = _run_arima_forecast(weeks, dates, percentages, weeks_ahead=26)
        self.assertEqual(len(series), 26)
        self.assertGreater(conf, 0.3)
        print(f"[PASS] ARIMA model fit and predicted 26 weeks ahead with conf {conf}.")

    def test_prophet_forecast(self):
        weeks = [f"2026-W{i:02d}" for i in range(1, 20)]
        dates = [f"2026-01-{i:02d}" for i in range(1, 20)]
        percentages = [50.0 + i * 0.8 for i in range(19)]

        series, conf = _run_prophet_forecast(weeks, dates, percentages, weeks_ahead=26)
        self.assertEqual(len(series), 26)
        self.assertGreater(conf, 0.4)
        print(f"[PASS] Facebook Prophet fitted and forecasted 26 weeks with conf {conf}.")

    def test_trend_classification(self):
        # Rising
        fc_rising = {"skill": "Python", "current_percentage": 50.0, "forecast_percentage_6m": 62.0, "confidence": 0.85, "forecast_series": []}
        c_rising = classify_trend(fc_rising)
        self.assertEqual(c_rising["trend"], "RISING")

        # Declining
        fc_declining = {"skill": "jQuery", "current_percentage": 20.0, "forecast_percentage_6m": 15.0, "confidence": 0.85, "forecast_series": []}
        c_declining = classify_trend(fc_declining)
        self.assertEqual(c_declining["trend"], "DECLINING")

        # Dying
        fc_dying = {"skill": "Flash", "current_percentage": 10.0, "forecast_percentage_6m": 5.0, "confidence": 0.85, "forecast_series": []}
        c_dying = classify_trend(fc_dying)
        self.assertEqual(c_dying["trend"], "DYING")

        # Emerging
        fc_emerging = {"skill": "Mamba", "current_percentage": 2.0, "forecast_percentage_6m": 4.0, "confidence": 0.85, "forecast_series": []}
        c_emerging = classify_trend(fc_emerging)
        self.assertEqual(c_emerging["trend"], "EMERGING")
        print("[PASS] All trend classification rules verified.")

if __name__ == "__main__":
    unittest.main()
